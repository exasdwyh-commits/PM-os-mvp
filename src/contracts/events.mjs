import { randomUUID } from 'node:crypto';
import { SCHEMA_VERSION } from './domain.mjs';

export const EVENT_TYPES = Object.freeze([
  'TASK_CREATED',
  'TASK_CLASSIFIED',
  'TASK_DECOMPOSED',
  'EXPERT_SELECTED',
  'TOOL_REQUESTED',
  'CAPABILITY_ALLOWED',
  'CAPABILITY_DENIED',
  'HUMAN_APPROVAL_REQUESTED',
  'CHECKPOINT_SAVED',
  'EVIDENCE_ADDED',
  'KNOWLEDGE_GAP_DETECTED',
  'KNOWLEDGE_DEBT_CREATED',
  'USER_CORRECTION_RECORDED',
  'IMPROVEMENT_PROPOSED',
  'TASK_COMPLETED',
  'TASK_FAILED',
  'OUTCOME_RECORDED',
  'REFLECTION_RECORDED'
]);

export function createEvent(input = {}, now = new Date()) {
  if (!EVENT_TYPES.includes(input.type)) {
    throw new TypeError(`event.type must be one of: ${EVENT_TYPES.join(', ')}`);
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    id: input.id ?? `EVT-${randomUUID()}`,
    type: input.type,
    at: input.at ?? now.toISOString(),
    actor: input.actor ?? 'system',
    projectId: input.projectId ?? null,
    taskId: input.taskId ?? null,
    payload: { ...(input.payload ?? {}) }
  };
}
