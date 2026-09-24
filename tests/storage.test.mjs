import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SqliteStorage } from '../src/storage/sqlite-storage.mjs';
import { createProject, createTask } from '../src/contracts/domain.mjs';
import { createEvidence, createReport } from '../src/contracts/artifacts.mjs';
import { createEvent } from '../src/contracts/events.mjs';

test('sqlite storage persists projects tasks evidence reports and events across restart', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pm-os-'));
  const file=path.join(dir,'pm-os.db');
  const now=new Date('2026-09-24T00:00:00.000Z');

  let s=new SqliteStorage(file);
  const project=createProject({id:'PRJ-1',title:'Product R&D'},now);
  const task=createTask({id:'TSK-1',projectId:project.id,title:'Research',status:'RUNNING'},now);
  const evidence=createEvidence({id:'EVD-1',title:'Official source',sourceType:'OFFICIAL',projectId:project.id,taskId:task.id},now);
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
