import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CapabilityGateway } from '../src/core/capability-gateway.mjs';
import { ToolBroker } from '../src/core/tool-broker.mjs';
import { createApprovalGrant } from '../src/contracts/artifacts.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const identity={role:'ENGINEER',actor:'user-1',agent:'coder-1'};

test('engineer cannot merge without scoped approval grant',()=>{
  const g=new CapabilityGateway(path.join(root,'config/policies.json'));
  const r=g.check({identity,capability:'git.merge',resource:'refs/heads/feature/demo',taskId:'TSK-1'});
  assert.equal(r.allowed,false);
  assert.equal(r.reason,'approval-grant-required');
});

test('scoped approval grant permits only its approved resource',()=>{
  const g=new CapabilityGateway(path.join(root,'config/policies.json'));
  const approvalGrant=createApprovalGrant({
    id:'APR-1',approvedBy:'user-1',taskId:'TSK-1',capability:'git.merge',resource:'refs/heads/feature/demo'
  });
  const ok=g.check({identity,capability:'git.merge',resource:'refs/heads/feature/demo',taskId:'TSK-1',approvalGrant});
  const no=g.check({identity,capability:'git.merge',resource:'refs/heads/feature/other',taskId:'TSK-1',approvalGrant});
  assert.equal(ok.allowed,true);
  assert.equal(no.allowed,false);
});

test('tool broker checks every call with runtime-bound identity', async()=>{
  const g=new CapabilityGateway(path.join(root,'config/policies.json'));
  let calls=0;
  const broker=new ToolBroker({gateway:g,identity,tools:{test:async()=>{calls++;return 'ok';}}});
  const allowed=await broker.call({tool:'test',capability:'shell.test',resource:'workspace/test'});
  const blocked=await broker.call({tool:'test',capability:'deploy.production',resource:'production',unattended:true});
  assert.equal(allowed.status,'ok');
  assert.equal(blocked.status,'blocked');
  assert.equal(calls,1);
});
