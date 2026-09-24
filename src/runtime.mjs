import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModelRegistry } from './core/model-registry.mjs';
import { DecisionPlane } from './core/decision-plane.mjs';
import { CapabilityGateway } from './core/capability-gateway.mjs';
import { CompanyBrain } from './core/company-brain.mjs';
import { recoverStaleTasks } from './core/recovery.mjs';
import { SqliteStorage } from './storage/sqlite-storage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbFile = process.env.PM_OS_DB ?? path.join(root, 'data/pm-os.db');

export const storage = new SqliteStorage(dbFile);
export const recoveredTasks = recoverStaleTasks(storage);
export const registry = new ModelRegistry(path.join(root, 'config/models.json'));
export const decisionPlane = new DecisionPlane({ registry, mode: process.env.ROUTER_MODE ?? 'shadow' });
export const gateway = new CapabilityGateway(path.join(root, 'config/policies.json'), {
  auditSink: entry => storage.appendAudit(entry)
});
export const brain = new CompanyBrain(storage);
export { root, dbFile };
