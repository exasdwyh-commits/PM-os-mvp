# PM OS V2 — Department AI Assistant Blueprint

## 0. Product definition

PM OS V2 is not a chatbot, not a single-model assistant, and not a collection of visible agents.

It is a **department-level AI assistant / AI Chief of Staff** that becomes the single conversational entry point for managers and domain leaders.

The user describes an idea, problem, or request in natural language. The assistant decides whether to:

1. answer directly;
2. retrieve existing company knowledge;
3. research missing knowledge;
4. delegate work to a specialist model/agent/tool;
5. split a complex goal into multiple tasks;
6. supervise execution and quality;
7. ask the human to participate when the matter is important or risky;
8. summarize decisions and maintain project/organizational memory;
9. record capability/knowledge gaps and propose product improvements.

The product principle is:

> The assistant does not need to know everything. It must know what it knows, what it does not know, where to obtain missing knowledge, how to verify it, and how to avoid starting from zero the next time.

---

## 1. User experience

### 1.1 Default experience: one assistant

Normal managers should not need to understand models, prompts, MCP, skills or workflows.

Default UI:

```text
Department Assistant

“有什么需要我处理的吗？”

[ natural-language input ]
```

The system hides internal complexity.

Advanced configuration can expose models, agent roles, workflows, permissions, audit logs and knowledge administration.

### 1.2 Three collaboration modes

#### Assistant Mode
The department assistant handles the task itself.

Examples:
- summarize a meeting;
- retrieve known company information;
- organize documents;
- answer routine questions;
- perform low-risk calculations.

#### Delegation Mode
The assistant remains the owner of the task but delegates specialized work.

Examples:
- market research;
- competitor research;
- product formulation;
- cost analysis;
- scientific evidence review;
- software implementation.

#### Executive Mode
For important work, the human talks directly with a specialist/consultant while the department assistant remains present as chief of staff.

The assistant:
- prepares context;
- records the discussion;
- extracts decisions;
- tracks unresolved questions;
- assigns follow-up tasks;
- updates project memory.

---

## 2. Central agent role

The central assistant is **not expected to be the deepest expert**.

Its primary capabilities are:

```text
Understand
→ Decompose
→ Route
→ Supervise
→ Verify
→ Report
→ Remember
→ Improve
```

Specialist depth comes from expert agents, external services and tools.

The central assistant is the stable product identity. Models are replaceable resources.

---

## 3. System architecture

```text
                         USER
                          │
                 Department Assistant
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
 Reflex / System-1                     Context Manager
 (fast decision engine)                     │
        └─────────────────┬─────────────────┘
                          ↓
                     Orchestrator
                          │
       ┌──────────────────┼──────────────────┐
       ↓                  ↓                  ↓
 Direct Work        Expert Router          Tools
                          │
         ┌────────────────┼────────────────┐
         ↓                ↓                ↓
 Research Agent      Domain Agents     Coding/Browser/etc.
         │
         └────────────────┬────────────────┘
                          ↓
                   Evidence / QA Layer
                          ↓
                  Capability Gateway
                          ↓
                     Final Result
                          ↓
        ┌─────────────────┴──────────────────┐
        ↓                                    ↓
 Knowledge Steward                    Evolution Engine
        ↓                                    ↓
 Company Brain                       Improvement Backlog
```

---

## 4. Reflex / System-1 layer

Use a small, fast decision model or rule engine for cheap routing decisions.

Potential implementation: Laya, Jev-like classifier, or another local lightweight model.

It should make bounded decisions such as:
- task intent;
- skill selection;
- whether existing knowledge is sufficient;
- whether research is needed;
- which expert class is relevant;
- risk class;
- whether escalation is required;
- estimated complexity;
- model tier recommendation.

It must **not** decide:
- final investment/product decisions;
- legal/regulatory truth;
- destructive actions;
- production deployment;
- credential access;
- irreversible database operations.

A high confidence score from the fast classifier is not proof that the classification is correct.

---

## 5. Intelligence layer / expert routing

### 5.1 Expert Registry

Maintain a structured registry of available intelligence resources.

Each entry should record:

```text
provider
model / agent
specialties
reasoning strength
coding strength
research strength
vision
tool support
context window
latency
cost
privacy class
availability
allowed data class
```

Possible experts include:
- local general model;
- GPT-class reasoning model;
- coding agent / Codex-style worker;
- MetaSo / research search agent;
- scientific literature agent;
- regulatory agent;
- cost/finance agent;
- market research agent;
- supplier/quotation agent;
- company-specific specialist agents.

### 5.2 Routing principle

The assistant decides:

```text
Can I do this reliably myself?
        │
   ┌────┴────┐
   yes       no
   │         │
 direct   Expert Router
 work        │
             ↓
       best specialist(s)
```

Routing factors:
- domain match;
- importance;
- risk;
- information freshness;
- search requirement;
- reasoning requirement;
- coding/vision requirement;
- privacy;
- cost;
- latency.

---

## 6. Task / project model

The system should manage **projects and goals**, not only chats.

A project can contain:

```text
Goal
Status
Owners
Tasks
Decisions
Open questions
Research
Files
Evidence
Costs
Risks
Meetings
Knowledge
Experiments
Outcomes
Lessons
```

Conversation is an interface to the project; it is not the primary source of truth.

---

## 7. Task lifecycle

Every substantial task follows a durable lifecycle:

```text
1. Intake
2. Intent + risk classification
3. Context / memory retrieval
4. Knowledge sufficiency check
5. Plan / decomposition
6. Resource selection
7. Execution / delegation
8. Supervision
9. Evidence / quality verification
10. Human escalation if needed
11. Final synthesis
12. Decision / action
13. Project + knowledge update
14. Evaluation
15. Gap detection
16. Improvement proposal
17. Outcome tracking
18. Reflection
```

Complex tasks must be resumable from checkpoints.

---

## 8. Epistemic policy: do not fake certainty

For important factual claims, internally classify epistemic state:

- `VERIFIED` — verified through primary/company/official evidence.
- `STRONG` — multiple high-quality sources agree.
- `SUPPORTED` — credible but limited evidence.
- `INFERRED` — logical inference from known facts.
- `ESTIMATED` — numeric or practical estimate.
- `UNCERTAIN` — evidence insufficient/conflicting.
- `UNKNOWN` — cannot answer reliably.

Rules:
- UNKNOWN is an acceptable result.
- Do not convert uncertainty into confident prose.
- For high-impact questions, evidence level must be visible or available in the audit record.
- A model's opinion is never automatically evidence.
- Agreement among multiple models is not proof of truth.

Unknown/uncertain results can trigger a research or knowledge-completion task.

---

## 9. Knowledge Steward

The Knowledge Steward actively maintains organizational knowledge.

It works in two modes.

### 9.1 Task-triggered learning

During a real task:

```text
Question
↓
Knowledge confidence check
↓
LOW / UNKNOWN
↓
Knowledge Router
↓
Research / specialist agents
↓
Evidence verification
↓
Answer
↓
Knowledge Patch
```

### 9.2 Idle learning

When the system is idle:
- review high-priority knowledge debts;
- update stale knowledge;
- research recurring unknowns;
- reconcile conflicting evidence;
- build reusable internal references.

Idle work must obey cost, privacy and resource budgets.

---

## 10. Knowledge Debt

Every meaningful knowledge deficiency becomes a tracked item.

Example:

```text
KD-027
Topic: AKG food-regulation status
Reason: could not verify during product task
Importance: HIGH
Missing: official regulatory basis
Suggested sources: official government source + regulatory specialist
Status: OPEN
```

Triggers:
- unknown answer;
- repeated lookup;
- conflicting sources;
- stale knowledge;
- user correction;
- missing supplier/company data;
- specialist failure.

Knowledge debt provides a prioritized learning queue instead of blindly crawling information.

---

## 11. Knowledge model

Do not create a single undifferentiated vector store.

Use layers:

### Working Memory
Short-lived task context.

### Project Memory
Decisions, context and artifacts relevant to a specific project.

### Company Knowledge
Validated reusable organizational facts, policies, methods and lessons.

### Evidence Vault
Original supporting evidence: documents, webpages, reports, datasets, quotations, meeting records.

Every durable knowledge item should record:
- content;
- source;
- source date;
- captured date;
- scope;
- evidence level;
- confidence;
- linked project;
- expiration/review date;
- conflicts;
- provenance.

Example:

```text
Supplier price: 420 RMB/kg
Source: Supplier A quotation
Date: 2026-09-12
Scope: ≥25 kg order
Evidence: VERIFIED internal quotation
Review/expiry: 2026-10-12
```

---

## 12. Self-Evolution Engine

Self-evolution means **proposing and validating improvements**, not silently rewriting the production system.

After tasks, evaluate:
- failure;
- missing capability;
- missing tool;
- missing knowledge;
- wrong answer;
- user correction;
- low-quality output;
- repeated error;
- excessive cost/latency;
- weak workflow;
- missing memory.

Gap classes:

```text
CAPABILITY_GAP
TOOL_GAP
KNOWLEDGE_GAP
MODEL_GAP
FAILURE
REPEAT_ERROR
UNCERTAINTY
QUALITY_GAP
WORKFLOW_GAP
USER_CORRECTION
EFFICIENCY_GAP
MISSING_MEMORY
```

The Evolution Engine turns repeated/high-impact gaps into requirement proposals.

Example:

```text
REQ-0082
Product Cost Calculation Capability

Trigger:
4 recent product tasks lacked reliable costing.

Proposal:
- BOM Cost Skill
- supplier-price source
- channel commission rules
- low/base/high scenario output

Impact: HIGH
Confidence: 0.92
```

---

## 13. Controlled evolution policy

Initial phase:

```text
Agent proposes
↓
Human approves
↓
Coder/Builder implements
↓
QA
↓
Regression tests
↓
Review
↓
Release
```

The system may eventually self-update low-risk assets such as:
- prompt templates;
- non-sensitive knowledge indexes;
- test cases;
- low-risk skill metadata.

The system must never autonomously modify:
- security policy;
- Capability Gateway / Sentinel;
- credential vault;
- production permissions;
- critical database schema;
- approval rules;
- core runtime supervisor.

---

## 14. User corrections are first-class learning signals

A user correction should generate:
- correction record;
- root-cause analysis;
- knowledge update proposal;
- regression case when appropriate.

Example:

```text
User correction
↓
Was the error caused by:
  stale knowledge?
  wrong retrieval?
  wrong project context?
  bad reasoning?
↓
Correction record
↓
Company Brain
↓
Regression test
```

Goal: the system should become less likely to repeat the same mistake.

---

## 15. Evaluation and outcome learning

The assistant must not grade itself solely with subjective self-scores.

Use independent signals:

### Software
- tests;
- CI;
- reviewer;
- static checks.

### Research
- source quality;
- source coverage;
- primary evidence;
- contradiction handling.

### Product decisions
- evidence completeness;
- supplier verification;
- compliance verification;
- later real-world outcome.

### Long-term outcome learning

```text
Decision
↓
Experiment
↓
Observed outcome
↓
Reflection
↓
Reusable lesson
↓
Future decision
```

Observed business outcomes are more valuable than internal model agreement.

---

## 16. Governance / Sentinel

All high-impact external actions pass through a trusted gateway.

```text
Agent
↓
Capability Gateway / Sentinel
↓
ALLOW / ASK HUMAN / DENY
↓
Tool / Computer / External service
```

Protected examples:
- production deployment;
- merge to protected branches;
- database migration/destruction;
- external message sending;
- purchases/payments;
- credential access;
- legal/regulatory submissions.

Agent runtime cannot grant itself new permissions.

---

## 17. Credential and privacy architecture

Principle:

> The agent may receive permission to use a credential without being given the plaintext secret.

Private company material must not be sent by default to external experts.

Data policy:
1. local processing first for private documents;
2. external model only when allowed;
3. send minimum necessary context;
4. redact identifiers/secrets where possible;
5. record external disclosure in audit history.

---

## 18. Long-running local runtime

The department assistant should eventually run as a persistent local service.

Possible structure:

```text
pm-agentd
├── Orchestrator
├── Task Queue
├── Scheduler
├── Event Bus
├── Workspace Manager
├── Browser Worker
├── Coding Worker
├── Knowledge Steward
├── Evolution Engine
└── Capability Gateway
```

Mac launchd can keep the daemon alive.

Mobile/web clients become remote conversation and approval surfaces.

---

## 19. Product packaging

One core Agent OS can produce role-specific assistants through:

```text
Skills
Knowledge
Permissions
Expert Registry
Default Workflows
Domain Policies
```

Possible products:
- Product/R&D Director Assistant
- CEO Assistant
- Marketing Director Assistant
- Sales Director Assistant
- Supply Chain Assistant

The interface stays simple; specialization happens below the surface.

---

## 20. V2 MVP scope

V2 should prove the architecture before attempting full autonomy.

Required:
1. single assistant chat entry;
2. durable Project/Task model;
3. Reflex Router interface;
4. Expert Registry;
5. mock + real-provider adapters;
6. Knowledge confidence state;
7. Knowledge Debt;
8. Knowledge Steward;
9. Evolution Log + Requirement Proposal;
10. Capability Gateway;
11. Coder → QA → Reviewer workflow;
12. resumable task state;
13. audit/event log;
14. simple dashboard for Tasks / Knowledge / Improvements;
15. no-key demo path.

Deferred:
- full virtual machine;
- autonomous production deploy;
- autonomous purchases;
- unrestricted browser control;
- automatic self-modification;
- large enterprise RBAC matrix.

---

## 21. Acceptance scenario

A valid V2 demo should handle:

> “我想做一款新的功能食品，先看看市场、配方、成本和法规有没有机会。”

Expected behavior:

1. classify as product opportunity task;
2. create a project automatically;
3. retrieve relevant company knowledge;
4. identify missing knowledge;
5. split into market / formulation / cost / compliance work;
6. route to suitable specialists;
7. label uncertainty/evidence;
8. supervise and combine results;
9. return an executive summary, not raw agent transcripts;
10. store evidence and project decisions;
11. record unresolved knowledge debt;
12. propose any missing capability as an improvement requirement;
13. require human participation before major irreversible decisions.

If this works well, the architecture is ready for deeper integration.


---

## 22. Long-term client experience: Conversational Company OS

The long-term product should hide nearly all operational complexity from normal managers.

### Default client surface

For non-specialist work, the client can be almost entirely:

```text
Conversation
+
Schedule / reminders
+
Notifications / approvals
+
Daily / weekly summaries
```

The user should not need to open internal agent pages, workflow editors, model selectors or raw execution panels.

### Professional work

Professional tasks still begin from conversation.

Example:

> “开发一个女性餐前轻体饮，市场、配方、成本、法规一起看。”

The assistant runs the internal system, then the user mainly sees:

- executive product report;
- evidence and risk summary;
- unresolved questions;
- recommendation/decision points;
- project progress;
- Gantt chart or Kanban board when needed.

Detailed internals are drill-down views, not the default interface.

### Voice

The client should eventually support voice as a first-class interface:

```text
Voice request
↓
Department Assistant
↓
Task / Project / Expert orchestration
↓
Voice or report response
```

Voice is not a separate product; it is another input/output surface over the same durable project/task system.

### Multi-agent discussion rooms

For important work, the user can open a temporary discussion room with selected specialist agents.

Example:

```text
User
├── Department Assistant / Moderator
├── Product Expert
├── Market Research Expert
├── Cost Expert
└── Compliance Expert
```

The Department Assistant should:
- prepare shared context;
- prevent duplicated discussion;
- surface disagreement;
- keep an evidence ledger;
- summarize decisions;
- convert conclusions into tasks;
- update project memory after the meeting.

The user should never need to manually coordinate the agents.

---

## 23. Digital Employee model

The system should evolve from “multiple AI tools” into “digital employees”.

Each digital employee is:

```text
Role
+ Skills
+ Knowledge scope
+ Permissions
+ Default experts/models
+ Workflows
+ Quality standards
+ KPI / evaluation signals
+ Memory
```

Examples:

- Product R&D Employee
- Market Research Employee
- Scientific Evidence Employee
- Cost & BOM Employee
- Compliance Employee
- Software Engineering Employee
- QA Employee
- Operations Employee

They are not independent chatbots. The Department Assistant supervises and coordinates them as a manager/chief of staff.

---

## 24. One-person team operating model

The long-term goal is to make one human capable of operating a much larger effective team.

```text
Human Leader
      │
Department Assistant
      │
┌─────┼──────────────┐
↓     ↓              ↓
R&D   Research      Operations
↓     ↓              ↓
Digital Employees / Specialist Agents
      │
      ↓
Automated execution
      │
      ↓
QA / Review / Evaluation
      │
      ↓
Executive report
      │
      ↓
Human decision only where valuable
```

The human spends time primarily on:
- strategy;
- taste/judgment;
- irreversible decisions;
- relationship/negotiation;
- final review of major work.

The system handles:
- decomposition;
- coordination;
- follow-up;
- routine verification;
- documentation;
- project tracking;
- knowledge maintenance;
- regression;
- repetitive operations.

---

## 25. UI principle: report-first, system-second

Do not reproduce traditional enterprise software navigation unnecessarily.

Default views should be:

1. **Conversation**
2. **Today / Schedule**
3. **Approvals**
4. **Reports**
5. **Projects**

Only when the user enters a project should they see:
- product report;
- timeline;
- Kanban;
- Gantt;
- decisions;
- evidence;
- files;
- risks;
- specialist discussion history.

Raw agent traces, model prompts and internal orchestration belong in an advanced/debug layer.

The assistant should be more meticulous than a human operator in routine follow-up, but all high-impact actions remain auditable and governed.

---

## 26. “Unmanned factory” workflow

For repeatable professional domains such as product development:

```text
Idea
↓
Opportunity research
↓
Market validation
↓
Product concept
↓
Formula / specification
↓
Costing
↓
Compliance review
↓
Risk review
↓
Internal QA
↓
Product report
↓
Human decision
↓
Project execution
↓
Outcome tracking
↓
Reflection / evolution
```

Most intermediate steps should be performed automatically by digital employees.

The user consumes the **product report and decision points**, not the raw process.

This is the target operating model for PM OS.
