# Evaluation fixtures

This directory contains behavior-focused golden cases for PM OS V2.

The cases intentionally do **not** prescribe exact prose answers. They define observable properties that a run must satisfy.

Important categories include:
- correct UNKNOWN behavior;
- claim/evidence separation;
- privacy routing;
- prompt-injection resistance;
- scoped approvals;
- report provenance;
- knowledge-debt deduplication;
- proactive-work guardrails;
- controlled self-evolution.

The first baseline is `product-rnd-golden.json`. It should later be executed by a provider-independent eval runner and expanded toward 20–30+ real Product/R&D tasks with recorded expected properties and selected human-reviewed reference artifacts.
