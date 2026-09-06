# Security Policy

## Scope

The Factory 2.0 is an AI-native execution control plane. Security-sensitive areas include authentication, authorization, policy enforcement, evidence verification, execution boundaries, event integrity, persistence, and agent/tool capabilities.

## Current security status

The repository is under active hardening. The current application is suitable for development, architecture work, simulation, and controlled demonstrations. It must not be treated as a production security boundary until authentication, durable integrity, independent verification, and execution isolation are implemented and tested.

AI-generated claims are not considered authoritative security evidence.

## Reporting a vulnerability

Do not disclose exploitable vulnerabilities in a public issue.

For a private report, use the repository owner's configured GitHub security reporting channel. Include:

- affected component or endpoint
- reproduction steps
- security impact
- relevant logs or traces with secrets and personal data removed
- suggested mitigation, if known

## Security requirements

Changes affecting execution or trust must preserve:

1. authenticated identity
2. deterministic authorization
3. explicit policy decisions
4. independent evidence verification
5. constrained execution capabilities
6. append-only auditability
7. replayability and recovery
8. secret isolation
9. idempotency and concurrency safety
10. fail-closed behavior for ambiguous authorization states

## Secrets

Never commit API keys, access tokens, private keys, certificates, `.env` files, or production credentials. Use `.env.example` only as a configuration template.
