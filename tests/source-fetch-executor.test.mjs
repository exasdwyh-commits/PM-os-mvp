import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MemoryStorage } from '../src/storage/memory-storage.mjs';
import { CapabilityGateway } from '../src/core/capability-gateway.mjs';
import { SourceFetchExecutor } from '../src/core/source-fetch-executor.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicResolver=async()=>[{address:'93.184.216.34',family:4}];
const textHeaders={'content-type':'text/plain','content-encoding':'identity'};

function executor({resolver=publicResolver,requestImpl}={}){
  return new SourceFetchExecutor({
    gateway:new CapabilityGateway(path.join(root,'config/policies.json')),
    storage:new MemoryStorage(),
    actor:'principal',
    resolver,
    requestImpl
  });
}

test('source fetcher blocks unclassified or HTTP domains before network access',async()=>{
  let calls=0;
  const ex=executor({requestImpl:async()=>{calls++;throw new Error('must-not-run');}});
  const result=await ex.fetch({taskId:'TSK-1',runId:'RUN-1',url:'http://127.0.0.1/private'});
  assert.equal(result.status,'blocked');
  assert.equal(calls,0);
});

test('source fetcher allows exact allowlisted HTTPS host with public pinned IP',async()=>{
  let calls=0;
  const ex=executor({requestImpl:async({pinned})=>{
    calls++;
    return {status:200,headers:textHeaders,body:'official content',remoteAddress:pinned[0].address};
  }});
  const result=await ex.fetch({taskId:'TSK-1',runId:'RUN-1',url:'https://www.fda.gov/example'});
  assert.equal(result.status,'ok');
  assert.equal(result.output.trustTier,'OFFICIAL');
  assert.equal(result.output.remoteAddress,'93.184.216.34');
  assert.equal(calls,1);
});

for (const address of ['127.0.0.1','10.0.0.1','169.254.169.254','::1']) {
  test(`source fetch rejects non-public resolved address ${address} before request`,async()=>{
    let calls=0;
    const ex=executor({
      resolver:async()=>[{address,family:address.includes(':')?6:4}],
      requestImpl:async()=>{calls++;throw new Error('must-not-run');}
    });
    const result=await ex.fetch({taskId:'T',runId:'R',url:'https://www.fda.gov/example'});
    assert.equal(result.status,'failed');
    assert.equal(result.reason,'source-address-not-public');
    assert.equal(calls,0);
  });
}

test('allowlisted source cannot redirect to untrusted domain',async()=>{
  let calls=0;
  const ex=executor({requestImpl:async({pinned})=>{
    calls++;
    return {
      status:302,
      headers:{location:'https://evil.example.com/private'},
      body:'',
      remoteAddress:pinned[0].address
    };
  }});
  const result=await ex.fetch({taskId:'T',runId:'R',url:'https://www.fda.gov/open-redirect'});
  assert.equal(result.status,'failed');
  assert.equal(result.reason,'source-domain-not-allowlisted');
  assert.equal(calls,1);
});

test('pinned connection rejects mismatched remote address',async()=>{
  const ex=executor({requestImpl:async()=>({
    status:200,headers:textHeaders,body:'x',remoteAddress:'93.184.216.35'
  })});
  const result=await ex.fetch({taskId:'T',runId:'R',url:'https://www.fda.gov/example'});
  assert.equal(result.status,'failed');
  assert.equal(result.reason,'source-remote-address-mismatch');
});

test('binary and compressed content are rejected',async()=>{
  const binary=executor({requestImpl:async({pinned})=>({
    status:200,headers:{'content-type':'application/octet-stream'},body:'binary',remoteAddress:pinned[0].address
  })});
  const a=await binary.fetch({taskId:'T',runId:'R',url:'https://www.fda.gov/a'});
  assert.equal(a.reason,'source-content-type-not-allowed');

  const gzip=executor({requestImpl:async({pinned})=>({
    status:200,headers:{'content-type':'text/plain','content-encoding':'gzip'},body:'compressed',remoteAddress:pinned[0].address
  })});
  const b=await gzip.fetch({taskId:'T',runId:'R',url:'https://www.fda.gov/b'});
  assert.equal(b.reason,'source-compressed-content-rejected');
});

test('empty success response is rejected',async()=>{
  const ex=executor({requestImpl:async({pinned})=>({
    status:204,headers:textHeaders,body:'',remoteAddress:pinned[0].address
  })});
  const result=await ex.fetch({taskId:'T',runId:'R',url:'https://www.fda.gov/empty'});
  assert.equal(result.reason,'source-empty-content');
});
