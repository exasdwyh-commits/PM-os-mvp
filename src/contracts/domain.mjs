import { randomUUID } from 'node:crypto';

export const SCHEMA_VERSION = '2.0.0-mvp';

export const COLLABORATION_MODES = Object.freeze([
  'ASSISTANT',
  'DELEGATION',
  'EXECUTIVE'
]);

export const TASK_STATUS = Object.freeze([
  'INTAKE',
  'PLANNED',
  'RUNNING',
  'WAITING_HUMAN',
  'BLOCKED',
  'VERIFYING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
]);

export const EPISTEMIC_STATES = Object.freeze([
  'VERIFIED',
  'STRONG',
  'SUPPORTED',
  'INFERRED',
  'ESTIMATED',
  'UNCERTAIN',
  'UNKNOWN'
]);

export const GAP_TYPES = Object.freeze([
  'CAPABILITY_GAP',
  'TOOL_GAP',
  'KNOWLEDGE_GAP',
  'MODEL_GAP',
  'FAILURE',
  'REPEAT_ERROR',
  'UNCERTAINTY',
  'QUALITY_GAP',
  'WORKFLOW_GAP',
  'USER_CORRECTION',
  'EFFICIENCY_GAP',
  'MISSING_MEMORY'
]);

export const RISK_LEVELS = Object.freeze(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

function assertEnum(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw new TypeError(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

function nowIso(now) {
  return (now ?? new Date()).toISOString();
}

export function createProject(input = {}, now) {
  if (!input.title?.trim()) throw new TypeError('project.title is required');
  return {
    schemaVersion: SCHEMA_VERSION,
    id: input.id ?? `PRJ-${randomUUID()}`,
    title: input.title.trim(),
    goal: input.goal?.trim() ?? '',
    status: input.status ?? 'ACTIVE',
    owner: input.owner ?? null,
    createdAt: input.createdAt ?? nowIso(now),
    updatedAt: input.updatedAt ?? nowIso(now),
    tags: [...(input.tags ?? [])],
    metadata: { ...(input.metadata ?? {}) }
  };
}

export function createTask(input = {}, now) {
  if (!input.title?.trim()) throw new TypeError('task.title is required');
  const mode = assertEnum(input.mode ?? 'ASSISTANT', COLLABORATION_MODES, 'task.mode');
  const status = assertEnum(input.status ?? 'INTAKE', TASK_STATUS, 'task.status');
  const risk = assertEnum(input.risk ?? 'LOW', RISK_LEVELS, 'task.risk');

  return {
    schemaVersion: SCHEMA_VERSION,
    id: input.id ?? `TSK-${randomUUID()}`,
    projectId: input.projectId ?? null,
    parentTaskId: input.parentTaskId ?? null,
    title: input.title.trim(),
    request: input.request ?? '',
    mode,
    status,
    risk,
    ownerAgent: input.ownerAgent ?? 'department-assistant',
    assignedExperts: [...(input.assignedExperts ?? [])],
    checkpoint: input.checkpoint ?? null,
    result: input.result ?? null,
    createdAt: input.createdAt ?? nowIso(now),
    updatedAt: input.updatedAt ?? nowIso(now),
    metadata: { ...(input.metadata ?? {}) }
  };
}

export function createKnowledgeItem(input = {}, now) {
  if (!input.topic?.trim()) throw new TypeError('knowledge.topic is required');
  const epistemicState = assertEnum(
    input.epistemicState ?? 'UNKNOWN',
    EPISTEMIC_STATES,
    'knowledge.epistemicState'
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    id: input.id ?? `KN-${randomUUID()}`,
    topic: input.topic.trim(),
    content: input.content ?? '',
    epistemicState,
    confidence: input.confidence ?? null,
    sources: [...(input.sources ?? [])],
    sourceDate: input.sourceDate ?? null,
    capturedAt: input.capturedAt ?? nowIso(now),
    reviewAt: input.reviewAt ?? null,
    scope: input.scope ?? null,
    projectId: input.projectId ?? null,
    conflicts: [...(input.conflicts ?? [])],
    metadata: { ...(input.metadata ?? {}) }
  };
}

export function createKnowledgeDebt(input = {}, now) {
  if (!input.topic?.trim()) throw new TypeError('knowledgeDebt.topic is required');
  return {
    schemaVersion: SCHEMA_VERSION,
    id: input.id ?? `KD-${randomUUID()}`,
    topic: input.topic.trim(),
    reason: input.reason ?? '',
    importance: assertEnum(input.importance ?? 'MEDIUM', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 'knowledgeDebt.importance'),
    missing: [...(input.missing ?? [])],
    suggestedExperts: [...(input.suggestedExperts ?? [])],
    projectId: input.projectId ?? null,
    taskId: input.taskId ?? null,
    status: input.status ?? 'OPEN',
    occurrences: input.occurrences ?? 1,
    createdAt: input.createdAt ?? nowIso(now),
    lastSeenAt: input.lastSeenAt ?? nowIso(now),
    metadata: { ...(input.metadata ?? {}) }
  };
}

export function createImprovement(input = {}, now) {
  if (!input.title?.trim()) throw new TypeError('improvement.title is required');
  const gapType = assertEnum(input.gapType ?? 'QUALITY_GAP', GAP_TYPES, 'improvement.gapType');

  return {
    schemaVersion: SCHEMA_VERSION,
    id: input.id ?? `REQ-${randomUUID()}`,
    title: input.title.trim(),
    gapType,
    description: input.description ?? '',
    impact: assertEnum(input.impact ?? 'MEDIUM', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 'improvement.impact'),
    confidence: input.confidence ?? null,
    evidence: [...(input.evidence ?? [])],
    proposedChanges: [...(input.proposedChanges ?? [])],
    regressionCases: [...(input.regressionCases ?? [])],
    status: input.status ?? 'PROPOSED',
    taskIds: [...(input.taskIds ?? [])],
    createdAt: input.createdAt ?? nowIso(now),
    metadata: { ...(input.metadata ?? {}) }
  };
}
