# The Factory — Canonical Source Architecture

> Ported from `Daniel550-pixel/The-Factory` into `The-Factory-2.0` as the architectural source of truth for this implementation.

## 1. Mission

The Factory is an AI-native systems platform for building, orchestrating, verifying, and deploying intelligent applications through shared runtime primitives.

Historical repositories are evidence and lineage. `The-Factory-2.0` is the TypeScript/web implementation target. The architecture must be implemented as reusable contracts rather than copied as unrelated product code.

## 2. Kernel

The current working kernel contains four reusable primitives plus cross-cutting contracts.

### Event Ledger

Canonical, ordered, integrity-verifiable state transitions. It is the durable source of truth and the anchor for replay and audit. An event bus or transport is not equivalent to the ledger.

### Policy Gate

Controls the transition from AI-generated proposals to authorized execution. It evaluates evidence, verification, confidence/risk, policy and authorization.

**Invariant: AI decides ≠ AI executes.**

### Agent Runtime

Agent registration, invocation, lifecycle management, specialist assessment, arbitration and controlled access to capabilities.

### Context / Memory

Provenance-linked context, episodic experience, distilled knowledge, retrieval and context assembly.

### Cross-cutting contracts

- Execution context: stable execution, trace and parent identifiers plus actor/agent/capability metadata.
- Event contract: explicit event names, typed payloads, timestamps, causation/correlation context and provenance hooks.
- Provenance/evidence: claims must retain their evidence, origin, verification state and confidence.
- Replay/recovery: state-changing behavior must be reconstructable and verifiable.
- Human approval/interruption: consequential actions can be escalated before execution.

## 3. Universal control flow

```text
OBSERVATION / CLAIM / REQUEST
              ↓
        CONTEXT ASSEMBLY
              ↓
       AGENT REASONING
              ↓
        PROPOSAL / PLAN
              ↓
     EVIDENCE + PROVENANCE
              ↓
         VERIFICATION
              ↓
        CONFIDENCE / RISK
              ↓
        POLICY DECISION
              ↓
     ALLOW / DENY / ESCALATE
              ↓
          EXECUTION
              ↓
       CANONICAL EVENT
              ↓
        REPLAY / AUDIT
              ↓
      MEMORY / LEARNING
```

Not every product requires every stage. The kernel guarantees the boundaries and contracts; products compose the stages they need.

## 4. Design principles

1. **AI decides ≠ AI executes.** AI may analyze, reason, assess and propose; authorization and execution remain explicit boundaries.
2. **Evidence before authority.** Claims and proposals must be traceable to evidence, provenance, verification, confidence and policy.
3. **Everything important is replayable.** State-changing operations produce canonical events that can be reconstructed and audited.
4. **Deterministic controls remain deterministic.** LLM output must not silently replace deterministic security, integrity, policy or authorization mechanisms.
5. **Products consume the kernel.** Domain applications use Factory primitives instead of rebuilding their own runtime, policy, memory and audit systems.
6. **Provider neutrality.** No particular LLM vendor or model is a kernel dependency.

## 5. Layering

```text
PRODUCT / DOMAIN
       ↓
WORKFLOWS / REASONING / SIMULATION
       ↓
FACTORY KERNEL CONTRACTS
       ↓
STORAGE / PROCESS / NETWORK ADAPTERS
       ↓
OPERATING ENVIRONMENT
```

The kernel must not absorb product schemas merely because a product needs them.

## 6. Supporting capabilities

These are runtime capabilities or libraries rather than mandatory kernel primitives:

- intent parsing
- reasoning strategies
- planning
- world-state schemas
- forecasting
- simulation
- evaluation
- resource planning
- external tool adapters
- observability exporters
- user interfaces

## 7. Source lineage

The architecture was extracted and validated from the following project families:

| Source | Reusable evidence |
|---|---|
| BitMiner AI | Event ledger, deterministic replay, arbitration, risk, memory, execution gating |
| SecureOS | Deterministic trust, evidence, policy, integrity and security enforcement |
| ArchOS | Agent runtime, evidence chains, action gating, world state, simulation and orchestration |
| AI Venture Radar | Evidence/claim model, provenance, confidence, adversarial validation and graph relationships |
| FinSight Global AI | Forecasting, simulation and product/deployment lineage |
| FinSight Global AI 2 | Experimental backend/product lineage |
| FinSight Global AI Dashboard | Simulation, paper execution and operational UI lineage |
| NetworkLab | Guarded execution, explicit scope, reproducibility and evidence collection |

### Lineage rule

```text
historical project
      ↓
verified implementation / reconstructed specification
      ↓
Factory extraction
      ↓
generic contract
      ↓
product/domain implementation
```

Historical names such as J.A.R.V.I.S., ULTRON and IRIS are lineage/codenames, not mandatory Factory component names.

## 8. Architectural findings

The strongest independent convergence is:

1. Event Ledger — independently supported by BitMiner AI and SecureOS.
2. Policy/Execution Gate — independently supported by BitMiner AI, SecureOS and ArchOS.
3. Agent Runtime/Arbitration — supported by BitMiner AI and ArchOS.
4. Context/Memory — supported by BitMiner AI and ArchOS.
5. Provenance/Evidence — supported by SecureOS, ArchOS and AI Venture Radar.
6. Replay/Recovery — concretely implemented in BitMiner AI and reinforced by ArchOS.

Replay and provenance are currently treated as cross-cutting kernel capabilities rather than separate top-level layers.

## 9. Reference architecture validation

The architecture has been cross-checked conceptually against mature systems including Temporal, LangGraph, Kubernetes and OpenTelemetry. These are architectural references, not Factory dependencies.

- Durable workflow systems reinforce persisted history and recovery.
- Agent workflow systems reinforce explicit state, checkpointing and human approval.
- Reconciliation systems reinforce observe → determine desired transition → controlled mutation → observe again.
- Telemetry standards reinforce universal correlation and structured runtime observability without replacing the system of record.

## 10. Non-goals

- Do not blindly merge complete historical repositories.
- Do not make domain-specific telemetry part of the kernel.
- Do not introduce Kafka, Kubernetes or microservices merely for architectural appearance.
- Do not allow an LLM to become authoritative for deterministic security or integrity decisions.
- Do not make a world model a mandatory kernel primitive.
- Do not make a specific model provider a kernel dependency.

## 11. Target implementation model

The original Factory reference implementation targets a self-hosted, modular runtime with durable storage and explicit process boundaries. `The-Factory-2.0` currently expresses the same contracts through a TypeScript server/kernel and a web experience layer.

The TypeScript implementation is therefore an implementation of the Factory contracts, not a replacement for them. Where the UI contains a concept that belongs to the kernel, the concept should be mapped to the corresponding contract instead of becoming a UI-specific abstraction.

## 12. Current implementation mapping in The-Factory-2.0

| Factory contract | Current 2.0 implementation |
|---|---|
| Event Ledger | `server/kernel.ts`, `server/store.ts`, `src/views/EventLedgerView.tsx` |
| Policy Gate | `server/kernel.ts`, `src/views/PolicyGateView.tsx` |
| Agent Runtime | `server/kernel.ts`, `src/views/AgentsView.tsx` |
| Context / Memory | `server/store.ts`, `src/views/MemoryView.tsx` |
| Execution | `server/kernel.ts`, `src/views/ExecutionsView.tsx` |
| Arbitration | `src/views/ArbitrationView.tsx` |
| Evidence / Provenance | `src/views/EvidenceProvenanceView.tsx` |
| Replay / Recovery | `src/views/ReplayRecoveryView.tsx` |
| Human approval | `src/views/ApprovalsView.tsx` |
| Simulation | `src/views/SimulationView.tsx` |
| Security | `src/views/SecurityView.tsx` |
| Operations | `src/views/OperationsView.tsx` |
| Product layer | `src/views/ProductsView.tsx` |

This mapping is an implementation map and must continue to be validated by tests and code review.
