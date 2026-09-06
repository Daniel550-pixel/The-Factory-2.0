# The Factory 2.0

**The Factory 2.0 is an AI-native control plane for governed agent execution, evidence, policy, authorization, event integrity, replay, and contextual memory.**

The system is designed around one security boundary:

> **AI DECIDES ≠ AI EXECUTES**

AI agents may reason, analyze, plan, and propose. Deterministic system components verify evidence, evaluate policy, authorize actions, and control execution.

## Runtime flow

```text
REQUEST
  ↓
CONTEXT
  ↓
AGENT REASONING
  ↓
PROPOSAL
  ↓
EVIDENCE / VERIFICATION
  ↓
POLICY GATE
  ├── DENY
  ├── ESCALATE → HUMAN AUTHORIZATION
  └── ALLOW
          ↓
EXECUTION BROKER
  ↓
CAPABILITY ADAPTER
  ↓
EXTERNAL SYSTEM
  ↓
SIGNED DURABLE EVENT LEDGER
  ↓
MEMORY
```

## Current interface

The React control plane exposes operational views for:

- Command Center
- Agents
- Approvals
- Arbitration
- Executions
- Event Ledger
- Evidence / Provenance
- Memory
- Operations
- Policy Gate
- Products
- Replay / Recovery
- Security
- Simulation
- Settings

The interface is intentionally an operational control surface rather than a marketing dashboard. Visual state communicates execution state, policy state, evidence state, and system health.

## Repository layout

```text
The-Factory-2.0/
├── docs/                 # architecture and knowledge integration
├── public/               # static assets
├── server/               # server modules and kernel-facing services
├── server.ts             # HTTP/API application
├── server-entry.ts       # production server entrypoint
├── src/                  # React control-plane UI
│   ├── components/
│   ├── views/
│   └── types.ts
├── .env.example          # environment template; never contains secrets
├── .gitignore
├── Dockerfile
├── LICENSE
├── SECURITY.md
├── CONTRIBUTING.md
├── CODEOWNERS
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Architecture status

The UI/control-plane foundation is substantially implemented. The next engineering work is to replace demo-oriented runtime behavior with production-grade kernel boundaries: authenticated identity, deterministic authorization, independent evidence verification, a real execution broker, durable append-only state, tamper response, idempotency, concurrency control, and automated verification.

Until those controls are implemented and verified, this repository should be treated as a development / controlled-demo system, not as a production security boundary.

## Knowledge integration

The repository contains explicit knowledge-adapter documentation for external project knowledge, including Obsidian and Claude-derived project context. Historical repositories remain source references; their code is not wholesale merged into this repository.

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run check
npm start
```

The application reads secrets from environment variables. Copy `.env.example` to `.env` for local development and never commit the resulting `.env` file.

## Security model

The Factory treats the following as separate concerns:

1. **Authentication** — establish who is making a request.
2. **Authorization** — determine whether that identity may use a capability.
3. **Evidence verification** — independently establish whether evidence supports a claim.
4. **Policy evaluation** — deterministically decide whether a proposal is permitted.
5. **Execution authorization** — issue a constrained authorization for an approved action.
6. **Execution** — perform the action through a capability adapter.
7. **Audit** — record canonical state transitions in durable append-only storage.

AI-generated confidence, risk, provenance, or verification claims are not authoritative by themselves.

## License

Apache License 2.0. See `LICENSE`.
