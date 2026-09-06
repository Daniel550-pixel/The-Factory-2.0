import { describe, expect, it } from 'vitest';
import { ExecutionBroker } from '../server/execution-broker';
import { issueExecutionAuthorization, verifyExecutionAuthorization, type AuthenticatedPrincipal } from '../server/security';
import type { Proposal } from '../src/types';

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

describe('execution authorization boundary', () => {
  it('creates a signed, time-bounded authorization token', () => {
    const token = issueExecutionAuthorization(system, {
      executionId: 'exec-1',
      proposalId: proposal.id,
      capability: proposal.requestedAction,
      ttlMs: 10_000,
    }, 'test-secret');

    expect(token.nonce).toBeTruthy();
    expect(token.signature).toHaveLength(64);
    expect(verifyExecutionAuthorization(token, 'test-secret')).toBe(true);
    expect(verifyExecutionAuthorization(token, 'wrong-secret')).toBe(false);
  });

  it('prevents an authorization token from being replayed', async () => {
    const broker = new ExecutionBroker();
    let calls = 0;
    broker.register({
      capability: proposal.requestedAction,
      async execute() {
        calls += 1;
        return { ok: true };
      },
    });

    const token = issueExecutionAuthorization(system, {
      executionId: 'exec-1',
      proposalId: proposal.id,
      capability: proposal.requestedAction,
    }, 'test-secret');

    await broker.execute(token, proposal, 'test-secret');
    await expect(broker.execute(token, proposal, 'test-secret')).rejects.toThrow('EXECUTION_AUTHORIZATION_REPLAYED');
    expect(calls).toBe(1);
  });
});
