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

export async function fetchSource({url,fetchImpl=globalThis.fetch,timeoutMs=6000,maxBytes=131072}){
  const classified=classifySourceUrl(url);
  if(!classified.host) throw new Error('invalid-source-url');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetchImpl(url,{
      method:'GET',
      redirect:'follow',
      signal:controller.signal,
      headers:{'user-agent':'PM-OS-EvidenceFetcher/0.1'}
    });
    const declared=Number(response.headers?.get?.('content-length') ?? 0);
    if(declared && declared > maxBytes) throw new Error('source-too-large');
    const raw=await readLimitedBody(response,maxBytes);
    const scan=scanExternalText(raw);
    const finalUrl=response.url || url;
    const finalClass=classifySourceUrl(finalUrl);
    return {
      url:finalUrl,
      requestedUrl:url,
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
  } finally {
    clearTimeout(timer);
  }
}
