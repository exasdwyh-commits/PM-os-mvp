import test from 'node:test'; import assert from 'node:assert/strict'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { CapabilityGateway } from '../src/core/capability-gateway.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('engineer cannot deploy production without approval',()=>{ const g=new CapabilityGateway(path.join(root,'config/policies.json')); const r=g.check({role:'ENGINEER',capability:'deploy.production',approved:false}); assert.equal(r.allowed,false); });
test('engineer may run tests',()=>{ const g=new CapabilityGateway(path.join(root,'config/policies.json')); const r=g.check({role:'ENGINEER',capability:'shell.test'}); assert.equal(r.allowed,true); });
