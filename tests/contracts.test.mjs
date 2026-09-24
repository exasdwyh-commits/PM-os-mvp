import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SCHEMA_VERSION,
  createProject,
  createTask,
  createKnowledgeItem,
  createKnowledgeDebt,
  createImprovement
} from '../src/contracts/domain.mjs';
import { createEvent } from '../src/contracts/events.mjs';

const now = new Date('2026-09-24T00:00:00.000Z');

test('project and task contracts are versioned and linked', () => {
  const project = createProject({ id: 'PRJ-1', title: 'New product' }, now);
  const task = createTask({
    id: 'TSK-1',
    projectId: project.id,
    title: 'Research market',
    mode: 'DELEGATION',
    risk: 'MEDIUM'
  }, now);

  assert.equal(project.schemaVersion, SCHEMA_VERSION);
  assert.equal(task.projectId, project.id);
  assert.equal(task.mode, 'DELEGATION');
  assert.equal(task.status, 'INTAKE');
});

test('epistemic contract preserves UNKNOWN instead of inventing certainty', () => {
  const item = createKnowledgeItem({
    id: 'KN-1',
    topic: 'Regulatory status',
    epistemicState: 'UNKNOWN'
  }, now);

  assert.equal(item.epistemicState, 'UNKNOWN');
  assert.equal(item.confidence, null);
});

test('invalid epistemic state is rejected', () => {
  assert.throws(
    () => createKnowledgeItem({ topic: 'x', epistemicState: 'CERTAIN' }, now),
    /epistemicState/
  );
});

test('knowledge debt and improvement requirements are first-class records', () => {
  const debt = createKnowledgeDebt({
    id: 'KD-1',
    topic: 'Supplier pricing',
    importance: 'HIGH',
    taskId: 'TSK-1'
  }, now);
  const req = createImprovement({
    id: 'REQ-1',
    title: 'Supplier price connector',
    gapType: 'TOOL_GAP',
    impact: 'HIGH',
    taskIds: ['TSK-1']
  }, now);

  assert.equal(debt.status, 'OPEN');
  assert.equal(req.status, 'PROPOSED');
  assert.deepEqual(req.taskIds, ['TSK-1']);
});

test('event contract rejects unknown event names', () => {
  const event = createEvent({ id: 'EVT-1', type: 'TASK_CREATED', taskId: 'TSK-1' }, now);
  assert.equal(event.type, 'TASK_CREATED');
  assert.throws(() => createEvent({ type: 'MAGIC_EVENT' }, now), /event.type/);
});
