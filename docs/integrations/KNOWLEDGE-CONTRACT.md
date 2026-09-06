# Factory Knowledge Contract

The Factory knowledge layer is provider-neutral. Claude-Obsidian is one reference implementation of the patterns; it is not the contract.

## 1. Core objects

### KnowledgeSource

Identifies an external or captured source.

Required conceptual fields:

```text
source_id
source_type
uri_or_path
content_hash
captured_at
provenance
```

### KnowledgeDocument

A durable representation of a source or derived knowledge artifact.

```text
document_id
source_id
content_hash
document_type
path_or_locator
created_at
updated_at
provenance
```

### EvidenceRef

A stable reference to the evidence supporting a claim or proposal.

```text
evidence_id
source_id
document_id
locator
content_hash
verification_state
```

### KnowledgeClaim

A derived assertion that must remain linked to evidence.

```text
claim_id
statement
evidence_refs[]
confidence
verification_state
created_by
created_at
```

### KnowledgeOperation

The unit of state-changing knowledge work.

```text
operation_id
actor
intent
source_refs[]
target_refs[]
expected_hashes[]
proposed_changes[]
evidence_refs[]
verification_state
authorization_state
apply_state
rollback_state
canonical_event_refs[]
```

### ContextSnapshot

A bounded, disposable representation of relevant knowledge for reasoning.

```text
snapshot_id
query
source_refs[]
claim_refs[]
content
budget
created_at
```

## 2. Adapter contract

Every knowledge backend should conceptually support:

```text
capture(source) -> KnowledgeSource
read(document_ref) -> KnowledgeDocument
query(query) -> KnowledgeDocument[] / KnowledgeClaim[]
propose(operation) -> KnowledgeOperation
verify(operation) -> VerificationResult
apply(operation) -> ApplyResult
rollback(operation) -> RecoveryResult
replay(operation_id) -> ReplayResult
resolve_provenance(ref) -> ProvenanceGraph
build_context(query, budget) -> ContextSnapshot
```

An adapter may support only a subset for read-only operation, but mutation-capable adapters must implement explicit verification, apply and recovery semantics.

## 3. Mutation boundary

The critical boundary is:

```text
READ / QUERY / REASON
        ↓
     PROPOSE
        ↓
     VERIFY
        ↓
  AUTHORIZE
        ↓
      APPLY
        ↓
    EVENT LOG
```

No provider-specific agent command may bypass this boundary.

## 4. Provenance requirements

A derived claim should be traceable to its evidence. At minimum:

```text
claim → evidence → source → content identity
```

If a source changes, dependent derived knowledge should be detectable as potentially stale. The system should not silently retain a claim as fresh solely because the Markdown page still exists.

## 5. Conflict requirements

If an expected target hash differs from the current target hash:

```text
expected_hash != actual_hash
            ↓
         CONFLICT
            ↓
       no overwrite
```

The conflict becomes an explicit operation result and may be escalated to human review.

## 6. Recovery requirements

Mutation-capable knowledge adapters should provide enough state to:

- identify the operation;
- identify changed targets;
- restore the previous state where supported;
- detect incomplete operations;
- replay or reconcile the operation;
- emit recovery events.

## 7. Provider neutrality

The contract intentionally does not include:

- Claude API objects;
- Gemini API objects;
- OpenAI API objects;
- Obsidian plugin APIs;
- vector-database-specific objects.

Those belong behind adapters.

## 8. Relationship to the Factory kernel

The knowledge contract is a supporting kernel contract, not a fifth primitive.

```text
Event Ledger       ← records knowledge operations
Policy Gate        ← authorizes consequential mutations
Agent Runtime      ← runs ingestion/reasoning workers
Context / Memory   ← stores and retrieves knowledge
Provenance         ← links claims to evidence
Replay / Recovery  ← reconstructs operations
```

This preserves the four-primitive Factory kernel while giving the memory/context subsystem a rigorous implementation boundary.
