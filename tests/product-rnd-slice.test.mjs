import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStorage } from '../src/storage/memory-storage.mjs';
import { runProductRndSlice } from '../src/workflows/product-rnd-slice.mjs';
import { MockResearchProvider } from '../src/adapters/research-provider.mjs';

const decisionPlane={
  route:async()=>({recommendedModel:'balanced',selectedModel:'balanced',shadow:true,reason:'test'})
};

test('product R&D vertical slice persists report evidence debt and audit events', async()=>{
  const storage=new MemoryStorage();
  const result=await runProductRndSlice({
    idea:'AOS pre-meal functional drink',
    storage,
    decisionPlane,
    researchProvider:new MockResearchProvider()
  });
  assert.equal(result.task.status,'COMPLETED');
  assert.ok(result.report.id);
  assert.equal(storage.list('project').length,1);
  assert.equal(storage.list('task').length,1);
  assert.equal(storage.list('report').length,1);
  assert.ok(storage.list('evidence').length>=1);
  assert.ok(storage.list('knowledgeDebt').length>=1);
  assert.ok(storage.listEvents({taskId:result.task.id}).some(e=>e.type==='TASK_COMPLETED'));
});

test('specialist failure degrades honestly to UNKNOWN instead of fabricating completion', async()=>{
  const storage=new MemoryStorage();
  const failing={id:'failing-provider',external:true,research:async()=>{throw new Error('offline');}};
  const result=await runProductRndSlice({
    idea:'New functional food',
    storage,
    decisionPlane,
    researchProvider:failing
  });
  assert.equal(result.provider.error,'offline');
  assert.equal(result.report.conclusions[0].evidenceLevel,'UNKNOWN');
  assert.ok(result.report.unresolvedQuestions.some(x=>x.includes('Provider failure')));
});
