# PM OS MVP Architecture

## Goal
This repository is a reference implementation, not a product fork. It demonstrates how to combine six architectural ideas into one small, auditable Agent OS core.

## 1. Decision Plane
Inspired by Hermes + Jev / TypeSafe patterns:
- typed judgments instead of prose decisions;
- `tier`, `workKind`, `risk`, `confidence` as data;
- model pool selection from a registry;
- shadow mode before automatic switching;
- fail-open fallback if the external judge is unavailable;
- large-context no-downgrade safeguard.

Production replacement point: `DecisionPlane.externalJudge` can be replaced by Jev / TypeSafe or another classifier without changing callers.

## 2. Model Registry
Inspired by multi-provider frontends such as LibreChat, but deliberately reduced to the metadata the PM OS needs for routing: provider, tier, work specialties, cost, latency, reasoning, coding, vision and context.

## 3. Capability Gateway
Inspired by OpenBot's governed action boundary:
- agents do not call dangerous tools directly;
- capability is checked at a gateway;
- approval and unattended-run rules are separate concerns;
- every decision creates an audit row.

Production direction: deny by default; policy evaluation should stay server-side and outside the worker sandbox.

## 4. Workforce Runtime
Inspired by OpenHands' separation of agent UI/runtime/sandbox/automation and by the user's desired Coder → QA → Reviewer workflow.
The MVP contains a deterministic software loop proving the separation. Real execution can later move each worker into its own process/container.

## 5. Product Decision Council
Inspired by TradingAgents' role separation and debate/risk structure, generalized away from finance:
Evidence → Advocate → Skeptic → Risk → Decision → Experiment.
The critical rule is that internal agent agreement is not treated as external market evidence.

## 6. Company Brain
A minimal append-only decision log with reserved `outcome` and `reflection` fields. The next run reads prior lessons. This is the seed of outcome-linked organizational memory.

## End-to-end flow
```text
User Task
   ↓
Decision Plane ─────→ Model Registry
   ↓
PM / Workflow
   ↓
Capability Gateway ─→ Audit / Approval
   ↓
Worker Runtime
   ↓
QA / Review / Council
   ↓
Decision + Experiment
   ↓
Company Brain
   ↓
Outcome / Reflection → future decisions
```

## Non-goals
- no browser-control implementation;
- no real LLM calls;
- no production secret store;
- no real container sandbox;
- no attempt to vendor or merge upstream source code.

Those are integration targets, not MVP requirements.
