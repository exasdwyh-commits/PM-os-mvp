import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStorage } from '../src/storage/memory-storage.mjs';
import { createRepositories } from '../src/repositories/domain-repositories.mjs';
import { KnowledgeDebtService } from '../src/core/knowledge-debt-service.mjs';

test('typed repositories hide kind strings from workflow-facing CRUD',()=>{
  const storage=new MemoryStorage();
  const repositories=createRepositories(storage);
  repositories.projects.save({id:'PRJ-1',title:'x'});
  assert.equal(repositories.projects.get('PRJ-1').title,'x');
  assert.equal(repositories.projects.list().length,1);
});

test('knowledge debt service merges normalized-equivalent topics',()=>{
  const storage=new MemoryStorage();
  const repositories=createRepositories(storage);
  const service=new KnowledgeDebtService({repositories});
  const first=service.createOrMerge({topic:'Supplier pricing missing!',projectId:'PRJ-1',taskId:'TSK-1'});
  const second=service.createOrMerge({topic:' supplier pricing missing ',projectId:'PRJ-1',taskId:'TSK-2'});
  assert.equal(first.merged,false);
  assert.equal(second.merged,true);
  assert.equal(repositories.knowledgeDebt.list({projectId:'PRJ-1'}).length,1);
  assert.equal(second.record.occurrences,2);
  assert.deepEqual(new Set(second.record.taskIds),new Set(['TSK-1','TSK-2']));
});
