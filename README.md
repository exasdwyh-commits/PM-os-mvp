# PM OS MVP

A standalone, zero-API-key reference implementation for the next PM / PM-next architecture.

## Why this exists
Do not bolt five external frameworks into PM-next. First prove the architectural seams in a tiny project, then let a local coding agent migrate the stable interfaces into the main system.

## Run
```bash
node -v   # Node 20+
npm test
npm run demo
npm start
```
Then open `http://localhost:8787`.

No `npm install` is required because the MVP uses only Node built-ins.

## What the demo proves
1. **Decision Plane** — classifies task difficulty/work/risk and recommends a model. Default is shadow mode.
2. **Model Registry** — structured provider/model capabilities and routing pools.
3. **Capability Gateway** — dangerous actions are gated and audited.
4. **Workforce** — Coder → QA → Reviewer are separate actors with a bounded retry loop.
5. **Product Council** — evidence → advocate → skeptic → risk → GO/TEST/HOLD.
6. **Company Brain** — append-only decision memory ready for outcomes/reflections.

## Switch router from shadow to active
```bash
ROUTER_MODE=on npm run demo
```

## Important design rule
A cheap decision model may choose from options that the system has already declared safe. It should not invent permissions, tools, model IDs or destructive actions.

## Recommended local-agent reading order
1. `docs/ARCHITECTURE.md`
2. `src/core/decision-plane.mjs`
3. `src/core/capability-gateway.mjs`
4. `src/core/workforce.mjs`
5. `src/core/decision-council.mjs`
6. `docs/MIGRATION_TO_PM_NEXT.md`


## V2 direction: Department AI Assistant

The repository is now moving from a routing/governance demo toward a department-level AI chief-of-staff.

Core design and implementation order:

1. [Department Agent V2 Blueprint](docs/DEPARTMENT_AGENT_V2_BLUEPRINT.md)
2. [V2 Implementation Roadmap](docs/V2_IMPLEMENTATION_ROADMAP.md)
3. [Local Agent Handoff](docs/LOCAL_AGENT_HANDOFF.md)

V2 adds:
- one conversational entry point for managers;
- durable Project / Task state;
- direct vs delegated vs executive collaboration modes;
- fast System-1 routing with safe fallbacks;
- expert/model registry;
- explicit VERIFIED / INFERRED / UNCERTAIN / UNKNOWN knowledge states;
- Knowledge Steward + Knowledge Debt;
- controlled self-evolution and improvement requirements;
- user-correction learning and regression cases;
- outcome-linked organizational memory.

Current Phase 0 contracts live under `src/contracts/`.
