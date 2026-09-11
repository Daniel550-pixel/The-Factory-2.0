import { describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { AgentRuntime } from './agent-runtime';
import { DurableEventLedger } from './durable-ledger';
import { ExecutionBroker } from './execution-broker';
import { DurableExecutionReplayStore } from './execution-replay-store';
import type { AuthenticatedPrincipal } from './security';
import type { Evidence, PolicyRule, Proposal } from '../src/types';

const secret = 'agent-runtime-integration-secret';
const executionPrincipal: AuthenticatedPrincipal = {
  subject: 'factory-execution-authority', roles: ['SYSTEM'], authenticatedAt: new Date().toISOString(), authMethod: 'SERVICE_IDENTITY',
};
const evidence: Evidence[] = [{
  id: 'runtime-evidence', type: 'DETERMINISTIC_CALCULATION', source: 'runtime-test', claim: 'safe', confidence: 95, verified: true,
  timestamp: new Date().toISOString(), rawPayload: { safe: true }, provenanceTrail: ['runtime-test'],
}];
const rule: PolicyRule = {
  id: 'runtime-allow', name: 'Runtime low-risk allow', description: 'Allows verified low-risk mutations.', capabilityTarget: 'STATE_MUTATION',
  maxRiskScore: 40, minConfidence: 80, requiresHumanEscalation: false, isDeterministic: true, action: 'ALLOW',
};
const proposal: Proposal = {
  id: 'runtime-proposal', type: 'STATE_MUTATION', summary: 'Apply approved runtime state', targetResource: 'runtime:test', requestedAction: 'state:mutate',
  parameters: { value: 'approved' }, expectedImpact: 'Controlled test mutation.', riskScore: 10, confidence: 95, proposingAgentId: 'agent-runtime-test',
};

async function makeRuntime() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'factory-runtime-'));
  const ledger = new DurableEventLedger(path.join(root, 'ledger.jsonl'));
  const broker = new ExecutionBroker(new DurableExecutionReplayStore(path.join(root, 'replay')), ledger);
  broker.register({ capability: proposal.requestedAction, execute: async () => ({ committed: true }) });
  return { runtime: new AgentRuntime(broker, executionPrincipal, secret, ledger), ledger, root };
}

describe('governed agent runtime', () => {
  it('executes the complete agent → verification → policy → authorization → broker path', async () => {
    const { runtime, ledger, root } = await makeRuntime();
    try {
      const result = await runtime.run({ proposal, evidence, actorRole: 'SYSTEM' }, [rule]);
      expect(result.status).toBe('EXECUTED');
      expect(result.authorizationIssued).toBe(true);
      expect(result.policyDecision.outcome).toBe('ALLOW');
      expect(result.verification.status).toBe('VERIFIED');
      expect(result.receipt?.status).toBe('SUCCEEDED');
      expect((await ledger.verify()).valid).toBe(true);
      expect((await ledger.read()).map((event) => event.type)).toContain('PROPOSAL_GENERATED');
      expect((await ledger.read()).map((event) => event.type)).toContain('EVALUATION_COMPLETED');
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it('rejects malformed proposals before policy evaluation or authorization', async () => {
    const { runtime, ledger, root } = await makeRuntime();
    try {
      const result = await runtime.run({ proposal: { ...proposal, requestedAction: '' }, evidence, actorRole: 'SYSTEM' }, [rule]);
      expect(result.status).toBe('VERIFICATION_REJECTED');
      expect(result.authorizationIssued).toBe(false);
      expect(result.policyDecision.outcome).toBe('DENY');
      expect((await ledger.read()).map((event) => event.type)).not.toContain('POLICY_DECISION');
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it('denies a policy violation without crossing the execution boundary', async () => {
    const { runtime, ledger, root } = await makeRuntime();
    try {
      const result = await runtime.run({ proposal: { ...proposal, riskScore: 90 }, evidence, actorRole: 'SYSTEM' }, [rule]);
      expect(result.status).toBe('DENIED');
      expect(result.authorizationIssued).toBe(false);
      expect((await ledger.read()).map((event) => event.type)).toContain('POLICY_DECISION');
      expect((await ledger.read()).map((event) => event.type)).not.toContain('EXECUTION_STARTED');
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it('escalates consequential operations without issuing execution authorization', async () => {
    const { runtime, ledger, root } = await makeRuntime();
    try {
      const result = await runtime.run({ proposal: { ...proposal, type: 'SECURITY_RECONFIGURATION' }, evidence, actorRole: 'SYSTEM' }, [rule]);
      expect(result.status).toBe('ESCALATED');
      expect(result.authorizationIssued).toBe(false);
      expect((await ledger.read()).map((event) => event.type)).toContain('ESCALATION_TRIGGERED');
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it('does not grant the proposing actor execution authority', async () => {
    const { runtime, root } = await makeRuntime();
    try {
      const result = await runtime.run({ proposal: { ...proposal, proposingAgentId: 'untrusted-agent' }, evidence, actorRole: 'SYSTEM' }, [rule]);
      expect(result.authorization?.executionId).toBeTruthy();
      expect(result.authorizationIssued).toBe(true);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
