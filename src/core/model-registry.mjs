import fs from 'node:fs';

export class ModelRegistry {
  constructor(path) {
    const raw = JSON.parse(fs.readFileSync(path, 'utf8'));
    this.models = new Map(raw.models.map(m => [m.id, m]));
    this.pools = raw.pools;
  }

  get(id) { return this.models.get(id); }

  select({ tier, workKind, requiresVision = false, contextTokens = 0 }) {
    const tierPool = this.pools[tier] ?? this.pools.medium;
    const candidates = tierPool[workKind] ?? tierPool.general ?? [];
    for (const id of candidates) {
      const model = this.models.get(id);
      if (!model) continue;
      if (requiresVision && !model.vision) continue;
      if (contextTokens > model.maxContext) continue;
      return model;
    }
    return this.models.get('frontier');
  }
}
