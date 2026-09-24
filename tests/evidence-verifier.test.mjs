import test from 'node:test';
import assert from 'node:assert/strict';
import { EvidenceVerifier } from '../src/core/evidence-verifier.mjs';

const verifier=new EvidenceVerifier({identity:'verifier-test'});
const claim={claim:'FDA approved product X on September 24 2026.',claimKind:'FACT'};
const supportedBody='Regulatory update: FDA approved product X on September 24 2026. This notice describes the decision.';

function verify(sources){
  return verifier.verify({
    claims:[claim],
    modelEvidenceByClaim:[[{id:'EVD-M',sourceType:'MODEL_OUTPUT',trustTier:'ADVISORY'}]],
    sourceEvidenceByClaim:[sources]
  })[0];
}

test('verifier keeps model-only claims UNKNOWN',()=>{
  const result=verify([]);
  assert.equal(result.evidenceLevel,'UNKNOWN');
  assert.equal(result.claimKind,'FACT');
});

test('official homepage unrelated to claim remains UNKNOWN',()=>{
  const result=verify([{
    id:'EVD-S',sourceUri:'https://www.fda.gov/',trustTier:'OFFICIAL',
    httpStatus:200,rawContentPreview:'Welcome to the FDA home page.'
  }]);
  assert.equal(result.evidenceLevel,'UNKNOWN');
  assert.equal(result.verification.sources[0].supportStatus,'NOT_FOUND');
});

test('one independently reclassified official source with support span reaches SUPPORTED',()=>{
  const result=verify([{
    id:'EVD-S',sourceUri:'https://www.fda.gov/x',trustTier:'UNRATED',
    httpStatus:200,rawContentPreview:supportedBody
  }]);
  assert.equal(result.evidenceLevel,'SUPPORTED');
  assert.match(result.verification.sources[0].supportSpan,/fda approved product x/);
});

test('fda.gov and www.fda.gov count as one organization, not STRONG',()=>{
  const result=verify([
    {id:'EVD-A',sourceUri:'https://fda.gov/a',trustTier:'OFFICIAL',httpStatus:200,rawContentPreview:supportedBody},
    {id:'EVD-B',sourceUri:'https://www.fda.gov/b',trustTier:'OFFICIAL',httpStatus:200,rawContentPreview:supportedBody}
  ]);
  assert.equal(result.evidenceLevel,'SUPPORTED');
  assert.deepEqual(result.verification.sourceOrganizations,['FDA']);
});

test('two independently supported organizations can reach STRONG but never VERIFIED',()=>{
  const result=verify([
    {id:'EVD-A',sourceUri:'https://www.fda.gov/a',trustTier:'OFFICIAL',httpStatus:200,rawContentPreview:supportedBody},
    {id:'EVD-B',sourceUri:'https://www.who.int/b',trustTier:'OFFICIAL',httpStatus:200,rawContentPreview:supportedBody}
  ]);
  assert.equal(result.evidenceLevel,'STRONG');
  assert.notEqual(result.evidenceLevel,'VERIFIED');
});

test('forged OFFICIAL trust tier on evil URL is ignored',()=>{
  const result=verify([{
    id:'EVD-X',sourceUri:'https://evil.example.com/x',trustTier:'OFFICIAL',
    httpStatus:200,rawContentPreview:supportedBody
  }]);
  assert.equal(result.evidenceLevel,'UNKNOWN');
});

test('redirect status is not usable evidence',()=>{
  const result=verify([{
    id:'EVD-R',sourceUri:'https://www.fda.gov/x',trustTier:'OFFICIAL',
    httpStatus:302,rawContentPreview:supportedBody
  }]);
  assert.equal(result.evidenceLevel,'UNKNOWN');
});
