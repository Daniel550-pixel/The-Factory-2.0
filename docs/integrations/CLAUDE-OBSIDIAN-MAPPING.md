# Claude-Obsidian → Factory Capability Mapping

This document records the reusable capabilities extracted from `AgriciDaniel/claude-obsidian` and where they should land in The Factory.

## Capability matrix

| Claude-Obsidian capability | Factory destination | Priority |
|---|---|---|
| Immutable `.raw/` source layer | `KnowledgeSource` + `EvidenceRef` | P0 |
| Source-cited wiki pages | `KnowledgeClaim` + provenance graph | P0 |
| Append-only operation log | Event Ledger integration | P0 |
| Expected SHA-256 target hashes | mutation integrity contract | P0 |
| Reviewed transaction bundle | execution boundary | P0 |
| Atomic apply / rollback | execution adapter | P0 |
| Explicit vault selection | scope/policy contract | P0 |
| Read-only ingestion workers | Agent Runtime worker contract | P0 |
| Knowledge lint | verification/evaluation | P1 |
| `wiki/hot.md` | ContextCache | P1 |
| BM25/hybrid retrieval | retrieval adapter | P1 |
| methodology modes | domain/configuration layer | P2 |
| Obsidian graph/UI | external human interface | P2 |
| Claude Code plugin | model/host adapter | P2 |

## Recommended implementation sequence

### P0 — contracts and integrity

Implement provider-neutral types for:

- knowledge source
- document identity
- evidence reference
- claim
- knowledge operation
- operation state
- expected target hash
- provenance link
- context snapshot

Then enforce the operation lifecycle through the existing Factory policy and event boundaries.

### P1 — retrieval and verification

Add:

- bounded context snapshots
- knowledge query abstraction
- source-aware retrieval
- deterministic lint/verification reports
- replay of knowledge operations

### P2 — adapters

Add adapters for:

- filesystem Markdown
- Obsidian vaults
- future database/vector stores
- model providers

The adapters must implement the same contracts.

## Security invariants

1. A generated knowledge page is never automatically authoritative.
2. Raw source evidence remains independently addressable.
3. A changed target hash produces a conflict rather than a silent overwrite.
4. Read-only workers never apply shared mutations.
5. The parent orchestrator owns the final transaction.
6. Policy and authorization remain deterministic boundaries.
7. Every applied operation receives a durable operation ID.
8. State-changing knowledge operations emit canonical events.
9. Recovery must be possible from recorded operation state.
10. Provider selection does not alter kernel authorization semantics.
