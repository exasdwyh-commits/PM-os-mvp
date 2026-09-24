import { createHash } from 'node:crypto';
import { classifySourceUrl } from './source-trust.mjs';
import { scanExternalText } from './untrusted-content.mjs';

async function readLimitedBody(response,maxBytes){
  if (!response.body?.getReader) {
    const text=(await response.text()).slice(0,maxBytes);
    return text;
  }
  const reader=response.body.getReader();
  const decoder=new TextDecoder();
  let total=0;
  let text='';
  while(true){
    const {done,value}=await reader.read();
    if(done) break;
    total += value.byteLength;
    if(total > maxBytes){
      const allowed=value.slice(0,Math.max(0,value.byteLength-(total-maxBytes)));
      text += decoder.decode(allowed,{stream:true});
      try { await reader.cancel(); } catch {}
      break;
    }
    text += decoder.decode(value,{stream:true});
  }
  text += decoder.decode();
  return text;
}

function assertAllowedUrl(url){
  const classified=classifySourceUrl(url);
  if(!classified.host) throw new Error('invalid-source-url');
  if(!['OFFICIAL','PRIMARY','REPUTABLE'].includes(classified.trustTier)){
    throw new Error('source-domain-not-allowlisted');
  }
  return classified;
}

export async function fetchSource({
  url,
  fetchImpl=globalThis.fetch,
  timeoutMs=6000,
  maxBytes=131072,
  maxRedirects=3
}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  let currentUrl=url;
  let redirects=0;

  try{
    while(true){
      assertAllowedUrl(currentUrl);
      const response=await fetchImpl(currentUrl,{
        method:'GET',
        redirect:'manual',
        signal:controller.signal,
        headers:{'user-agent':'PM-OS-EvidenceFetcher/0.1'}
      });

      if(response.status >= 300 && response.status < 400){
        const location=response.headers?.get?.('location');
        if(!location) throw new Error('redirect-without-location');
        if(redirects >= maxRedirects) throw new Error('too-many-redirects');
        currentUrl=new URL(location,currentUrl).toString();
        assertAllowedUrl(currentUrl);
        redirects++;
        continue;
      }

      const declared=Number(response.headers?.get?.('content-length') ?? 0);
      if(declared && declared > maxBytes) throw new Error('source-too-large');
      const raw=await readLimitedBody(response,maxBytes);
      const scan=scanExternalText(raw);
      const finalUrl=response.url || currentUrl;
      const finalClass=assertAllowedUrl(finalUrl);

      return {
        url:finalUrl,
        requestedUrl:url,
        redirectCount:redirects,
        httpStatus:response.status,
        ok:response.ok,
        fetchedAt:new Date().toISOString(),
        contentHash:createHash('sha256').update(raw,'utf8').digest('hex'),
        rawContentPreview:scan.text.slice(0,12000),
        injectionScanResult:{quarantined:scan.quarantined,flags:scan.flags},
        sourceType:finalClass.sourceType,
        trustTier:scan.quarantined ? 'QUARANTINED' : finalClass.trustTier,
        host:finalClass.host
      };
    }
  } finally {
    clearTimeout(timer);
  }
}
