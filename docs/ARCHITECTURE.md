# The Factory 2.0 Architecture

## Kernel boundary

The reusable Factory runtime is organized around explicit contracts rather than product-specific behavior.

```text
AUTHENTICATED REQUEST
        ↓
EXECUTION CONTEXT
        ↓
AGENT RUNTIME
        ↓
PROPOSAL
        ↓
EVIDENCE + VERIFICATION
        ↓
POLICY GATE
   ┌────┼─────┐
 DENY ESCALATE ALLOW
      ↓      ↓
 HUMAN AUTH  EXECUTION AUTH
          \   /
       EXECUTION BROKER
             ↓
      CAPABILITY ADAPTER
             ↓
       EXTERNAL SYSTEM
             ↓
 APPEND-ONLY EVENT LEDGER
             ↓
          MEMORY
```

## Core contracts

### ExecutionContext

Every state-changing operation should carry:

- `execution_id`
- `trace_id`
- `parent_id`
- authenticated actor identity
- agent identity, where applicable
- requested capability
- policy context
- causation / correlation metadata

### Agent Runtime

Agents reason and produce proposals. Agent output does not directly grant execution authority.

Responsibilities:

- registry
- lifecycle
- invocation
- arbitration
- proposal generation

### Evidence / Verification

Evidence objects represent observations or external facts. Verification is independent from the model that generated a proposal.

AI-generated fields such as `verified`, `confidence`, and `risk` are advisory inputs until independently established.

### Policy Gate

Policy is deterministic and authoritative for the decision boundary:

- `ALLOW`
- `DENY`
- `ESCALATE`

Rules must have one authoritative source and deterministic evaluation semantics.

### Execution Broker

The execution broker is the security boundary between reasoning and side effects. It accepts only authorized execution requests and invokes explicitly registered capabilities.

The broker must enforce:

- authorization token / decision binding
- capability scope
- target constraints
- parameter validation
- idempotency
- concurrency controls
- timeout / retry policy
- auditable result handling

### Event Ledger

The ledger records canonical state transitions. Production implementation must be durable and append-only.

A detected integrity failure must not rewrite historical events. The correct response is to preserve the original evidence, quarantine the affected stream, record an incident, and recover from a trusted state.

### Context / Memory

Memory stores should distinguish raw evidence, episodic execution history, and derived knowledge. Every derived item must retain provenance to its source evidence or events.

## Product boundary

Product/domain modules consume Factory contracts. Domain-specific world models, financial logic, security telemetry, market logic, spatial intelligence, and other specialized systems do not become kernel primitives unless their abstraction is demonstrably reusable.

## Reference lineage

The architecture was reconstructed from historical Factory, BitMiner AI, SecureOS, ArchOS, AI Venture Radar, FinSight, and NetworkLab work. Those repositories remain separate source references and are not merged into this repository.
