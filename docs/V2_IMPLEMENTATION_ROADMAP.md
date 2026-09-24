# PM OS V2 — Revised Implementation Roadmap

This roadmap supersedes the earlier phase order. The revision prioritizes real-world validation, privacy/governance, and evals before autonomy.

## North-star loop

```text
understand → plan → execute → verify → report → learn
```

The assistant may be proactive, but autonomy is earned through evaluation and governance.

---

## Architecture authority order

When components disagree, authority is:

1. **Human principal** — final business authorization.
2. **Sentinel / ToolBroker policy** — security and action authority.
3. **Evidence / independent Verifier** — factual and quality authority.
4. **Department Assistant** — task/project orchestration authority.
5. **Reflex Router / Laya / expert agents / digital employees** — advisory or execution roles only.

Routing may fail open for model selection. Safety, privacy and protected actions fail closed.

V2 assumes a **single principal, single department instance**. Multi-user enterprise RBAC is deferred, but records must carry actor/owner identifiers so it can be added later.

---

## Persistent task lifecycle

Use six durable stages rather than checkpointing every conceptual step:

```text
INTAKE → PLAN → EXECUTE → VERIFY → REPORT → LEARN
```

Each stage owns a checkpoint schema and can resume idempotently.

---

## Phase 0A — Freeze contracts and terminology

Required contracts:
- Project
- Goal
- Task
- Evidence
- KnowledgeItem
- KnowledgeDebt
- Report
- Decision
- Correction
- Delegation / Run
- ApprovalGrant
- Improvement
- Cost/Budget
- Event

Required cross-cutting fields:
- `dataClass`
- actor / owner
- task `origin`
- `reasonLinks`
- priority
- deadline
- budget
- `autonomyLevel`
- correlation / causation IDs

Epistemic model:
- `claimKind`: FACT / INFERENCE / ESTIMATE / OPINION / FORECAST
- `evidenceLevel`: VERIFIED / STRONG / SUPPORTED / WEAK / UNKNOWN
- freshness tracked separately from truth/evidence status
- classifier confidence is allowed only for routing/classification, not factual truth

Exit criteria:
- contracts versioned;
- contract tests green;
- core uses no domain-specific product vocabulary;
- terminology glossary is stable.

---

## Phase 0B — Durable storage before autonomy

Introduce a Storage Adapter with SQLite as the first implementation.

Persist at minimum:
- projects;
- tasks;
- events;
- audit;
- approvals;
- evidence;
- reports;
- knowledge;
- knowledge debt;
- improvements.

Do not bind core interfaces to one SQLite library. A later Postgres adapter should be possible.

Exit criteria:
- restart preserves task/project/audit state;
- append-only audit/event behavior is enforced by storage;
- IDs are concurrency-safe.

---

## Phase 0C — Governance boundary

Replace task-start-only checks with a **ToolBroker** boundary.

Every tool call must include:
- runtime-bound identity;
- capability;
- resource scope;
- task/run ID;
- action hash when relevant;
- ApprovalGrant when required.

ApprovalGrant must include:
- approver;
- task scope;
- capability;
- resource;
- validity window;
- single-use semantics when appropriate.

Add independent `EVOLUTION` role. It must not modify governance, credentials, production policy or runtime supervisor.

Exit criteria:
- worker cannot self-declare role;
- protected action cannot use a boolean `approved=true`;
- resource mismatch denies the action;
- every tool call is auditable.

---

## Phase 0D — Privacy and untrusted-content boundary

Before any real external research/model adapter:

Implement:
- data-class policy;
- provider allowed-data-class metadata;
- external disclosure filter;
- `EXTERNAL_DISCLOSURE` event;
- evidence trust tiers;
- external content marked untrusted by default;
- prompt-injection / instruction-like-content detection;
- tool-result data separated from system instructions.

Rules:
- external content cannot become VERIFIED merely because an agent summarizes it;
- private company data cannot be silently routed to an external model;
- no policy-compliant model = explicit no-route, not frontier fallback.

Exit criteria:
- CONFIDENTIAL/RESTRICTED fixture cannot leave the allowed boundary;
- injected webpage instructions cannot alter tool policy;
- evidence provenance survives summarization.

---

## Phase 0E — Eval baseline

Create the first 20–30 golden tasks for the Product/R&D Director Assistant.

Include:
- market research;
- formulation/product concept;
- costing;
- regulatory/evidence review;
- knowledge retrieval;
- explicit UNKNOWN cases;
- adversarial prompt-injection cases;
- privacy-routing cases.

Eval records should measure observable properties, not self-score:
- required evidence present;
- forbidden unsupported claim absent;
- correct UNKNOWN behavior;
- correct source class;
- correct approval behavior;
- user correction retained;
- report schema valid.

Exit criteria:
- baseline score recorded before major model/router changes;
- no self-evolution change can bypass eval gates.

---

## Phase 1 — First real vertical slice

Do this earlier than the old roadmap.

Target scenario:

> “我想做一款新的功能食品，先看看市场、配方、成本和法规有没有机会。”

Implement only the thin path needed for:

```text
Conversation
→ Project + Task
→ Context retrieval
→ one real research/expert provider
→ Evidence
→ independent Verify pass
→ Report
→ Knowledge Debt
→ persistent Audit
```

The Report contract is the primary user deliverable.

Exit criteria:
- one real provider is used;
- report retains source/evidence links;
- unsupported facts remain UNKNOWN/WEAK;
- task and report survive restart;
- provider failure degrades honestly rather than fabricating completion.

---

## Phase 2 — Expert Registry + Reflex Router

Add:
- Model resources;
- AgentDefinition;
- EmployeeProfile as separate layers;
- Laya/Jev-like fast classifier adapter;
- routing shadow mode;
- cost/latency/privacy/availability metadata;
- routing events.

Rules:
- reflex risk is advisory;
- safety risk is determined by requested capability/policy;
- router cannot grant permissions;
- local rule fallback returns no synthetic confidence.

Exit criteria:
- routing quality measured against golden tasks;
- privacy filters are hard constraints;
- shadow recommendations never alter the selected model.

---

## Phase 3 — Knowledge Steward

Implement:
- Working Memory;
- Project Memory;
- Company Knowledge;
- Evidence Vault;
- Knowledge Patch proposal;
- knowledge version/supersession chain;
- stale/freshness handling;
- Knowledge Debt deduplication;
- source hierarchy and contradiction handling.

Promotion rule:
- Steward may write Project Memory;
- Company Knowledge promotion requires evidence threshold and/or human approval;
- model agreement alone never promotes knowledge.

Exit criteria:
- repeated knowledge gaps consolidate;
- stale data stays historically true but is marked stale;
- conflicting sources remain visible.

---

## Phase 4 — Evolution Engine

Implement:
- cause × signal gap model;
- correction records;
- repeated-error grouping;
- improvement inbox;
- requirement proposal;
- eval/regression case proposal;
- versioned behavior assets;
- rollback metadata.

Rules:
- improvement proposals use occurrence counts, evidence and impact—not fake confidence scores;
- prompt changes are production behavior changes and must pass eval/shadow gates;
- Builder works in isolated branch/workspace only.

Exit criteria:
- repeated real failures consolidate into one useful requirement;
- user correction generates a regression case;
- no change can self-deploy.

---

## Phase 5 — Proactive Engine in A1 shadow

Before A2, run proactive planning without executing it.

Generate candidates from:
- project goals;
- deadlines;
- blocked tasks;
- Knowledge Debt;
- stale evidence;
- recurring responsibilities;
- outcome checks;
- improvement backlog.

Mandatory guards:
- daily task/cost/token budget;
- topic deduplication;
- proactive depth ≤ 1;
- persistent A0 kill switch;
- no proactive task without a reason link.

User sees:

> “如果允许主动执行，我今天会做这 5 件事。”

Exit criteria:
- suggestions are useful and low-noise across an observation period;
- budget accounting is correct;
- no recursive proactive loop.

---

## Phase 6 — A2 safe proactive execution

Allow only low-risk internal work:
- refresh research;
- prepare reports;
- reconcile notes;
- run tests;
- prepare meeting briefs;
- inspect open tasks;
- organize knowledge.

Protected external actions remain approval-gated.

Exit criteria:
- daily proactive digest;
- budget/resource guardrails proven;
- every proactive task has traceable origin/reason.

---

## Phase 7 — Workforce / Digital Employees

Generalize supervised execution beyond software.

Separate:
- Department Assistant / Planner;
- Executor/Digital Employee;
- independent Verifier;
- Reviewer where needed.

Delegation records include:
- expected output schema;
- budget;
- deadline;
- timeout;
- checkpoint;
- cancellation;
- partial result.

Software retains Coder → QA → Reviewer.

Exit criteria:
- execution can resume from checkpoint;
- executor cannot self-verify as authoritative;
- tool calls remain brokered.

---

## Phase 8 — Persistent local runtime

Implement:
- daemon;
- durable queue;
- leases/locks;
- idempotency keys;
- scheduler;
- event bus;
- workspace manager;
- browser worker;
- health recovery;
- authenticated approval client.

Exit criteria:
- restart/resume works;
- side-effecting steps do not duplicate after recovery;
- approval tokens cannot be replayed;
- traces explain overnight work.

---

## Phase 9 — Department templates and client

First template: Product/R&D Director Assistant.

Client default:
1. Conversation / voice
2. Today / schedule
3. Approvals
4. Reports
5. Projects

Project drill-down:
- report;
- decisions;
- evidence;
- Kanban/Gantt;
- files;
- risks;
- discussion room.

Multi-agent Discussion Room and Executive Mode are one collaboration mechanism. Product Council is a workflow that can run inside that room.

---

## Non-negotiable tests

1. UNKNOWN remains UNKNOWN when reliable evidence is unavailable.
2. Classifier/model confidence never substitutes for evidence level.
3. External model failure does not fabricate completion.
4. CONFIDENTIAL data cannot be routed to disallowed providers.
5. External disclosure is auditable.
6. Prompt injection in external content cannot alter tool/security policy.
7. External content is untrusted by default.
8. Evidence provenance survives report summarization.
9. Model agreement cannot create VERIFIED knowledge.
10. Worker cannot bypass ToolBroker.
11. Router cannot grant permissions.
12. Approval requires a scoped ApprovalGrant.
13. Evolution role cannot modify governance.
14. User correction persists and can create a regression case.
15. Restart preserves state.
16. Side effects are idempotent after restart.
17. Repeated failures/debts consolidate rather than spam duplicates.
18. Proactive tasks require reason links and obey depth/budget limits.
19. A0 kill switch stops proactive execution.
20. Core contracts contain no product-domain hardcoding.

---

## Immediate implementation order

1. Finish Phase 0A contracts.
2. Storage Adapter + SQLite.
3. ToolBroker + ApprovalGrant.
4. dataClass/privacy/disclosure/untrusted evidence.
5. Report + Evidence path.
6. golden eval set.
7. first real provider.
8. end-to-end Product/R&D vertical slice.
9. Expert Registry + router shadow.
10. Knowledge Steward.
11. Evolution Engine.
12. proactive A1 shadow.
13. A2 execution.
14. persistent daemon/browser runtime.

Do not start broad autonomous computer use before steps 1–11 are stable.
