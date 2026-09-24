import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CapabilityGateway } from '../src/core/capability-gateway.mjs';
import { ToolBroker } from '../src/core/tool-broker.mjs';
import { ApprovalService } from '../src/core/approval-service.mjs';
import { MemoryStorage } from '../src/storage/memory-storage.mjs';
import { createApprovalGrant } from '../src/contracts/artifacts.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const identity={role:'ENGINEER',actor:'user-1',agent:'coder-1'};
const secret='test-approval-secret-32-bytes';

function makeApproval(storage){
  return new ApprovalService({
    storage,
    secret,
    principal:'user-1'
  });
}

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

test('single-use signed approval is durably consumed and cannot be replayed', async()=>{
  const g=new CapabilityGateway(path.join(root,'config/policies.json'));
  const storage=new MemoryStorage();
  const approvalService=makeApproval(storage);
  const grant=approvalService.issue({
    approvedBy:'user-1',
    taskId:'TSK-1',
    capability:'git.merge',
    resource:'refs/heads/feature/demo',
    actionHash:'sha256:merge-demo',
    validUntil:new Date(Date.now()+60_000).toISOString()
  });
  let calls=0;
  const broker=new ToolBroker({
    gateway:g,identity,storage,approvalService,
    tools:{merge:async()=>{calls++;return 'merged';}}
  });
  const first=await broker.call({
    tool:'merge',capability:'git.merge',resource:'refs/heads/feature/demo',
    taskId:'TSK-1',runId:'RUN-1',actionHash:'sha256:merge-demo',approvalGrantId:grant.id
  });
  const second=await broker.call({
    tool:'merge',capability:'git.merge',resource:'refs/heads/feature/demo',
    taskId:'TSK-1',runId:'RUN-2',actionHash:'sha256:merge-demo',approvalGrantId:grant.id
  });
  assert.equal(first.status,'ok');
  assert.equal(second.status,'blocked');
  assert.equal(calls,1);
  assert.equal(storage.getApproval(grant.id).usedByRunId,'RUN-1');
});

test('forged approval written directly to storage is rejected by ToolBroker', async()=>{
  const g=new CapabilityGateway(path.join(root,'config/policies.json'));
  const storage=new MemoryStorage();
  const approvalService=makeApproval(storage);
  storage.putApproval(createApprovalGrant({
    id:'APR-FAKE',
    approvedBy:'user-1',
    taskId:'TSK-1',
    capability:'git.merge',
    resource:'refs/heads/feature/demo',
    actionHash:'sha256:merge-demo',
    validUntil:new Date(Date.now()+60_000).toISOString()
  }));
  const broker=new ToolBroker({
    gateway:g,identity,storage,approvalService,
    tools:{merge:async()=>true}
  });
  const result=await broker.call({
    tool:'merge',capability:'git.merge',resource:'refs/heads/feature/demo',
    taskId:'TSK-1',actionHash:'sha256:merge-demo',approvalGrantId:'APR-FAKE'
  });
  assert.equal(result.status,'blocked');
  assert.equal(result.reason,'approval-integrity-invalid');
});

test('tampering a signed approval invalidates it', async()=>{
  const g=new CapabilityGateway(path.join(root,'config/policies.json'));
  const storage=new MemoryStorage();
  const approvalService=makeApproval(storage);
  const grant=approvalService.issue({
    approvedBy:'user-1',
    taskId:'TSK-1',
    capability:'git.merge',
    resource:'refs/heads/feature/demo',
    actionHash:'sha256:merge-demo',
    validUntil:new Date(Date.now()+60_000).toISOString()
  });
  const tampered={...storage.getApproval(grant.id),resource:'refs/heads/feature/other'};
  storage.putApproval(tampered);
  const broker=new ToolBroker({
    gateway:g,identity,storage,approvalService,
    tools:{merge:async()=>true}
  });
  const result=await broker.call({
    tool:'merge',capability:'git.merge',resource:'refs/heads/feature/other',
    taskId:'TSK-1',actionHash:'sha256:merge-demo',approvalGrantId:grant.id
  });
  assert.equal(result.status,'blocked');
  assert.equal(result.reason,'approval-integrity-invalid');
});

test('tool broker checks every non-protected call with runtime-bound identity', async()=>{
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
