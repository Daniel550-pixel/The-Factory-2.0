import { describe, expect, it } from 'vitest';
import { calculateEventHash, PolicyGateEngine } from '../server/kernel';
import type { Evidence, PolicyRule, Proposal } from '../src/types';

describe('Factory kernel', () => {
  it('produces deterministic event hashes for identical canonical input', () => {
    const event = {
      id: 'evt-1',
      name: 'proposal.created',
      type: 'PROPOSAL_GENERATED' as const,
      timestamp: '2026-01-01T00:00:00.000Z',
      actor: { id: 'operator-1', name: 'Operator', role: 'OPERATOR' as const },
      agentId: 'agent-1',
      executionId: 'exec-1',
      traceId: 'trace-1',
      causation: 'request-1',
      correlation: 'corr-1',
      provenance: { source: 'test', confidence: 100, chain: ['test'] },
      payload: { value: 42 },
    };

    const first = calculateEventHash('GENESIS', event);
    const second = calculateEventHash('GENESIS', event);

    expect(first).toHaveLength(64);
    expect(first).toBe(second);
  });

  it('changes the hash when the previous event hash changes', () => {
    const event = {
      id: 'evt-1',
      name: 'proposal.created',
      type: 'PROPOSAL_GENERATED' as const,
      timestamp: '2026-01-01T00:00:00.000Z',
      actor: { id: 'operator-1', name: 'Operator', role: 'OPERATOR' as const },
      executionId: 'exec-1',
      traceId: 'trace-1',
      causation: 'request-1',
      correlation: 'corr-1',
      provenance: { source: 'test', confidence: 100, chain: ['test'] },
      payload: {},
    };

    expect(calculateEventHash('GENESIS', event)).not.toBe(calculateEventHash('other', event));
  });

  it('escalates consequential financial operations deterministically', () => {
    const proposal: Proposal = {
      id: 'proposal-1',
      type: 'FINANCIAL_ALLOCATION',
      summary: 'Allocate funds',
      targetResource: 'treasury',
      requestedAction: 'allocate',
      parameters: { amount: 100001 },
      expectedImpact: 'capital movement',
      riskScore: 10,
      confidence: 95,
      proposingAgentId: 'agent-1',
    };

    const decision = PolicyGateEngine.evaluate(proposal, [], [], 'OPERATOR');

    expect(decision.outcome).toBe('ESCALATE');
    expect(decision.evaluator).toBe('DETERMINISTIC_GATE_KERNEL');
  });

  it('denies a proposal when a deterministic policy is exceeded', () => {
    const proposal: Proposal = {
      id: 'proposal-2',
      type: 'TOOL_INVOCATION',
      summary: 'Invoke restricted tool',
      targetResource: 'restricted-tool',
      requestedAction: 'invoke',
      parameters: {},
      expectedImpact: 'external side effect',
      riskScore: 90,
      confidence: 90,
      proposingAgentId: 'agent-1',
    };

    const rules: PolicyRule[] = [{
      id: 'policy-1',
      name: 'Restricted tool threshold',
      description: 'High-risk invocations are denied.',
      capabilityTarget: 'TOOL_INVOCATION',
      maxRiskScore: 50,
      minConfidence: 70,
      requiresHumanEscalation: false,
      isDeterministic: true,
      action: 'ALLOW',
    }];

    const evidence: Evidence[] = [];
    const decision = PolicyGateEngine.evaluate(proposal, evidence, rules, 'OPERATOR');

    expect(decision.outcome).toBe('DENY');
  });
});
