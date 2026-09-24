import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MemoryStorage } from '../src/storage/memory-storage.mjs';
import { CapabilityGateway } from '../src/core/capability-gateway.mjs';
import { SourceFetchExecutor } from '../src/core/source-fetch-executor.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('source fetcher blocks unclassified domains before network access',async()=>{
  const storage=new MemoryStorage();
  const gateway=new CapabilityGateway(path.join(root,'config/policies.json'));
  let calls=0;
  const executor=new SourceFetchExecutor({
    gateway,storage,actor:'principal',
    fetchImpl:async()=>{calls++;return new Response('x',{status:200});}
  });
  const result=await executor.fetch({
    taskId:'TSK-1',runId:'RUN-1',url:'http://127.0.0.1:8787/private'
  });
  assert.equal(result.status,'blocked');
  assert.equal(result.reason,'source-domain-not-allowlisted');
  assert.equal(calls,0);
});

test('source fetcher allows an allowlisted official domain through ToolBroker',async()=>{
  const storage=new MemoryStorage();
  const gateway=new CapabilityGateway(path.join(root,'config/policies.json'));
  let calls=0;
  const executor=new SourceFetchExecutor({
    gateway,storage,actor:'principal',
    fetchImpl:async()=>{calls++;return new Response('official content',{status:200});}
  });
  const result=await executor.fetch({
    taskId:'TSK-1',runId:'RUN-1',url:'https://www.fda.gov/example'
  });
  assert.equal(result.status,'ok');
  assert.equal(result.output.trustTier,'OFFICIAL');
  assert.equal(calls,1);
});


test('allowlisted source cannot redirect to an untrusted or internal domain',async()=>{
  const storage=new MemoryStorage();
  const gateway=new CapabilityGateway(path.join(root,'config/policies.json'));
  let calls=0;
  const executor=new SourceFetchExecutor({
    gateway,storage,actor:'principal',
    fetchImpl:async()=>{
      calls++;
      return new Response('',{
        status:302,
        headers:{location:'http://127.0.0.1:8787/private'}
      });
    }
  });
  const result=await executor.fetch({
    taskId:'TSK-1',runId:'RUN-1',url:'https://www.fda.gov/open-redirect'
  });
  assert.equal(result.status,'failed');
  assert.equal(result.reason,'source-domain-not-allowlisted');
  assert.equal(calls,1);
});
