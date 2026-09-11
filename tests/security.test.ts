import { describe, expect, it } from 'vitest';
import { ExecutionBroker } from '../server/execution-broker';
import { issueExecutionAuthorization, verifyExecutionAuthorization, type AuthenticatedPrincipal } from '../server/security';
import type { PolicyDecision, Proposal } from '../src/types';

const system: AuthenticatedPrincipal = {
  subject: 'factory-system',
  roles: ['SYSTEM'],
  authenticatedAt: new Date().toISOString(),
  authMethod: 'SERVICE_IDENTITY',
};

const proposal: Proposal = {
  id: 'proposal-1',
  type: 'TOOL_INVOCATION',
  summary: 'Invoke test capability',
  targetResource: 'test',
  requestedAction: 'test:execute',
  parameters: {},
  expectedImpact: 'test side effect',
  riskScore: 1,
  confidence: 100,
  proposingAgentId: 'agent-1',
};

const allowDecision: PolicyDecision = {
  decisionId: 'decision-1',
  outcome: 'ALLOW',
  reason: 'test allow',
  appliedPolicies: [],
  riskScore: 1,
  confidence: 100,
  evaluatedAt: new Date().toISOString(),
  evaluator: 'DETERMINISTIC_GATE_KERNEL',
};

describe('execution authorization boundary', () => {
  it('creates a signed, time-bounded authorization token bound to policy', () => {
    const token = issueExecutionAuthorization(system, {
      executionId: 'exec-1',
      proposalId: proposal.id,
      policyDecisionId: allowDecision.decisionId,
      capability: proposal.requestedAction,
      ttlMs: 10_000,
    }, 'test-secret');

    expect(token.nonce).toBeTruthy();
    expect(token.signature).toHaveLength(64);
    expect(verifyExecutionAuthorization(token, 'test-secret')).toBe(true);
    expect(verifyExecutionAuthorization(token, 'wrong-secret')).toBe(false);
  });

  it('prevents execution when the policy decision is not ALLOW', async () => {
    const broker = new ExecutionBroker();
    broker.register({ capability: proposal.requestedAction, async execute() { return { ok: true }; } });
    const token = issueExecutionAuthorization(system, {
      executionId: 'exec-denied-policy',
      proposalId: proposal.id,
      policyDecisionId: allowDecision.decisionId,
      capability: proposal.requestedAction,
    }, 'test-secret');
    const deniedDecision = { ...allowDecision, outcome: 'DENY' as const };

    await expect(broker.execute(token, proposal, deniedDecision, 'test-secret'))
      .rejects.toThrow('EXECUTION_POLICY_NOT_ALLOW:DENY');
  });

  it('prevents authorization from being used with a different policy decision', async () => {
    const broker = new ExecutionBroker();
    broker.register({ capability: proposal.requestedAction, async execute() { return { ok: true }; } });
    const token = issueExecutionAuthorization(system, {
      executionId: 'exec-policy-mismatch',
      proposalId: proposal.id,
      policyDecisionId: allowDecision.decisionId,
      capability: proposal.requestedAction,
    }, 'test-secret');
    const differentDecision = { ...allowDecision, decisionId: 'decision-other' };

    await expect(broker.execute(token, proposal, differentDecision, 'test-secret'))
      .rejects.toThrow('EXECUTION_POLICY_DECISION_MISMATCH');
  });

  it('prevents an authorization token from being replayed across broker instances', async () => {
    const brokerA = new ExecutionBroker();
    const brokerB = new ExecutionBroker();
    let calls = 0;
    const adapter = {
      capability: proposal.requestedAction,
      async execute() {
        calls += 1;
        return { ok: true };
      },
    };
    brokerA.register(adapter);
    brokerB.register(adapter);

    const token = issueExecutionAuthorization(system, {
      executionId: 'exec-durable-replay',
      proposalId: proposal.id,
      policyDecisionId: allowDecision.decisionId,
      capability: proposal.requestedAction,
    }, 'test-secret');

    await brokerA.execute(token, proposal, allowDecision, 'test-secret');
    await expect(brokerB.execute(token, proposal, allowDecision, 'test-secret'))
      .rejects.toThrow('EXECUTION_AUTHORIZATION_REPLAYED');
    expect(calls).toBe(1);
  });

  it('consumes authorization when adapter execution fails', async () => {
    const broker = new ExecutionBroker();
    broker.register({
      capability: proposal.requestedAction,
      async execute() { throw new Error('ADAPTER_FAILED'); },
    });

    const token = issueExecutionAuthorization(system, {
      executionId: 'exec-failed',
      proposalId: proposal.id,
      policyDecisionId: allowDecision.decisionId,
      capability: proposal.requestedAction,
    }, 'test-secret');

    await expect(broker.execute(token, proposal, allowDecision, 'test-secret')).rejects.toThrow('ADAPTER_FAILED');
    await expect(broker.execute(token, proposal, allowDecision, 'test-secret')).rejects.toThrow('EXECUTION_AUTHORIZATION_REPLAYED');
  });
});
