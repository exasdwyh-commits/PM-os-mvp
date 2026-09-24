# PM OS V2 — Implementation Status

Last updated: 2026-09-24

## Current milestone

The repository has moved beyond architecture-only contracts and now contains the first durable Product/R&D vertical slice.

### Implemented

#### V2 contracts
- Project
- Task
- KnowledgeItem
- KnowledgeDebt
- Improvement
- Evidence
- Report
- ApprovalGrant
- Delegation
- Goal
- Correction
- correlated Event model

#### Governance
- runtime-bound identity
- Capability Gateway
- per-call ToolBroker
- scoped ApprovalGrant
- resource-level policy checks
- dedicated EVOLUTION role
- persisted audit sink

#### Privacy / routing
- PUBLIC / INTERNAL / CONFIDENTIAL / RESTRICTED data classes
- provider/model allowed-data-class metadata
- no silent external frontier fallback when policy blocks a model
- external research disclosure events
- external evidence marked untrusted by default

#### Epistemic model
- claimKind separated from evidenceLevel
- freshness separated from historical verification
- UNKNOWN is a valid result
- router/classifier confidence is not factual confidence

#### Durable storage
- Storage Adapter boundary
- SQLite implementation using Node built-in sqlite
- MemoryStorage test adapter
- persistent records/events/audit/metadata
- restart persistence tests
- idempotent record upsert

#### Runtime
- SQLite wired into the runtime
- Company Brain moved onto Storage Adapter
- Capability audit persisted through Storage Adapter

#### Product/R&D vertical slice
Endpoint:
`POST /api/v2/product-rnd`

Current flow:

```text
idea
→ create Project
→ create durable Task
→ route recommendation
→ research provider
→ Evidence records
→ UNKNOWN / Knowledge Debt
→ structured Report
→ durable completion event
```

The slice deliberately treats consultant/model output as advisory evidence rather than verified fact.

#### Research provider boundary
- Mock provider for no-key demo/testing
- OpenAI-compatible external provider adapter
- external provider is blocked when dataClass is not allowed
- allowed external calls create EXTERNAL_DISCLOSURE event
- provider outage degrades honestly to UNKNOWN

Environment variables for a real OpenAI-compatible provider:

```text
OPENAI_COMPATIBLE_BASE_URL
OPENAI_COMPATIBLE_API_KEY
OPENAI_COMPATIBLE_MODEL
```

No production API key is stored in the repository.

#### Eval / CI
- initial 20 Product/R&D golden behavior cases
- GitHub Actions CI
- Node 22 test environment
- latest test job: green

## Runtime requirements

Node >= 22.5 is currently required because the first SQLite adapter uses `node:sqlite`.

The core remains behind a Storage Adapter so another SQLite implementation or Postgres can replace it later.

## Not yet implemented

The following remain planned rather than complete:

1. full SQLite repository layer with stronger domain queries/transactions;
2. real provider credentials/live provider validation;
3. independent Evidence Verifier;
4. source fetching + trust hierarchy + prompt-injection scanner;
5. Knowledge Steward promotion/versioning logic;
6. Knowledge Debt deduplication service;
7. Evolution Engine implementation;
8. Proactive Engine A1 shadow mode;
9. Laya/fast-router integration;
10. Digital Employee runtime beyond software demo;
11. durable queue/leases/idempotency for long-running daemon;
12. browser/computer runtime;
13. client/voice/discussion-room UI.

## Immediate next work

1. Evidence Verifier + source trust pipeline.
2. Upgrade storage with transactions/idempotency helpers.
3. Run the Product/R&D slice against one real approved provider.
4. Build executable golden-eval runner.
5. Add Knowledge Steward and debt deduplication.
6. Only then start proactive A1 shadow mode.

## Current acceptance status

- durable Project/Task: PASS
- durable Evidence/Report: PASS
- honest provider failure: PASS
- provider privacy blocking: PASS
- external disclosure audit: PASS
- ToolBroker/ApprovalGrant tests: PASS
- SQLite restart persistence: PASS
- CI: PASS
- real external research provider live test: NOT YET VERIFIED
- independent factual verification: NOT YET IMPLEMENTED
