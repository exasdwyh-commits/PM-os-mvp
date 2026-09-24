# PM OS V2 Glossary

These terms are canonical for V2.

| Canonical term | Meaning | Notes / aliases |
|---|---|---|
| Department Assistant | User-facing chief-of-staff agent and orchestration owner | Not the deepest specialist |
| Reflex Router | Fast, low-cost advisory classification/routing layer | Laya / System-1 / Decision Plane implementation family |
| Expert Resource | A model, research service, tool-backed specialist or provider | Resource, not an employee identity |
| AgentDefinition | Prompt/tools/model preferences/behavior definition for an agent run | Sits above raw model |
| Digital Employee | Role profile combining skills, knowledge scope, permissions, workflows, eval standards and agent definitions | Long-lived organizational role |
| Orchestrator | Runtime component that decomposes and supervises tasks | Usually driven by Department Assistant |
| Verifier | Independent run/role that evaluates evidence or output quality | Must not be the sole executor grading itself |
| Sentinel | Governance concept for trusted action/privacy enforcement | Policy authority |
| ToolBroker | Concrete runtime boundary enforcing Sentinel policy on each tool call | Workers do not bypass it |
| ApprovalGrant | Scoped, durable authorization for a protected capability/resource/action | Never a boolean |
| Evidence Vault | Store of original supporting sources/artifacts with provenance | External evidence is untrusted input by default |
| Knowledge Steward | Maintains knowledge, debt, freshness, conflicts and promotion proposals | Not a generic crawler |
| Company Knowledge | Reusable validated facts/policies/methods | Separate from decision history |
| Company Brain | Decisions, outcomes, reflections and lessons | Not the factual evidence store |
| Knowledge Debt | Durable record of a meaningful missing/stale/conflicting knowledge need | Deduplicated and prioritized |
| Evolution Engine | Converts failures/corrections/gaps into improvement proposals and eval cases | Cannot self-deploy |
| Proactive Work Engine | Generates goal-linked candidate work from project state, deadlines, debt and responsibilities | Starts in A1 shadow |
| Discussion Room | Human + selected expert agents collaboration surface | Executive Mode uses this mechanism |
| Product Council | A reusable expert workflow/debate pattern | Can run inside Discussion Room |
| Report | Primary professional deliverable for users | Keeps evidence links and decision points |
| claimKind | Type of assertion: FACT / INFERENCE / ESTIMATE / OPINION / FORECAST | Not evidence strength |
| evidenceLevel | Evidence strength: VERIFIED / STRONG / SUPPORTED / WEAK / UNKNOWN | Not model confidence |
| classifierConfidence | Confidence of a routing/classification model | Never used as factual truth |
| dataClass | Information sensitivity: PUBLIC / INTERNAL / CONFIDENTIAL / RESTRICTED | Hard routing constraint |
