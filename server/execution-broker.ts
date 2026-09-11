import path from 'node:path';
import { verifyExecutionAuthorization, type ExecutionAuthorization } from './security';
import { DurableExecutionReplayStore } from './execution-replay-store';
import { DurableEventLedger } from './durable-ledger';
import { createExecutionEvent, createExecutionReceipt, transitionExecutionReceipt } from './execution-receipt';
import type { PolicyDecision, Proposal, ExecutionReceipt } from '../src/types';

export interface CapabilityAdapter {
  capability: string;
  execute(proposal: Proposal): Promise<unknown>;
}

export interface BrokerExecutionResult {
  executionId: string;
  proposalId: string;
  status: 'EXECUTED';
  output: unknown;
  receipt: ExecutionReceipt;
}

/** The only component allowed to cross from a policy-approved proposal into a capability adapter. */
export class ExecutionBroker {
  private readonly adapters = new Map<string, CapabilityAdapter>();
  private readonly ledger: DurableEventLedger;

  constructor(
    private readonly replayStore = new DurableExecutionReplayStore(),
    ledger?: DurableEventLedger,
  ) {
    this.ledger = ledger ?? new DurableEventLedger(path.resolve('.runtime', 'execution-ledger.jsonl'));
  }

  register(adapter: CapabilityAdapter): void {
    if (this.adapters.has(adapter.capability)) throw new Error(`CAPABILITY_ALREADY_REGISTERED:${adapter.capability}`);
    this.adapters.set(adapter.capability, adapter);
  }

  async getReceipt(executionId: string): Promise<ExecutionReceipt | undefined> {
    const events = await this.ledger.read();
    const lifecycle = events.filter((event) => event.executionId === executionId && event.payload.receipt);
    if (lifecycle.length === 0) return undefined;
    const latest = lifecycle.at(-1)!;
    return { ...(latest.payload.receipt as ExecutionReceipt), ledgerEventIds: lifecycle.map((event) => event.id) };
  }

  /** Marks executions left in CLAIMED/RUNNING after a process interruption as UNKNOWN. */
  async recoverInterruptedExecutions(): Promise<ExecutionReceipt[]> {
    const events = await this.ledger.read();
    const latestByExecution = new Map<string, typeof events[number]>();
    for (const event of events) if (event.payload.receipt) latestByExecution.set(event.executionId, event);

    const recovered: ExecutionReceipt[] = [];
    for (const event of latestByExecution.values()) {
      const receipt = event.payload.receipt as ExecutionReceipt;
      if (receipt.status !== 'CLAIMED' && receipt.status !== 'RUNNING') continue;
      const next = transitionExecutionReceipt(receipt, 'UNKNOWN');
      recovered.push(await this.record(next, 'EXECUTION_FAILED', {
        id: receipt.proposalId,
        type: 'STATE_MUTATION', summary: 'Recovered interrupted execution', targetResource: 'recovery', requestedAction: receipt.capability,
        parameters: {}, expectedImpact: 'No automatic replay.', riskScore: 0, confidence: 100, proposingAgentId: event.agentId ?? 'unknown',
      }, receipt.subject, receipt.policyDecisionId, { recovery: true }));
    }
    return recovered;
  }

  async execute(
    authorization: ExecutionAuthorization,
    proposal: Proposal,
    policyDecision: PolicyDecision,
    secret: string,
  ): Promise<BrokerExecutionResult> {
    if (!verifyExecutionAuthorization(authorization, secret)) throw new Error('EXECUTION_AUTHORIZATION_INVALID');
    if (authorization.proposalId !== proposal.id) throw new Error('EXECUTION_PROPOSAL_MISMATCH');
    if (authorization.policyDecisionId !== policyDecision.decisionId) throw new Error('EXECUTION_POLICY_DECISION_MISMATCH');
    if (policyDecision.outcome !== 'ALLOW') throw new Error(`EXECUTION_POLICY_NOT_ALLOW:${policyDecision.outcome}`);

    const adapter = this.adapters.get(authorization.capability);
    if (!adapter) throw new Error(`CAPABILITY_UNAVAILABLE:${authorization.capability}`);
    if (adapter.capability !== proposal.requestedAction) throw new Error('EXECUTION_CAPABILITY_MISMATCH');

    const existing = await this.getReceipt(authorization.executionId);
    if (existing?.authorizationNonce === authorization.nonce) throw new Error('EXECUTION_AUTHORIZATION_REPLAYED');
    if (existing?.status === 'SUCCEEDED') throw new Error('EXECUTION_ID_ALREADY_COMPLETED');
    if (existing?.status === 'RUNNING' || existing?.status === 'CLAIMED') throw new Error('EXECUTION_ID_ALREADY_ACTIVE');
    if (existing?.status === 'UNKNOWN') throw new Error('EXECUTION_ID_REQUIRES_RECOVERY');

    let receipt = createExecutionReceipt({
      executionId: authorization.executionId,
      proposalId: proposal.id,
      policyDecisionId: policyDecision.decisionId,
      authorizationNonce: authorization.nonce,
      capability: authorization.capability,
      subject: authorization.subject,
    });

    receipt = await this.record(receipt, 'EXECUTION_AUTHORIZED', proposal, authorization.subject, authorization.policyDecisionId);

    const claimed = await this.replayStore.claim({
      nonce: authorization.nonce,
      executionId: authorization.executionId,
      proposalId: proposal.id,
      claimedAt: new Date().toISOString(),
    });
    if (!claimed) throw new Error('EXECUTION_AUTHORIZATION_REPLAYED');

    receipt = transitionExecutionReceipt(receipt, 'CLAIMED');
    receipt = await this.record(receipt, 'EXECUTION_CLAIMED', proposal, authorization.subject, authorization.policyDecisionId);
    receipt = transitionExecutionReceipt(receipt, 'RUNNING');
    receipt = await this.record(receipt, 'EXECUTION_STARTED', proposal, authorization.subject, authorization.policyDecisionId);

    try {
      const output = await adapter.execute(proposal);
      receipt = transitionExecutionReceipt(receipt, 'SUCCEEDED', { output });
      receipt = await this.record(receipt, 'EXECUTION_COMPLETED', proposal, authorization.subject, authorization.policyDecisionId);
      return { executionId: authorization.executionId, proposalId: proposal.id, status: 'EXECUTED', output, receipt };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      receipt = transitionExecutionReceipt(receipt, 'FAILED', { error: message });
      await this.record(receipt, 'EXECUTION_FAILED', proposal, authorization.subject, authorization.policyDecisionId);
      throw new Error(`EXECUTION_FAILED:${message}`);
    }
  }

  private async record(
    receipt: ExecutionReceipt,
    type: 'EXECUTION_AUTHORIZED' | 'EXECUTION_CLAIMED' | 'EXECUTION_STARTED' | 'EXECUTION_COMPLETED' | 'EXECUTION_FAILED',
    proposal: Proposal,
    actorId: string,
    causation: string,
    payload: Record<string, unknown> = {},
  ): Promise<ExecutionReceipt> {
    const event = createExecutionEvent({
      type, receipt, actorId, proposalId: proposal.id, agentId: proposal.proposingAgentId,
      causation, sequence: receipt.ledgerEventIds.length, payload,
    });
    const committed = await this.ledger.append(event);
    return { ...receipt, ledgerEventIds: [...receipt.ledgerEventIds, committed.id] };
  }
}
