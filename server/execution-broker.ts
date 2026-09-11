import { verifyExecutionAuthorization, type ExecutionAuthorization } from './security';
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
  private readonly consumedNonces = new Set<string>();

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
    if (this.consumedNonces.has(authorization.nonce)) {
      throw new Error('EXECUTION_AUTHORIZATION_REPLAYED');
    }

    const adapter = this.adapters.get(authorization.capability);
    if (!adapter) {
      throw new Error(`CAPABILITY_UNAVAILABLE:${authorization.capability}`);
    }
    if (adapter.capability !== proposal.requestedAction) {
      throw new Error('EXECUTION_CAPABILITY_MISMATCH');
    }

    // Consume before crossing the execution boundary. If an adapter fails,
    // the authorization cannot be retried because the side-effect state is
    // unknown and replaying could duplicate an external operation.
    this.consumedNonces.add(authorization.nonce);
    const output = await adapter.execute(proposal);
    return { executionId: authorization.executionId, proposalId: proposal.id, status: 'EXECUTED', output };
  }
}
