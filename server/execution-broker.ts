import { verifyExecutionAuthorization, type ExecutionAuthorization } from './security';
import { DurableExecutionReplayStore } from './execution-replay-store';
import type { PolicyDecision, Proposal } from '../src/types';

export interface CapabilityAdapter {
  capability: string;
  execute(proposal: Proposal): Promise<unknown>;
}

export interface BrokerExecutionResult {
  executionId: string;
  proposalId: string;
  status: 'EXECUTED';
  output: unknown;
}

/**
 * The only component allowed to cross from a policy-approved proposal into a
 * capability adapter. AI agents never receive adapters directly.
 */
export class ExecutionBroker {
  private readonly adapters = new Map<string, CapabilityAdapter>();

  constructor(
    private readonly replayStore = new DurableExecutionReplayStore()
  ) {}

  register(adapter: CapabilityAdapter): void {
    if (this.adapters.has(adapter.capability)) {
      throw new Error(`CAPABILITY_ALREADY_REGISTERED:${adapter.capability}`);
    }
    this.adapters.set(adapter.capability, adapter);
  }

  async execute(
    authorization: ExecutionAuthorization,
    proposal: Proposal,
    policyDecision: PolicyDecision,
    secret: string
  ): Promise<BrokerExecutionResult> {
    if (!verifyExecutionAuthorization(authorization, secret)) {
      throw new Error('EXECUTION_AUTHORIZATION_INVALID');
    }
    if (authorization.proposalId !== proposal.id) {
      throw new Error('EXECUTION_PROPOSAL_MISMATCH');
    }
    if (authorization.policyDecisionId !== policyDecision.decisionId) {
      throw new Error('EXECUTION_POLICY_DECISION_MISMATCH');
    }
    if (policyDecision.outcome !== 'ALLOW') {
      throw new Error(`EXECUTION_POLICY_NOT_ALLOW:${policyDecision.outcome}`);
    }

    const adapter = this.adapters.get(authorization.capability);
    if (!adapter) {
      throw new Error(`CAPABILITY_UNAVAILABLE:${authorization.capability}`);
    }
    if (adapter.capability !== proposal.requestedAction) {
      throw new Error('EXECUTION_CAPABILITY_MISMATCH');
    }

    const claimed = await this.replayStore.claim({
      nonce: authorization.nonce,
      executionId: authorization.executionId,
      proposalId: proposal.id,
      claimedAt: new Date().toISOString(),
    });
    if (!claimed) {
      throw new Error('EXECUTION_AUTHORIZATION_REPLAYED');
    }

    // The durable claim is committed before crossing the execution boundary.
    // If the adapter fails, the authorization remains consumed because the
    // external side-effect state is unknown and replaying could duplicate it.
    const output = await adapter.execute(proposal);
    return { executionId: authorization.executionId, proposalId: proposal.id, status: 'EXECUTED', output };
  }
}
