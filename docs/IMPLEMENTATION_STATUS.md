# PM OS V2 — Implementation Status

Last updated: 2026-09-24

## Current milestone

The repository now contains a governed, durable Product/R&D vertical slice and has completed the first security-hardening pass from independent red-team review.

## Implemented

### Contracts / epistemic model
- Project / Task / Goal
- Evidence / Report
- KnowledgeItem / KnowledgeDebt
- ApprovalGrant / Delegation / Correction / Improvement
- correlated Event model
- claimKind separated from evidenceLevel
- freshness separated from truth/evidence status
- explicit UNKNOWN behavior
- task durable stage / attempt / runId / lease fields

### Governance
- runtime-bound identity in ToolBroker executors
- fail-closed Capability Gateway resource policy
- policy startup validation for approval-required capabilities
- V2 research execution routed through ToolBroker
- durable scoped ApprovalGrant storage
- atomic single-use grant consumption
- replay prevention across restart
- task/resource/action scope validation
- dedicated EVOLUTION role
- persisted capability audit

### HTTP boundary
- actor identity derived server-side
- request dataClass cannot downgrade server/project baseline
- optional bearer-token protection
- localhost-only default when API token is absent
- 1 MB request-body limit
- generic external error responses with request IDs
- no wildcard CORS by default
- legacy `/api/demo` retired

### Privacy / untrusted content
- PUBLIC / INTERNAL / CONFIDENTIAL / RESTRICTED data classes
- provider/model allowed-data-class constraints
- no silent external frontier fallback when privacy blocks routing
- EXTERNAL_DISCLOSURE events
- sourceType and trustTier enums
- external/model content untrusted by default
- instruction-like content scanner
- QUARANTINED evidence tier
- quarantined content excluded from conclusions/actions
- INJECTION_SUSPECT event

### Durable storage / recovery
- Storage Adapter boundary
- SQLite + WAL implementation
- MemoryStorage test adapter
- records / events / audit / approvals / idempotency / metadata
- transaction primitive
- event idempotency primitive
- atomic workflow-start idempotency
- repeated Idempotency-Key does not create a second Project
- stale RUNNING/VERIFYING tasks recover to PAUSED on startup
- approval replay prevention survives process restart

### Product/R&D vertical slice

Endpoint:

`POST /api/v2/product-rnd`

Current flow:

```text
idea
→ Project + Task
→ Router recommendation
→ ResearchExecutor
→ ToolBroker
→ approved provider
→ sanitize / quarantine
→ Evidence + provenance hash
→ UNKNOWN / Knowledge Debt
→ structured Report
→ durable completion state
```

Consultant/model output remains advisory. It does not become VERIFIED merely because a model produced or summarized it.

### CI / tests
Current tests cover:
- contracts;
- router shadow behavior;
- ToolBroker enforcement;
- approval replay/task scope;
- SQLite restart persistence;
- stale-task recovery;
- provider privacy;
- external disclosure;
- provider failure → UNKNOWN;
- prompt-injection-like quarantine;
- request policy downgrade prevention;
- Product/R&D idempotency.

GitHub Actions CI is enabled on push and pull request.

## Removed / retired

The old V1 Product Council implementation and the fake evidence Product Lab workflow were removed from the active codebase. They conflicted with the V2 epistemic model.

## Partial / not yet complete

The following are **not** complete yet:

1. Independent Evidence Verifier.
2. Real primary/official source acquisition and trust hierarchy enforcement.
3. Live validation against a real approved external provider.
4. Knowledge Debt deduplication/merge service.
5. Knowledge Steward promotion/versioning workflow.
6. Executable Golden Eval runner + stored baselines/release gate.
7. Laya / fast-reflex integration.
8. Evolution Engine runtime.
9. Proactive Engine A1 shadow.
10. Digital Employee runtime beyond pure/mock software workers.
11. Full durable queue / cancellation / resumable checkpoint executor.
12. Credential vault/broker.
13. Browser/computer runtime.
14. Client/voice/discussion-room UI.

## Immediate next work

1. Build Independent Evidence Verifier.
2. Add source-trust policy and primary-source fetch adapters.
3. Build executable Golden Eval runner.
4. Add Knowledge Debt deduplication.
5. Validate Product/R&D against one real approved provider.
6. Only after those are stable, implement Knowledge Steward and A1 proactive shadow.

## Acceptance status

- ToolBroker on active V2 research path: PASS
- approval replay prevention: PASS
- fail-closed resources: PASS
- server-side actor/dataClass boundary: PASS
- provider privacy blocking: PASS
- prompt-injection quarantine: PASS
- durable Project/Task/Evidence/Report: PASS
- stale-task recovery: PASS
- request idempotency: PASS
- CI: PASS
- independent factual verification: NOT IMPLEMENTED
- live external provider verification: NOT YET VERIFIED
