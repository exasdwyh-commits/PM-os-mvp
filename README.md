# PM OS MVP

A standalone reference implementation for a **Department AI Assistant / AI Chief of Staff**: durable projects/tasks, governed tool execution, evidence-aware reporting, specialist delegation and controlled future autonomy.

## Runtime

```bash
node -v   # Node >= 22.5
npm test
npm run demo
npm start
```

No `npm install` is required today; the MVP uses Node built-ins.

If `PM_OS_API_TOKEN` is **not** configured, the HTTP server binds to `127.0.0.1` only.
If a token is configured, API requests must use:

```text
Authorization: Bearer <PM_OS_API_TOKEN>
```

## Current V2 vertical slice

```text
POST /api/v2/product-rnd
idea
→ Project + Task
→ routing recommendation
→ ToolBroker-governed research execution
→ Evidence
→ quarantine / UNKNOWN / Knowledge Debt
→ structured Report
→ durable Event/Audit state
```

The request may ask for a **higher** `dataClass`, but it cannot lower the server/project baseline configured by `PROJECT_DATA_CLASS`.

For retry-safe requests, send an `Idempotency-Key` header.

## Research provider

The repository runs without an API key using a mock provider.

An OpenAI-compatible provider can be enabled with:

```text
OPENAI_COMPATIBLE_BASE_URL
OPENAI_COMPATIBLE_API_KEY
OPENAI_COMPATIBLE_MODEL
```

Provider/model access remains constrained by data classification policy. External output is treated as **untrusted advisory content**, not verified evidence.

## Security / governance properties already implemented

- runtime-bound identities for governed executors;
- per-call ToolBroker boundary for the V2 research path;
- fail-closed capability/resource policy;
- durable scoped ApprovalGrant storage;
- atomic single-use approval consumption;
- task/resource approval binding;
- persisted audit records;
- PUBLIC / INTERNAL / CONFIDENTIAL / RESTRICTED routing constraints;
- external disclosure audit events;
- external-content sanitization + quarantine;
- stale active-task recovery to PAUSED;
- request idempotency primitives;
- SQLite persistence behind a Storage Adapter.

Legacy V1 Product Council / fake evidence demo paths were removed from the active runtime.

## Authoritative reading order

1. [Department Agent V2 Blueprint](docs/DEPARTMENT_AGENT_V2_BLUEPRINT.md)
2. [V2 Implementation Roadmap](docs/V2_IMPLEMENTATION_ROADMAP.md)
3. [V2 Glossary](docs/GLOSSARY.md)
4. [Implementation Status](docs/IMPLEMENTATION_STATUS.md)
5. [Local Agent Handoff](docs/LOCAL_AGENT_HANDOFF.md)
6. [Golden Eval Cases](evals/README.md)

`docs/ARCHITECTURE.md` is a V1 reference only.

## Core rule

Fast models such as Laya/System-1 may classify, route and rank. They do not grant permissions, establish facts, or override Sentinel / ToolBroker policy.

Likewise, model agreement is not evidence. Unsupported claims may remain `UNKNOWN`.
