# Contributing to The Factory 2.0

## Development rules

- Keep domain/product logic separate from reusable Factory kernel contracts.
- Do not allow an LLM response to become authoritative authorization, evidence, integrity, or security state.
- Preserve the boundary between proposal and execution.
- Prefer deterministic controls for policy, authorization, integrity, and state transitions.
- State-changing operations must remain traceable through execution and correlation identifiers.
- Do not introduce infrastructure solely for appearance; add it when the runtime contract requires it.
- Never commit secrets or local environment files.

## Changes

Before opening a change:

```bash
npm run lint
npm run build
```

If the change affects runtime behavior, add or update automated tests and document the affected contract.

## Commit discipline

Use concise imperative commit messages that describe the actual change, for example:

```text
Add execution authorization boundary
Harden event ledger integrity checks
Refine command center execution state
```

## Security-sensitive changes

Changes to authentication, authorization, policy, evidence, execution adapters, ledger integrity, persistence, or recovery require explicit tests for both the permitted and denied paths.
