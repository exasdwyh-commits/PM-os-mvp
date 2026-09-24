# V2 handoff for a local coding agent

Treat these files as the authoritative planning order:

1. `docs/DEPARTMENT_AGENT_V2_BLUEPRINT.md`
2. `docs/V2_IMPLEMENTATION_ROADMAP.md`
3. `docs/ARCHITECTURE.md`
4. `src/contracts/`
5. `src/core/`
6. `config/`

## Current product definition

PM OS V2 is a department-level AI chief of staff. It is the user's single conversational entry point and coordinates specialist agents/digital employees, knowledge, projects, verification, reporting, proactive work and controlled self-improvement.

## Architecture rules

- V2 currently assumes one principal / one department instance.
- Department Assistant orchestrates; it is not the final factual or security authority.
- Authority order: Human → Sentinel/ToolBroker → Evidence/Verifier → Department Assistant → Reflex/Experts/Employees.
- Laya/System-1 is advisory routing/reflex only.
- Routing may fail open; safety/privacy/protected action checks fail closed.
- Every real tool call must pass through ToolBroker.
- Approval is a scoped ApprovalGrant, never a boolean.
- Private data routing is constrained by `dataClass`.
- External content is untrusted input.
- Model/agent agreement is not evidence.
- Use `claimKind` and `evidenceLevel` separately.
- Freshness is separate from historical truth.
- Company Knowledge promotion is stricter than Project Memory.
- Evolution proposes changes; it does not self-deploy them.
- Prompt/skill changes that alter behavior require eval/shadow gates.
- Proactive execution begins in A1 shadow before A2.

## Current implementation priority

Work only in the order defined in `V2_IMPLEMENTATION_ROADMAP.md`.

The immediate target is a thin, real Product/R&D vertical slice:

```text
Conversation
→ durable Project/Task
→ one real provider
→ Evidence
→ Verify
→ Report
→ Knowledge Debt
→ persistent Audit
```

Do not expand browser/VM autonomy before this slice is measurable and governed.

## Required engineering discipline

- Preserve existing tests.
- Add contract/policy tests before enabling behavior.
- Keep provider code behind adapters.
- Keep storage behind an adapter.
- Use runtime-bound identities.
- Do not let workers hold unrestricted tool handles.
- Use idempotency keys for side effects.
- Add correlation IDs to long-running work.
- Keep domain templates outside generic core code.

## Definition of useful progress

A change is useful only if it improves one of:
- reliability;
- evidence quality;
- privacy;
- governance;
- measurable task quality;
- durable recovery;
- user-facing report quality.

Avoid adding more visible agent UI or configuration surfaces unless required by the client experience.
