# Repo 1 → Repo 2 Migration Model

## Purpose

`Daniel550-pixel/The-Factory` remains the historical architecture/audit source. `Daniel550-pixel/The-Factory-2.0` is the active TypeScript implementation and web application.

We do **not** need to manually re-explain Repo 1 every time. Its validated architecture is now captured in `docs/FACTORY-SOURCE-ARCHITECTURE.md` and mapped to the current 2.0 implementation.

## Rule

```text
REPO 1
architecture + audits + provenance + validated contracts
                    ↓
            architecture extraction
                    ↓
REPO 2
TypeScript kernel + server + UI + tests
```

## What comes from Repo 1

- canonical Factory mission and design principles;
- four kernel primitives;
- event, execution-context, provenance and replay contracts;
- universal governed execution flow;
- source-project lineage and extraction findings;
- separation between generic kernel and product/domain code;
- provider-neutral architecture;
- migration and reconstruction rules;
- roadmap and architecture-lock requirements.

## What stays native to Repo 2

- React/TypeScript UI;
- server implementation;
- Gemini integration;
- web-specific state and presentation;
- browser interactions;
- visual command center;
- product-facing views;
- TypeScript-specific persistence and transport choices.

## What must not happen

- Do not copy an entire historical product into Repo 2 just because it exists in the source lineage.
- Do not make the UI the source of truth for security, policy or integrity.
- Do not let model output bypass deterministic policy evaluation.
- Do not turn vendor-specific Gemini/Claude/OpenAI behavior into kernel contracts.
- Do not duplicate Event Ledger, Policy Gate, Agent Runtime or Memory semantics across individual views.

## Current status

Repo 2 already contains a substantial implementation of the canonical contracts. The next work should therefore be **implementation hardening and contract alignment**, not starting the architecture from zero.

Priority order:

1. Validate TypeScript types against the canonical contracts.
2. Make the Event Ledger durable and verifiable.
3. Make Policy Gate deterministic and independently testable.
4. Separate proposal, authorization and execution paths.
5. Make Agent Runtime and arbitration explicit interfaces.
6. Make evidence/provenance first-class across proposals and events.
7. Make replay/recovery testable from canonical events.
8. Make memory provenance-linked rather than UI-only state.
9. Add contract tests for the universal control flow.
10. Only then expand product-specific functionality.
