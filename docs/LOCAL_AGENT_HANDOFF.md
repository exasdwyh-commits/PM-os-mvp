# Handoff prompt for a local coding agent

Use this repository as a **reference architecture**, not as a replacement application.

## Mission
Study this MVP, then compare it with the local PM-next codebase and produce a migration plan plus the smallest safe implementation that introduces the same architectural seams without breaking existing behavior.

## Read first
1. `README.md`
2. `docs/ARCHITECTURE.md`
3. `docs/MIGRATION_TO_PM_NEXT.md`
4. all files under `src/core/`
5. `config/models.json` and `config/policies.json`

## Rules
- Preserve existing PM-next features and data models unless a migration is explicitly justified.
- Do not import this demo wholesale.
- Introduce interfaces/adapters first; switch existing code behind them incrementally.
- Model routing must begin in **shadow mode**. Log recommendations before allowing automatic switching.
- High-impact capabilities must pass through a centralized server-side capability gateway.
- Never let an agent invent its own permissions or model IDs.
- Keep Coder, QA and Reviewer logically separate even if they initially execute in the same process.
- Product decisions must distinguish external evidence from internal agent opinions.
- Keep original decision records immutable; add outcomes/reflections as linked records or append-only updates.
- Add tests for every new policy/routing/workflow behavior before enabling it.

## First deliverables
1. `docs/AGENT_OS_GAP_ANALYSIS.md` — current PM-next vs this reference architecture.
2. `docs/AGENT_OS_MIGRATION_PLAN.md` — staged migration with rollback points.
3. A small PR/branch implementing only:
   - Model Registry interface,
   - Decision Plane in shadow mode,
   - Capability Gateway with audit records.
4. Tests proving no existing model selection or protected actions regress.

## Acceptance criteria
- Existing PM-next tests remain green.
- Router failure does not block normal work.
- Shadow routing never changes the actual model.
- A protected action is denied without the required grant/approval.
- Every policy decision is auditable.
- No secrets are written into decision logs.
