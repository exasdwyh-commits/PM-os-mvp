import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CapabilityGateway } from '../src/core/capability-gateway.mjs';
import { ToolBroker } from '../src/core/tool-broker.mjs';
import { MemoryStorage } from '../src/storage/memory-storage.mjs';
import { createApprovalGrant } from '../src/contracts/artifacts.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const identity={role:'ENGINEER',actor:'user-1',agent:'coder-1'};

test('engineer cannot merge without scoped approval grant',()=>{
  const g=new CapabilityGateway(path.join(root,'config/policies.json'));
  const r=g.check({identity,capability:'git.merge',resource:'refs/heads/feature/demo',taskId:'TSK-1'});
  assert.equal(r.allowed,false);
  assert.equal(r.reason,'approval-grant-required-or-invalid');
});

test('approval bound to a task cannot be used when request omits or changes task',()=>{
  const g=new CapabilityGateway(path.join(root,'config/policies.json'));
  const approvalGrant=createApprovalGrant({
    id:'APR-1',approvedBy:'user-1',taskId:'TSK-1',capability:'git.merge',resource:'refs/heads/feature/demo'
  });
  assert.equal(g.check({identity,capability:'git.merge',resource:'refs/heads/feature/demo',taskId:null,approvalGrant}).allowed,false);
  assert.equal(g.check({identity,capability:'git.merge',resource:'refs/heads/feature/demo',taskId:'TSK-2',approvalGrant}).allowed,false);
  assert.equal(g.check({identity,capability:'git.merge',resource:'refs/heads/feature/demo',taskId:'TSK-1',approvalGrant}).allowed,true);
});

test('single-use approval is durably consumed and cannot be replayed', async()=>{
  const g=new CapabilityGateway(path.join(root,'config/policies.json'));
  const storage=new MemoryStorage();
  storage.putApproval(createApprovalGrant({
    id:'APR-REPLAY',approvedBy:'user-1',taskId:'TSK-1',
    capability:'git.merge',resource:'refs/heads/feature/demo'
  }));
  let calls=0;
  const broker=new ToolBroker({
    gateway:g,identity,storage,
    tools:{merge:async()=>{calls++;return 'merged';}}
  });
  const first=await broker.call({
    tool:'merge',capability:'git.merge',resource:'refs/heads/feature/demo',
    taskId:'TSK-1',runId:'RUN-1',approvalGrantId:'APR-REPLAY'
  });
  const second=await broker.call({
    tool:'merge',capability:'git.merge',resource:'refs/heads/feature/demo',
    taskId:'TSK-1',runId:'RUN-2',approvalGrantId:'APR-REPLAY'
  });
  assert.equal(first.status,'ok');
  assert.equal(second.status,'blocked');
  assert.equal(calls,1);
  assert.equal(storage.getApproval('APR-REPLAY').usedByRunId,'RUN-1');
});

test('tool broker checks every call with runtime-bound identity', async()=>{
  const g=new CapabilityGateway(path.join(root,'config/policies.json'));
  const storage=new MemoryStorage();
  let calls=0;
  const broker=new ToolBroker({gateway:g,identity,storage,tools:{test:async()=>{calls++;return 'ok';}}});
  const allowed=await broker.call({tool:'test',capability:'shell.test',resource:'workspace/test'});
  const blocked=await broker.call({tool:'test',capability:'deploy.production',resource:'production',unattended:true});
  assert.equal(allowed.status,'ok');
  assert.equal(blocked.status,'blocked');
  assert.equal(calls,1);
});


test('tool registry cannot be mutated after broker construction',()=>{
  const g=new CapabilityGateway(path.join(root,'config/policies.json'));
  const broker=new ToolBroker({
    gateway:g,identity,storage:new MemoryStorage(),
    tools:{test:async()=>true}
  });
  assert.equal(typeof broker.register,'undefined');
});
