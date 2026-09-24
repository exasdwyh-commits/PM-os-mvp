# Source inspiration and boundaries

This repository is an original reference implementation based on architectural patterns observed in public projects. It does not copy upstream source code.

- Public Jev routing/skill implementations — typed routing decisions, confidence, shadow mode, fail-open and risk floors.
- `typesafe-ai/skills` — typed judgments rather than free-form prose routing.
- `CopilotKit/OpenBot` — server-side action gateway, policy, audit and per-agent execution isolation.
- `OpenHands/OpenHands` — separation of agent runtime, sandbox/workspace and automation surfaces.
- `TauricResearch/TradingAgents` — multi-role debate/risk decision graph, persistence and reflection concepts.
- `danny-avila/LibreChat` — provider/model registry and configurable multi-provider endpoints.

Before directly importing upstream code, re-check the exact license of the specific repository/version and preserve any required notices. This MVP avoids that issue by implementing only general architectural ideas.
