import { describe, expect, it } from 'vitest';
import { PolicyGateEngine } from '../server/kernel';
import type { Evidence, PolicyRule, Proposal } from '../src/types';

describe('PolicyGateEngine', () => {
  it('denies unknown actor roles', () => {
    const proposal: Proposal = {
      id: 'proposal-unknown-role', type: 'STATE_MUTATION', summary: 'test', targetResource: 'test', requestedAction: 'mutate', parameters: {}, expectedImpact: 'test', riskScore: 1, confidence: 100, proposingAgentId: 'agent-1',
    };
    const decision = PolicyGateEngine.evaluate(proposal, [], [], 'UNKNOWN');
    expect(decision.outcome).toBe('DENY');
  });

  it('escalates an operator above its risk ceiling', () => {
    const proposal: Proposal = {
      id: 'proposal-operator-ceiling', type: 'TOOL_INVOCATION', summary: 'Invoke high-risk tool', targetResource: 'approved-tool', requestedAction: 'invoke', parameters: {}, expectedImpact: 'controlled external side effect', riskScore: 60, confidence: 95, proposingAgentId: 'agent-1',
    };
    const rules: PolicyRule[] = [{
      id: 'policy-2', name: 'Permissive test rule', description: 'Allows the proposal so actor authority must still be enforced.', capabilityTarget: 'TOOL_INVOCATION', maxRiskScore: 100, minConfidence: 80,
      requiresHumanEscalation: false, isDeterministic: true, action: 'ALLOW',
    }];
    const decision = PolicyGateEngine.evaluate(proposal, [], rules, 'OPERATOR');
    expect(decision.outcome).toBe('ESCALATE');
    expect(decision.reason).toContain('OPERATOR');
  });

  it('allows a low-risk operator proposal when policy permits it', () => {
    const proposal: Proposal = {
      id: 'proposal-operator-allow', type: 'STATE_MUTATION', summary: 'Low-risk mutation', targetResource: 'state', requestedAction: 'mutate', parameters: {}, expectedImpact: 'small', riskScore: 10, confidence: 95, proposingAgentId: 'agent-1',
    };
    const rules: PolicyRule[] = [{
      id: 'policy-allow', name: 'Allow', description: 'Allow low risk', capabilityTarget: 'STATE_MUTATION', maxRiskScore: 40, minConfidence: 80,
      requiresHumanEscalation: false, isDeterministic: true, action: 'ALLOW',
    }];
    const evidence: Evidence[] = [{ id: 'e1', type: 'DETERMINISTIC_CALCULATION', source: 'test', claim: 'safe', confidence: 95, verified: true, timestamp: new Date().toISOString(), rawPayload: {}, provenanceTrail: ['test'] }];
    const decision = PolicyGateEngine.evaluate(proposal, evidence, rules, 'OPERATOR');
    expect(decision.outcome).toBe('ALLOW');
  });
});
