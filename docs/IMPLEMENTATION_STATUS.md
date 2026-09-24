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

1. Semantic Evidence Verifier beyond the current conservative rules-only verifier.
2. Full primary/official source support validation (the current Source Fetcher verifies provenance/fetchability, not whether the page semantically proves the claim).
3. Live validation against a real approved external research provider.
4. Knowledge Steward promotion/versioning workflow.
5. Laya / fast-reflex integration and outcome-based router evaluation.
6. Evolution Engine runtime.
7. Proactive Engine A1 shadow.
8. Digital Employee runtime beyond pure/mock software workers.
9. Full durable queue / cancellation / resumable checkpoint executor.
10. ApprovalService with signed issuance/integrity policy.
11. Credential vault/broker.
12. Per-entity SQLite tables where query pressure justifies migration from the typed-repository-backed generic store.
13. Browser/computer runtime.
14. Client/voice/discussion-room UI.

## Immediate next work

1. Validate Product/R&D against one real approved provider.
2. Upgrade verifier from provenance rules to semantic claim↔source support checks.
3. Add ApprovalService integrity/signing instead of direct grant persistence APIs.
4. Expand executable Golden Eval from the initial 8 gated cases toward the highest-value remaining cases.
5. Add Knowledge Steward promotion/versioning on top of the now-deduplicated Knowledge Debt service.
6. Add Laya/router shadow outcome analysis before enabling active routing.
7. Only after these are stable, implement A1 proactive shadow.

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
- rules-only independent provenance verifier: PASS
- independently fetched source provenance + injection scan: PASS
- model-only claim remains UNKNOWN: PASS
- official/primary source promotion capped below VERIFIED: PASS
- Knowledge Debt normalized-key deduplication: PASS
- typed repository boundary over current storage: PASS
- executable 8-case Golden Eval CI gate: PASS
- semantic claim↔source factual verification: PARTIAL / NOT YET SUFFICIENT
- live external provider verification: NOT YET VERIFIED


## Latest review-driven hardening

The latest independent review identified several remaining issues that were still valid after the earlier security pass. The following have now been implemented:

- a typed repository boundary now sits between workflows and the generic storage adapter;
- KnowledgeDebt creation uses a merge service with normalized keys, occurrence counts and task linkage;
- a read-only VERIFIER identity can fetch source URLs only through ToolBroker;
- fetched source content is bounded, hashed and injection-scanned;
- source provenance is classified separately from model output;
- Evidence Verifier v0.1 is independent from the research executor;
- model-only claims remain UNKNOWN;
- one clean official/primary fetched source can reach SUPPORTED;
- two independent clean official/primary source hosts can reach STRONG;
- rules-only verification never emits VERIFIED;
- Report conclusions preserve verifier notes and the Report records verifier identity/run metadata;
- router recommendation vs actual executor outcome is now recorded for future Laya evaluation;
- ToolBroker internals use private fields so workers cannot reach its storage handle;
- SYSTEM role no longer has task.delegate;
- Golden Eval is executable in CI with an initial 8-case baseline.

Important limitation: the current verifier proves **provenance/fetchability/trust-tier conditions**, not full semantic entailment between a claim and source text. VERIFIED remains intentionally unreachable in this v0.1 implementation.
