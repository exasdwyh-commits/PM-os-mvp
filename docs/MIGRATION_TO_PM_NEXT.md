# Migration map to PM-next

This MVP should be used as a reference package, not copied wholesale.

## Phase A — isolate interfaces
Create PM-next interfaces corresponding to:
- `DecisionPlane`
- `ModelRegistry`
- `CapabilityGateway`
- `Workforce`
- `DecisionCouncil`
- `CompanyBrain`

Keep existing PM-next agents behind adapters.

## Phase B — shadow only
Wire task classification/model recommendations into existing runs, but keep `mode=shadow`. Record recommendation, selected model, latency, cost estimate and final task outcome. Do not allow the router to change models yet.

## Phase C — governance first
Put high-impact tools behind the capability gateway before giving workers more autonomy. Recommended approval-required set:
`git.merge`, `deploy.production`, `database.migrate`, destructive file operations, credential access, payment/legal actions.

## Phase D — workforce split
Turn current monolithic project execution into explicit roles:
Planner/PM → Coder → QA → Reviewer. Persist the run graph and checkpoint after each accepted stage.

## Phase E — product council
Replace single-score product evaluation with evidence-backed roles and an explicit skeptic/risk stage. Scores can remain as supporting data; they should not be the sole decision mechanism.

## Phase F — outcome learning
Add an asynchronous reflection job only after real outcomes exist. Store: original evidence, decision, experiment, observed outcome, reflection, reusable lesson. Never let a reflection overwrite the original decision record.
