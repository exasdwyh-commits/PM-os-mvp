import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SCHEMA_VERSION, createProject, createTask, createKnowledgeItem,
  createKnowledgeDebt, createImprovement
} from '../src/contracts/domain.mjs';
import {
  createEvidence, createReport, createApprovalGrant, createDelegation
} from '../src/contracts/artifacts.mjs';
import { createEvent } from '../src/contracts/events.mjs';

const now = new Date('2026-09-24T00:00:00.000Z');

test('project and proactive task contracts carry privacy and autonomy controls', () => {
  const project = createProject({ id:'PRJ-1', title:'New product', dataClass:'CONFIDENTIAL' }, now);
  const task = createTask({
    id:'TSK-1', projectId:project.id, title:'Refresh market evidence',
    mode:'DELEGATION', origin:'PROACTIVE', autonomyLevel:'A1',
    reasonLinks:['project:PRJ-1'], dataClass:'CONFIDENTIAL', risk:'MEDIUM'
  }, now);
  assert.equal(project.schemaVersion, SCHEMA_VERSION);
  assert.equal(task.origin,'PROACTIVE');
  assert.equal(task.autonomyLevel,'A1');
  assert.equal(task.dataClass,'CONFIDENTIAL');
  assert.deepEqual(task.reasonLinks,['project:PRJ-1']);
});

test('knowledge separates claim kind, evidence level and freshness', () => {
  const item = createKnowledgeItem({
    id:'KN-1', topic:'Supplier price', claimKind:'FACT',
    evidenceLevel:'VERIFIED', freshness:'STALE', evidenceIds:['EVD-1']
  }, now);
  assert.equal(item.evidenceLevel,'VERIFIED');
  assert.equal(item.freshness,'STALE');
  assert.equal(item.claimKind,'FACT');
});

test('report preserves evidence links on conclusions', () => {
  const report=createReport({
    id:'RPT-1',title:'Product report',
    conclusions:[{claim:'Evidence is insufficient',claimKind:'FACT',evidenceLevel:'UNKNOWN',evidenceIds:[]}]
  },now);
  assert.equal(report.conclusions[0].evidenceLevel,'UNKNOWN');
});

test('approval and delegation are first-class records', () => {
  const grant=createApprovalGrant({id:'APR-1',approvedBy:'leader',taskId:'TSK-1',capability:'git.merge',resource:'refs/heads/feature/x'},now);
  const delegation=createDelegation({id:'DLG-1',taskId:'TSK-1',assignee:'research-agent'},now);
  assert.equal(grant.singleUse,true);
  assert.equal(delegation.status,'PENDING');
});

test('knowledge debt and improvement requirements avoid fake confidence', () => {
  const debt=createKnowledgeDebt({id:'KD-1',topic:'Supplier pricing',importance:'HIGH',taskId:'TSK-1'},now);
  const req=createImprovement({
    id:'REQ-1',title:'Supplier price connector',cause:'TOOL',signal:'FAILURE',
    impact:'HIGH',occurrenceCount:4,taskIds:['TSK-1']
  },now);
  assert.equal(debt.status,'OPEN');
  assert.equal(req.occurrenceCount,4);
  assert.equal('confidence' in req,false);
});

test('events carry correlation and reject unknown event names', () => {
  const event=createEvent({id:'EVT-1',type:'TASK_CREATED',taskId:'TSK-1',sequence:1},now);
  assert.equal(event.correlationId,'TSK-1');
  assert.equal(event.sequence,1);
  assert.throws(()=>createEvent({type:'MAGIC_EVENT'},now),/event.type/);
});

test('external evidence is untrusted by default', () => {
  const evidence=createEvidence({id:'EVD-1',title:'External webpage',sourceType:'EXTERNAL'},now);
  assert.equal(evidence.untrustedInput,true);
});
