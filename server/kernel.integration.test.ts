import { describe, expect, it } from 'vitest';
import { DurableEventLedger } from './durable-ledger';
import { ExecutionBroker } from './execution-broker';
import { PolicyGateEngine } from './kernel';
import { issueExecutionAuthorization, type AuthenticatedPrincipal } from './security';
import type { Evidence, PolicyRule, Proposal, CanonicalEvent } from '../src/types';

const secret = 'kernel-integration-test-secret';
const systemPrincipal: AuthenticatedPrincipal = {
  subject: 'factory-system-integration-test',
  roles: ['SYSTEM'],
  authenticatedAt: new Date().toISOString(),
  authMethod: 'SERVICE_IDENTITY',
};

const operatorPrincipal: AuthenticatedPrincipal = {
  subject: 'factory-operator-integration-test',
  roles: ['OPERATOR'],
  authenticatedAt: new Date().toISOString(),
  authMethod: 'LOCAL_SIGNED',
};

const evidence: Evidence[] = [{
  id: 'evidence-1',
  type: 'DETERMINISTIC_CALCULATION',
  source: 'integration-test',
  claim: 'Target state is safe to mutate.',
  confidence: 95,
  verified: true,
  timestamp: new Date().toISOString(),
  rawPayload: { safe: true },
  provenanceTrail: ['integration-test'],
}];

const allowRule: PolicyRule = {
  id: 'policy-allow-test',
  name: 'Allow low-risk state mutation',
  description: 'Allows low-risk deterministic state mutations.',
  capabilityTarget: 'STATE_MUTATION',
  maxRiskScore: 40,
  minConfidence: 80,
  requiresHumanEscalation: false,
  isDeterministic: true,
  action: 'ALLOW',
};

const proposal: Proposal = {
  id: 'proposal-integration-1',
  type: 'STATE_MUTATION',
  summary: 'Update integration-test state',
  targetResource: 'integration:test-state',
  requestedAction: 'state:mutate',
  parameters: { value: 'approved' },
  expectedImpact: 'No external side effects.',
  riskScore: 10,
  confidence: 95,
  proposingAgentId: 'agent-integration-test',
};

function makeEvent(id: string, executionId: string): CanonicalEvent {
  return {
    id,
    name: 'Integration execution event',
    type: 'EXECUTION_COMPLETED',
    timestamp: new Date().toISOString(),
    actor: { id: systemPrincipal.subject, name: 'Integration Test System', role: 'SYSTEM' },
    agentId: proposal.proposingAgentId,
    executionId,
    traceId: `trace-${executionId}`,
    causation: proposal.id,
    correlation: executionId,
    provenance: { source: 'kernel.integration.test', confidence: 100, chain: ['integration-test'] },
    previousEventHash: 'IGNORED_BY_LEDGER',
    currentEventHash: 'IGNORED_BY_LEDGER',
    payload: { proposalId: proposal.id, outcome: 'EXECUTED' },
    integrityStatus: 'VALID',
  };
}

describe('kernel integration path', () => {
  it('allows a low-risk proposal, authorizes it, executes it, and commits a valid ledger event', async () => {
    const decision = PolicyGateEngine.evaluate(proposal, evidence, [allowRule], systemPrincipal.roles[0]);
    expect(decision.outcome).toBe('ALLOW');
    expect(decision.evaluator).toBe('DETERMINISTIC_GATE_KERNEL');

    const executionId = 'exec-integration-allow';
    const authorization = issueExecutionAuthorization(systemPrincipal, {
      executionId,
      proposalId: proposal.id,
      capability: proposal.requestedAction,
    }, secret);

    const broker = new ExecutionBroker();
    broker.register({
      capability: proposal.requestedAction,
      execute: async (approvedProposal) => ({ committed: true, proposalId: approvedProposal.id }),
    });

    const result = await broker.execute(authorization, proposal, secret);
    expect(result.status).toBe('EXECUTED');
    expect(result.proposalId).toBe(proposal.id);

    const ledger = new DurableEventLedger(`/tmp/the-factory-kernel-${executionId}.jsonl`);
    const committed = await ledger.append(makeEvent('event-integration-allow', executionId));
    expect(committed.previousEventHash).toBe('GENESIS');
    expect((await ledger.verify()).valid).toBe(true);
  });

  it('denies a high-risk proposal before authorization is issued', () => {
    const highRisk = { ...proposal, id: 'proposal-integration-deny', riskScore: 90 };
    const strictRule = { ...allowRule, maxRiskScore: 40, requiresHumanEscalation: false };
    const decision = PolicyGateEngine.evaluate(highRisk, evidence, [strictRule], systemPrincipal.roles[0]);

    expect(decision.outcome).toBe('DENY');
    expect(decision.reason).toContain('exceeded deterministic threshold');
  });

  it('escalates consequential security operations instead of allowing execution', () => {
    const securityProposal = { ...proposal, id: 'proposal-integration-security', type: 'SECURITY_RECONFIGURATION' as const };
    const decision = PolicyGateEngine.evaluate(securityProposal, evidence, [allowRule], systemPrincipal.roles[0]);

    expect(decision.outcome).toBe('ESCALATE');
    expect(decision.reason).toContain('dual-custody human sign-off');
  });

  it('rejects execution authorization issued to a principal without execution capability', () => {
    expect(() => issueExecutionAuthorization(operatorPrincipal, {
      executionId: 'exec-integration-denied-auth',
      proposalId: proposal.id,
      capability: proposal.requestedAction,
    }, secret)).toThrow('AUTHORIZATION_DENIED:execution:execute');
  });

  it('prevents an authorized execution from being replayed', async () => {
    const executionId = 'exec-integration-replay';
    const authorization = issueExecutionAuthorization(systemPrincipal, {
      executionId,
      proposalId: proposal.id,
      capability: proposal.requestedAction,
    }, secret);

    const broker = new ExecutionBroker();
    let executionCount = 0;
    broker.register({
      capability: proposal.requestedAction,
      execute: async () => { executionCount += 1; return { ok: true }; },
    });

    await broker.execute(authorization, proposal, secret);
    await expect(broker.execute(authorization, proposal, secret)).rejects.toThrow('EXECUTION_AUTHORIZATION_REPLAYED');
    expect(executionCount).toBe(1);
  });
});
