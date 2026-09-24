import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDataClass, verifyBearerToken } from '../src/core/request-policy.mjs';

test('request dataClass may upgrade but never downgrade server policy',()=>{
  assert.equal(resolveDataClass('CONFIDENTIAL','PUBLIC'),'CONFIDENTIAL');
  assert.equal(resolveDataClass('INTERNAL','RESTRICTED'),'RESTRICTED');
  assert.equal(resolveDataClass('INTERNAL',null),'INTERNAL');
  assert.equal(resolveDataClass('INTERNAL','garbage'),'INTERNAL');
});

test('bearer token validation is fail closed when token is configured',()=>{
  assert.equal(verifyBearerToken('secret','Bearer secret'),true);
  assert.equal(verifyBearerToken('secret','Bearer wrong'),false);
  assert.equal(verifyBearerToken('secret',null),false);
  assert.equal(verifyBearerToken(null,null),true);
});
