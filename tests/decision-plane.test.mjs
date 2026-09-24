import test from 'node:test'; import assert from 'node:assert/strict';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { ModelRegistry } from '../src/core/model-registry.mjs'; import { DecisionPlane } from '../src/core/decision-plane.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'); const registry=new ModelRegistry(path.join(root,'config/models.json'));
test('risk creates at least medium tier', async()=>{ const p=new DecisionPlane({registry,mode:'on'}); const r=await p.route({prompt:'deploy production database migration',contextTokens:100},'fast-general'); assert.notEqual(r.judgment.tier,'simple'); });
test('shadow mode recommends but does not switch', async()=>{ const p=new DecisionPlane({registry,mode:'shadow'}); const r=await p.route({prompt:'deep research architecture',contextTokens:1000},'balanced'); assert.equal(r.selectedModel,'balanced'); assert.equal(r.shadow,true); });
