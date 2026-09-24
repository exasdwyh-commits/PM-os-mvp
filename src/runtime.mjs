import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModelRegistry } from './core/model-registry.mjs';
import { DecisionPlane } from './core/decision-plane.mjs';
import { CapabilityGateway } from './core/capability-gateway.mjs';
import { CompanyBrain } from './core/company-brain.mjs';
import { Workforce } from './core/workforce.mjs';
import { DecisionCouncil } from './core/decision-council.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const registry = new ModelRegistry(path.join(root, 'config/models.json'));
export const decisionPlane = new DecisionPlane({ registry, mode: process.env.ROUTER_MODE ?? 'shadow' });
export const gateway = new CapabilityGateway(path.join(root, 'config/policies.json'));
export const brain = new CompanyBrain(path.join(root, 'data/decision-log.json'));
export const workforce = new Workforce({ gateway });
export const council = new DecisionCouncil();
export { root };
