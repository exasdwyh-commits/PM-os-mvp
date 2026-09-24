import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { SqliteStorage } from '../src/storage/sqlite-storage.mjs';
import { createProject, createTask } from '../src/contracts/domain.mjs';
import { createEvidence, createReport, createApprovalGrant } from '../src/contracts/artifacts.mjs';
import { createEvent } from '../src/contracts/events.mjs';
import { recoverStaleTasks } from '../src/core/recovery.mjs';

test('sqlite storage persists projects tasks evidence reports and events across restart', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pm-os-'));
  const file=path.join(dir,'pm-os.db');
  const now=new Date('2026-09-24T00:00:00.000Z');

  let s=new SqliteStorage(file);
  const project=createProject({id:'PRJ-1',title:'Product R&D'},now);
  const task=createTask({id:'TSK-1',projectId:project.id,title:'Research',status:'RUNNING',stage:'EXECUTE',leaseUntil:'2026-09-24T01:00:00.000Z'},now);
  const evidence=createEvidence({id:'EVD-1',title:'Official source',sourceType:'OFFICIAL',trustTier:'OFFICIAL',projectId:project.id,taskId:task.id},now);
  const report=createReport({id:'RPT-1',title:'Research report',projectId:project.id,taskId:task.id},now);
  const event=createEvent({id:'EVT-1',type:'TASK_CREATED',projectId:project.id,taskId:task.id},now);

  s.put('project',project);
  s.put('task',task);
  s.put('evidence',evidence);
  s.put('report',report);
  s.appendEvent(event);
  s.close();

  s=new SqliteStorage(file);
  assert.equal(s.get('project','PRJ-1').title,'Product R&D');
  assert.equal(s.get('task','TSK-1').status,'RUNNING');
  assert.equal(s.list('evidence',{taskId:'TSK-1'}).length,1);
  assert.equal(s.list('report',{projectId:'PRJ-1'}).length,1);
  assert.equal(s.listEvents({taskId:'TSK-1'})[0].type,'TASK_CREATED');
  s.close();
});

test('sqlite storage upserts records without duplicating identity', () => {
  const s=new SqliteStorage(':memory:');
  s.put('task',{id:'TSK-1',status:'RUNNING',updatedAt:'2026-09-24T00:00:00.000Z'});
  s.put('task',{id:'TSK-1',status:'COMPLETED',updatedAt:'2026-09-24T01:00:00.000Z'});
  assert.equal(s.list('task').length,1);
  assert.equal(s.get('task','TSK-1').status,'COMPLETED');
  s.close();
});

test('sqlite approval consumption survives restart and prevents replay',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pm-os-apr-'));
  const file=path.join(dir,'pm-os.db');
  let s=new SqliteStorage(file);
  s.putApproval(createApprovalGrant({
    id:'APR-1',approvedBy:'leader',taskId:'TSK-1',
    capability:'git.merge',resource:'refs/heads/feature/demo'
  }));
  assert.ok(s.consumeApproval('APR-1','RUN-1'));
  s.close();

  s=new SqliteStorage(file);
  assert.equal(s.consumeApproval('APR-1','RUN-2'),null);
  assert.equal(s.getApproval('APR-1').usedByRunId,'RUN-1');
  s.close();
});

test('event idempotency returns prior event rather than duplicating',()=>{
  const s=new SqliteStorage(':memory:');
  const event=createEvent({id:'EVT-IDEM',type:'TASK_CREATED',taskId:'TSK-1'});
  s.appendEvent(event,{idempotencyKey:'task-created:TSK-1'});
  const second=s.appendEvent({...event,id:'EVT-OTHER'},{idempotencyKey:'task-created:TSK-1'});
  assert.equal(second.id,'EVT-IDEM');
  assert.equal(s.listEvents({taskId:'TSK-1'}).length,1);
  s.close();
});

test('stale active tasks are recovered to PAUSED instead of remaining ghost RUNNING',()=>{
  const s=new SqliteStorage(':memory:');
  s.put('task',{
    id:'TSK-STALE',projectId:'PRJ-1',title:'stale',status:'RUNNING',stage:'EXECUTE',
    leaseUntil:'2026-09-23T00:00:00.000Z',updatedAt:'2026-09-23T00:00:00.000Z'
  });
  const recovered=recoverStaleTasks(s,new Date('2026-09-24T00:00:00.000Z'));
  assert.equal(recovered.length,1);
  assert.equal(s.get('task','TSK-STALE').status,'PAUSED');
  assert.equal(s.listEvents({taskId:'TSK-STALE'}).some(e=>e.type==='TASK_PAUSED'),true);
  s.close();
});


test('sqlite idempotency stores the same key independently across namespaces',()=>{
  const s=new SqliteStorage(':memory:');
  s.setIdempotent('product-rnd-start','K1',{phase:'start'});
  s.setIdempotent('product-rnd-result','K1',{phase:'result'});
  assert.deepEqual(s.getIdempotent('product-rnd-start','K1'),{phase:'start'});
  assert.deepEqual(s.getIdempotent('product-rnd-result','K1'),{phase:'result'});
  s.close();
});

test('sqlite migrates legacy key-only idempotency primary key to namespace plus key',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pm-os-idem-migrate-'));
  const file=path.join(dir,'pm-os.db');
  const db=new DatabaseSync(file);
  db.exec(`
    CREATE TABLE idempotency_keys (
      key TEXT PRIMARY KEY,
      namespace TEXT NOT NULL,
      result_json TEXT,
      created_at TEXT NOT NULL
    );
    INSERT INTO idempotency_keys(key,namespace,result_json,created_at)
    VALUES('K1','product-rnd-start','{"phase":"start"}','2026-09-24T00:00:00.000Z');
  `);
  db.close();

  const s=new SqliteStorage(file);
  assert.deepEqual(s.getIdempotent('product-rnd-start','K1'),{phase:'start'});
  s.setIdempotent('product-rnd-result','K1',{phase:'result'});
  assert.deepEqual(s.getIdempotent('product-rnd-result','K1'),{phase:'result'});
  s.close();
});
