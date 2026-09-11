import { describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DurableEventLedger } from './durable-ledger';
import { ExecutionBroker } from './execution-broker';
import { DurableExecutionReplayStore } from './execution-replay-store';
import { assertExecutionTransition } from './execution-receipt';
import { PolicyGateEngine } from './kernel';
import { issueExecutionAuthorization, type AuthenticatedPrincipal } from './security';
import type { Evidence, PolicyRule, Proposal } from '../src/types';

const secret = 'execution-lifecycle-test-secret';
const principal: AuthenticatedPrincipal = { subject: 'factory-lifecycle-test', roles: ['SYSTEM'], authenticatedAt: new Date().toISOString(), authMethod: 'SERVICE_IDENTITY' };
const evidence: Evidence[] = [{ id: 'e1', type: 'DETERMINISTIC_CALCULATION', source: 'test', claim: 'safe', confidence: 95, verified: true, timestamp: new Date().toISOString(), rawPayload: {}, provenanceTrail: ['test'] }];
const rule: PolicyRule = { id: 'p1', name: 'allow', description: 'allow', capabilityTarget: 'STATE_MUTATION', maxRiskScore: 40, minConfidence: 80, requiresHumanEscalation: false, isDeterministic: true, action: 'ALLOW' };
const proposal: Proposal = { id: 'lifecycle-proposal', type: 'STATE_MUTATION', summary: 'test', targetResource: 'test', requestedAction: 'state:mutate', parameters: {}, expectedImpact: 'test', riskScore: 10, confidence: 95, proposingAgentId: 'agent-test' };

async function makeBroker() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'factory-execution-'));
  const ledger = new DurableEventLedger(path.join(root, 'ledger.jsonl'));
  const replay = new DurableExecutionReplayStore(path.join(root, 'replay'));
  return { broker: new ExecutionBroker(replay, ledger), ledger, root };
}
function authorize(executionId: string) {
  const decision = PolicyGateEngine.evaluate(proposal, evidence, [rule], 'SYSTEM');
  const authorization = issueExecutionAuthorization(principal, { executionId, proposalId: proposal.id, policyDecisionId: decision.decisionId, capability: proposal.requestedAction }, secret);
  return { decision, authorization };
}

describe('execution lifecycle integration', () => {
  it('records authorized → claimed → started → completed and recovers the receipt', async () => {
    const { broker, ledger, root } = await makeBroker();
    try {
      const { decision, authorization } = authorize('lifecycle-success');
      broker.register({ capability: proposal.requestedAction, execute: async () => ({ ok: true }) });
      const result = await broker.execute(authorization, proposal, decision, secret);
      expect(result.receipt.status).toBe('SUCCEEDED');
      expect(result.receipt.ledgerEventIds).toHaveLength(4);
      expect((await broker.getReceipt(result.executionId))?.status).toBe('SUCCEEDED');
      expect((await ledger.read()).map((event) => event.type)).toEqual(['EXECUTION_AUTHORIZED', 'EXECUTION_CLAIMED', 'EXECUTION_STARTED', 'EXECUTION_COMPLETED']);
      expect((await ledger.verify()).valid).toBe(true);
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it('records adapter failure as FAILED and does not permit unsafe replay', async () => {
    const { broker, ledger, root } = await makeBroker();
    try {
      const { decision, authorization } = authorize('lifecycle-failure');
      broker.register({ capability: proposal.requestedAction, execute: async () => { throw new Error('adapter down'); } });
      await expect(broker.execute(authorization, proposal, decision, secret)).rejects.toThrow('EXECUTION_FAILED:adapter down');
      expect((await broker.getReceipt(authorization.executionId))?.status).toBe('FAILED');
      expect((await ledger.read()).at(-1)?.type).toBe('EXECUTION_FAILED');
      await expect(broker.execute(authorization, proposal, decision, secret)).rejects.toThrow('EXECUTION_AUTHORIZATION_REPLAYED');
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it('rejects a new authorization that reuses a completed execution ID', async () => {
    const { broker, root } = await makeBroker();
    try {
      const first = authorize('lifecycle-idempotency');
      broker.register({ capability: proposal.requestedAction, execute: async () => 'ok' });
      await broker.execute(first.authorization, proposal, first.decision, secret);
      const second = authorize('lifecycle-idempotency');
      await expect(broker.execute(second.authorization, proposal, second.decision, secret)).rejects.toThrow('EXECUTION_ID_ALREADY_COMPLETED');
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it('marks interrupted RUNNING executions as UNKNOWN during recovery', async () => {
    const { broker, ledger, root } = await makeBroker();
    try {
      const { decision, authorization } = authorize('lifecycle-recovery');
      let release!: () => void;
      const blocked = new Promise<void>((resolve) => { release = resolve; });
      broker.register({ capability: proposal.requestedAction, execute: async () => blocked });
      const executionPromise = broker.execute(authorization, proposal, decision, secret);
      for (let attempt = 0; attempt < 20 && (await ledger.read()).filter((e) => e.type === 'EXECUTION_STARTED').length === 0; attempt += 1) await new Promise((resolve) => setTimeout(resolve, 5));
      const recovered = await broker.recoverInterruptedExecutions();
      expect(recovered).toHaveLength(1);
      expect(recovered[0].status).toBe('UNKNOWN');
      expect((await ledger.read()).at(-1)?.type).toBe('RECOVERY_ACTION');
      expect((await broker.getReceipt(authorization.executionId))?.status).toBe('UNKNOWN');
      release();
      await executionPromise;
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it('enforces the lifecycle state machine and rejects illegal transitions', () => {
    expect(() => assertExecutionTransition('AUTHORIZED', 'SUCCEEDED')).toThrow('EXECUTION_INVALID_STATE_TRANSITION');
    expect(() => assertExecutionTransition('SUCCEEDED', 'RUNNING')).toThrow('EXECUTION_INVALID_STATE_TRANSITION');
    expect(() => assertExecutionTransition('FAILED', 'RECOVERING')).not.toThrow();
  });
});
