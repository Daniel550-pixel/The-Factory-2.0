# Claude + Obsidian — Factory Integration Architecture

> Integration analysis of `AgriciDaniel/claude-obsidian` for The Factory. This document extracts reusable architectural patterns; it does not make Claude, Obsidian, or the repository a Factory kernel dependency.

## 1. Role in The Factory

`claude-obsidian` is best treated as an **optional knowledge/reference adapter** around the Factory kernel.

It provides a mature local-first knowledge workflow built around:

- immutable/raw source capture
- structured Markdown knowledge pages
- source citations and provenance
- persistent operation logs
- hot context caching
- retrieval and linting
- explicit vault selection
- recoverable transactions
- multi-agent read-only ingestion
- human-reviewed mutation

The Factory should consume these capabilities through provider-neutral contracts rather than importing the Claude/Obsidian implementation into the kernel.

## 2. Architectural correspondence

| Claude-Obsidian concept | Factory contract | Integration role |
|---|---|---|
| `.raw/` immutable source layer | Evidence / Provenance | Source-of-record input adapter |
| `wiki/` knowledge base | Context / Memory | Knowledge persistence adapter |
| `wiki/log.md` and operation ledgers | Event Ledger | Knowledge-operation event source |
| `wiki/hot.md` | Context Assembly | Bounded recent-context cache |
| `wiki/index.md` | Context / Retrieval | Knowledge catalog/index |
| source pages with citations | Evidence / Provenance | Claim-to-source traceability |
| `wiki-lint` | Verification | Knowledge integrity checks |
| `wiki-query` | Retrieval | Context acquisition |
| `wiki-ingest` | Agent Runtime | Read-only analysis worker |
| transaction bundle | Execution Boundary | Reviewed mutation plan |
| vault lock / backup journal | Execution Safety | Mutation concurrency and recovery |
| explicit vault selection | Policy / Scope | Prevents ambiguous target selection |
| hot-cache session context | Context Assembly | Optional bounded session context |

## 3. Key pattern: read → propose → review → apply

The strongest pattern for Factory reuse is the separation between knowledge analysis and mutation.

```text
SOURCE
  ↓
CAPTURE / SCOPE
  ↓
READ-ONLY INGESTION
  ↓
EVIDENCE + PAGE DRAFTS
  ↓
PROPOSED TRANSACTION
  ↓
REVIEW / VERIFICATION
  ↓
ATOMIC APPLY
  ↓
LEDGER / PROVENANCE
  ↓
RETRIEVAL + MEMORY
```

This directly reinforces the Factory invariant:

**AI decides ≠ AI executes.**

An agent can produce drafts, claims, proposed paths and evidence, while the mutation boundary remains explicit and controlled.

## 4. Transaction model

A knowledge mutation should be represented as a durable, inspectable operation rather than a collection of unrelated file writes.

Recommended Factory abstraction:

```text
KnowledgeOperation
├── operation_id
├── actor
├── source_refs[]
├── target_refs[]
├── expected_hashes[]
├── proposed_changes[]
├── evidence_refs[]
├── verification_state
├── authorization_state
├── apply_state
├── rollback_state
└── canonical_event_refs[]
```

The implementation should support:

1. snapshot expected target hashes;
2. generate drafts without mutation;
3. merge drafts into one operation bundle;
4. inspect and verify the complete bundle;
5. reject conflicts when targets changed;
6. apply atomically where possible;
7. journal enough information for recovery;
8. emit canonical Factory events;
9. make the operation replay/audit visible.

## 5. Provenance model

Claude-Obsidian's source-cited wiki pattern is highly compatible with Factory evidence/provenance.

A Factory knowledge claim should be able to resolve:

```text
CLAIM
  ↓
EVIDENCE
  ↓
SOURCE
  ↓
SOURCE HASH / IDENTITY
  ↓
INGEST OPERATION
  ↓
KNOWLEDGE PAGE
  ↓
DERIVED MEMORY
```

This prevents a generated wiki page from becoming an unauditable authority. The page is a derived representation; the source and provenance chain remain authoritative.

## 6. Raw vs derived knowledge

The Compound Vault pattern provides a useful boundary:

```text
RAW / IMMUTABLE
    ↓
INGEST / ANALYSIS
    ↓
DERIVED KNOWLEDGE
    ↓
RETRIEVAL / CONTEXT
    ↓
AGENT REASONING
```

Factory should preserve this distinction even when the underlying storage is not Obsidian.

### Raw layer

Contains source material that should not be silently rewritten:

- documents
- transcripts
- screenshots
- datasets
- source captures
- external evidence

### Derived layer

Contains generated or curated representations:

- entities
- concepts
- summaries
- questions
- comparisons
- indexes
- context caches

Derived knowledge can be updated. Raw evidence must remain separately addressable.

## 7. Hot cache as a context adapter

`wiki/hot.md` is not a second system of record. It is a bounded context cache for recent knowledge.

Factory should model this as:

```text
KnowledgeStore
   ├── canonical knowledge
   ├── source/evidence index
   └── ContextCache
          └── bounded recent context
```

The cache must be disposable and regenerable from canonical state. It must never become the sole source of truth.

## 8. Multi-agent ingestion

Claude-Obsidian's ingestion agent is explicitly read-only: workers return evidence-grounded drafts and expected hashes while a parent orchestrator owns the shared transaction.

This is a strong Factory pattern:

```text
ORCHESTRATOR
     │
     ├── INGEST WORKER A → draft + evidence
     ├── INGEST WORKER B → draft + evidence
     └── INGEST WORKER C → draft + evidence
              ↓
       MERGE / VERIFY
              ↓
       SINGLE OPERATION
              ↓
          APPLY
```

Workers should not directly mutate shared knowledge state.

## 9. Deterministic safety controls

The integration should preserve deterministic controls around knowledge mutation:

- explicit vault/workspace selection
- path validation
- source identity checks
- expected content hashes
- conflict detection
- operation IDs
- transaction state
- rollback/recovery information
- atomic replacement where supported
- no silent overwrite of changed targets

These controls belong below model reasoning. An LLM may propose a change, but it should not override a failed integrity check.

## 10. Privacy and provider neutrality

The Factory should not assume that local-first storage means provider-free operation.

The knowledge adapter should expose explicit data-egress boundaries. External model providers or web tools may receive selected content according to their own policies; the Factory kernel must remain provider-neutral.

Recommended interface boundary:

```text
Factory Kernel
      ↓
KnowledgeAdapter
      ↓
Local Knowledge Store
      │
      ├── Obsidian adapter
      ├── Filesystem/Markdown adapter
      ├── PostgreSQL adapter
      └── Future knowledge adapters
```

Claude is one possible reasoning provider, not the knowledge contract itself.

## 11. Obsidian-specific capabilities

Obsidian is useful primarily as a human-facing knowledge workspace:

- Markdown ownership
- graph navigation
- backlinks
- visual knowledge exploration
- templates/properties
- local vault inspection

These should remain adapter/UI concerns. The Factory kernel should not depend on Obsidian's application runtime, plugin system, or vault layout.

## 12. Factory implementation proposal

Add provider-neutral knowledge interfaces in the kernel:

```text
KnowledgeSource
KnowledgeDocument
KnowledgeClaim
EvidenceRef
KnowledgeOperation
KnowledgeAdapter
KnowledgeQuery
ContextSnapshot
```

Minimum behaviors:

```text
capture(source)
read(document_ref)
query(query)
propose(operation)
verify(operation)
apply(operation)
rollback(operation)
replay(operation_id)
resolve_provenance(ref)
build_context(query, budget)
```

Only `apply` and `rollback` should cross the mutation boundary. `capture`, `read`, `query`, proposal generation and context assembly can remain read-oriented where appropriate.

## 13. Mapping to The-Factory-2.0

Initial integration targets:

- `server/kernel.ts` → policy, execution and event-boundary enforcement
- `server/store.ts` → knowledge persistence and event/state storage
- `src/types.ts` → provider-neutral knowledge/evidence contracts
- `src/views/MemoryView.tsx` → knowledge state and provenance UI
- `src/views/EvidenceProvenanceView.tsx` → claim/source/evidence inspection
- `src/views/ReplayRecoveryView.tsx` → knowledge-operation recovery visibility
- `src/views/ApprovalsView.tsx` → reviewed knowledge mutation authorization
- `src/views/OperationsView.tsx` → operation lifecycle and audit

A future adapter module can live under a dedicated integration boundary, for example:

```text
server/integrations/knowledge/
├── types.ts
├── adapter.ts
├── filesystem.ts
└── obsidian.ts
```

The exact module layout is implementation detail; the provider-neutral contract is the architectural requirement.

## 14. What we should NOT copy

Do not copy the entire `claude-obsidian` repository into The Factory.

Do not make these Factory kernel dependencies:

- Claude Code
- Obsidian
- `.obsidian/` configuration
- Claude-specific commands
- host-specific hooks
- marketplace/plugin metadata
- vault UI conventions
- provider-specific prompt logic

Do not treat generated wiki pages as canonical truth.

Do not bypass Factory policy because a knowledge operation is considered low-risk by an agent.

## 15. High-value extraction list

The following concepts are worth promoting into Factory contracts:

1. **Immutable source layer**
2. **Derived knowledge layer**
3. **Source-cited claims**
4. **Bounded hot context cache**
5. **Explicit vault/workspace selection**
6. **Expected-hash conflict detection**
7. **Single reviewed transaction bundle**
8. **Read-only parallel ingestion workers**
9. **Atomic mutation and rollback**
10. **Persistent operation identity**
11. **Deterministic knowledge lint/verification**
12. **Provider-neutral knowledge adapter boundary**

These patterns complement, rather than replace, the existing Factory primitives.

## 16. Architectural conclusion

Claude-Obsidian contributes a concrete, mature implementation of a problem the Factory architecture already needs: **how AI-generated knowledge can be accumulated without turning generated text into unchecked authority or allowing concurrent agents to corrupt shared state.**

Its most important contribution is therefore not "Obsidian memory". It is the **governed knowledge mutation model**:

```text
SOURCE
→ EVIDENCE
→ READ-ONLY REASONING
→ PROPOSAL
→ VERIFICATION
→ AUTHORIZATION
→ ATOMIC MUTATION
→ PROVENANCE / EVENT
→ REPLAYABLE KNOWLEDGE
```

This should become a first-class Factory knowledge integration pattern while keeping the core independent of Claude and Obsidian.

## Source

Primary source: `https://github.com/AgriciDaniel/claude-obsidian`

The architecture was derived from the project's public README, WIKI architecture, Compound Vault documentation, agent instructions, privacy model, and v2.x transaction/recovery direction. See also `docs/integrations/CLAUDE-OBSIDIAN-MAPPING.md` for implementation mapping and `docs/integrations/KNOWLEDGE-CONTRACT.md` for the provider-neutral contract.