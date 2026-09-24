# PM OS V2 — Implementation Roadmap

## Guiding rule

Do not build the “perfect autonomous employee” in one pass.

Build a reliable chief-of-staff loop first:

```text
understand → route → execute → verify → report → remember → improve
```

Every phase must preserve the previous phase's tests.

---

## Phase 0 — Freeze V2 contracts

Goal: stop architecture drift.

Deliverables:
- `DepartmentAssistant` interface;
- `Task`, `Project`, `KnowledgeItem`, `KnowledgeDebt`, `Improvement` schemas;
- `ExpertRegistry` interface;
- `KnowledgeSteward` interface;
- `EvolutionEngine` interface;
- event types;
- epistemic states;
- capability policy contract.

Exit criteria:
- schemas versioned;
- contract tests;
- no provider-specific logic in core interfaces.

---

## Phase 1 — Department Assistant shell

Goal: one conversational entrance.

Implement:
- chat/session API;
- task intake;
- project auto-link/create;
- direct-work vs delegate decision;
- executive summary response shape;
- visible task status.

Do not add many specialist agents yet.

Exit criteria:
- a user can give one natural-language task;
- system creates/tracks a durable task;
- result is saved under a project.

---

## Phase 2 — Reflex Router + Expert Registry

Goal: the assistant chooses resources rather than hardcoding models.

Implement:
- fast classifier adapter;
- local fallback;
- shadow mode;
- expert capability metadata;
- privacy/cost/latency fields;
- routing log.

Start in shadow mode.

Exit criteria:
- router recommendations recorded;
- router failure never blocks tasks;
- no unsafe capability can be granted by routing output.

---

## Phase 3 — Knowledge confidence + Knowledge Steward

Goal: stop pretending the system knows things it cannot verify.

Implement:
- epistemic state on important claims;
- `UNKNOWN / UNCERTAIN` handling;
- task-triggered knowledge research;
- Evidence Vault metadata;
- Project Memory;
- Company Knowledge;
- Knowledge Debt queue.

Exit criteria:
- unknown questions can end honestly;
- knowledge gaps become durable debt items;
- verified knowledge records contain provenance and review date.

---

## Phase 4 — Research Broker

Goal: missing knowledge can be filled by the most suitable research source.

Implement adapters for:
- web research;
- MetaSo/API or equivalent research specialist;
- general high-capability LLM;
- scientific evidence source;
- internal/company documents.

Add:
- evidence deduplication;
- source hierarchy;
- contradiction detection;
- privacy filter before external calls.

Exit criteria:
- at least two expert sources can answer one research request;
- assistant can merge evidence without treating agent opinions as source facts.

---

## Phase 5 — Workforce runtime

Goal: complex execution uses supervised workers.

Implement:
- Planner/PM;
- Coder;
- QA;
- Reviewer;
- resumable checkpoints;
- bounded retry;
- failure escalation.

Exit criteria:
- demo task fails first QA, is revised, then passes;
- worker failure can resume from checkpoint;
- PM does not self-review its own execution output.

---

## Phase 6 — Evolution Engine

Goal: every failure becomes structured product feedback.

Implement:
- gap taxonomy;
- task evaluation;
- user-correction capture;
- repeated-error grouping;
- Improvement Inbox;
- automatic requirement proposal;
- regression-test proposal.

Exit criteria:
- repeated simulated failures generate one consolidated requirement;
- user correction creates a correction record;
- requirement cannot self-deploy.

---

## Phase 7 — Idle learning scheduler

Goal: useful background improvement without uncontrolled autonomous activity.

Implement:
- learning queue;
- Knowledge Debt priority;
- stale knowledge review;
- budget limits;
- idle-only scheduling;
- resource/cost ceilings;
- daily digest.

Exit criteria:
- idle jobs only act inside configured budgets;
- knowledge changes preserve provenance;
- no production code/security policy is modified.

---

## Phase 8 — Local persistent runtime

Goal: become a long-running assistant on a Mac.

Implement:
- daemon process;
- durable task queue;
- scheduler;
- event bus;
- workspace manager;
- browser worker;
- health recovery;
- mobile/web approval endpoint.

Exit criteria:
- restart does not lose task state;
- long task resumes after process restart;
- high-risk action pauses awaiting approval.

---

## Phase 9 — Department templates

Goal: turn platform capability into understandable products.

First template: Product/R&D Director Assistant.

Default skills:
- product opportunity research;
- market/competitor research;
- formulation;
- evidence;
- compliance;
- cost model;
- supplier comparison;
- project follow-up.

Then derive:
- CEO Assistant;
- Marketing Assistant;
- Sales Assistant;
- Supply Chain Assistant.

---

## Immediate implementation order

For the current repository, implement in this exact order:

1. contracts + data schemas;
2. Project/Task persistence;
3. epistemic states;
4. Knowledge Debt;
5. Knowledge Steward;
6. Evolution Log;
7. Improvement Requirement generator;
8. Expert Registry upgrade;
9. router shadow mode;
10. Research Broker adapters;
11. resumable Workforce;
12. dashboard;
13. background learning;
14. local daemon.

Do not begin persistent VM/browser autonomy before steps 1–11 are stable.

---

## Non-negotiable tests

1. Unknown answer remains UNKNOWN when evidence cannot be found.
2. External model failure does not block the main assistant.
3. User correction persists and is retrievable in the next relevant task.
4. Knowledge Debt is created only for meaningful gaps, not every trivial unanswered phrase.
5. Evidence provenance survives summarization.
6. Model/agent agreement is never promoted to VERIFIED without external/company evidence.
7. A worker cannot bypass Capability Gateway.
8. Router cannot grant permissions.
9. Protected actions require approval.
10. Evolution Engine cannot modify its own governance layer.
11. Restart preserves project/task state.
12. Repeated failures consolidate into a requirement instead of creating duplicate noise.

---

## Definition of “ready to merge concepts into PM-next”

The reference MVP is ready to influence the main product when:

- one end-to-end product-research scenario passes;
- task state is durable;
- knowledge debt and improvement proposals are useful rather than noisy;
- unknown/uncertain answers are handled correctly;
- specialist routing improves output quality measurably;
- audit/approval behavior is deterministic;
- regression suite is green.

Until then, PM-os-mvp remains an architecture laboratory.
