import crypto from 'node:crypto';
import type { CanonicalEvent, ExecutionLifecycleStatus, ExecutionReceipt } from '../src/types';
import type { DurableEventLedger } from './durable-ledger';

export interface ExecutionReceiptStore {
  get(executionId: string): Promise<ExecutionReceipt | undefined>;
}

export class DurableExecutionReceiptStore implements ExecutionReceiptStore {
  constructor(private readonly ledger: DurableEventLedger) {}

  async get(executionId: string): Promise<ExecutionReceipt | undefined> {
    const events = await this.ledger.read();
    const lifecycle = events.filter((event) => event.executionId === executionId && event.payload.receipt);
    if (lifecycle.length === 0) return undefined;

    let receipt: ExecutionReceipt | undefined;
    for (const event of lifecycle) {
      receipt = { ...(event.payload.receipt as ExecutionReceipt), ledgerEventIds: [...(receipt?.ledgerEventIds ?? []), event.id] };
    }
    return receipt;
  }
}

export function createExecutionReceipt(input: {
  executionId: string;
  proposalId: string;
  policyDecisionId: string;
  authorizationNonce: string;
  capability: string;
  subject: string;
  now?: Date;
}): ExecutionReceipt {
  const now = (input.now ?? new Date()).toISOString();
  return {
    executionId: input.executionId,
    proposalId: input.proposalId,
    policyDecisionId: input.policyDecisionId,
    authorizationNonce: input.authorizationNonce,
    capability: input.capability,
    subject: input.subject,
    status: 'AUTHORIZED',
    createdAt: now,
    ledgerEventIds: [],
  };
}

const ALLOWED_TRANSITIONS: Record<ExecutionLifecycleStatus, readonly ExecutionLifecycleStatus[]> = {
  AUTHORIZED: ['CLAIMED', 'UNKNOWN'],
  CLAIMED: ['RUNNING', 'FAILED', 'UNKNOWN'],
  RUNNING: ['SUCCEEDED', 'FAILED', 'UNKNOWN'],
  SUCCEEDED: [],
  FAILED: ['RECOVERING'],
  UNKNOWN: ['RECOVERING'],
  RECOVERING: ['RUNNING', 'FAILED', 'SUCCEEDED'],
};

export function assertExecutionTransition(from: ExecutionLifecycleStatus, to: ExecutionLifecycleStatus): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new Error(`EXECUTION_INVALID_STATE_TRANSITION:${from}->${to}`);
  }
}

export function transitionExecutionReceipt(
  receipt: ExecutionReceipt,
  status: ExecutionLifecycleStatus,
  details: { now?: Date; output?: unknown; error?: string } = {},
): ExecutionReceipt {
  assertExecutionTransition(receipt.status, status);
  const now = (details.now ?? new Date()).toISOString();
  const next: ExecutionReceipt = { ...receipt, status };

  if (status === 'CLAIMED') next.claimedAt = now;
  if (status === 'RUNNING') next.startedAt = receipt.startedAt ?? now;
  if (status === 'SUCCEEDED' || status === 'FAILED') {
    next.completedAt = now;
    if (next.startedAt) next.durationMs = Date.parse(now) - Date.parse(next.startedAt);
  }
  if (status === 'SUCCEEDED') next.output = details.output;
  if (status === 'FAILED') next.error = details.error ?? 'EXECUTION_FAILED';
  return next;
}

export function createExecutionEvent(input: {
  type: CanonicalEvent['type'];
  receipt: ExecutionReceipt;
  actorId: string;
  proposalId: string;
  agentId: string;
  causation: string;
  sequence: number;
  payload?: Record<string, unknown>;
}): CanonicalEvent {
  return {
    id: crypto.randomUUID(),
    name: `Execution ${input.receipt.status.toLowerCase()}`,
    type: input.type,
    timestamp: new Date().toISOString(),
    actor: { id: input.actorId, name: input.actorId, role: 'SYSTEM' },
    agentId: input.agentId,
    executionId: input.receipt.executionId,
    traceId: `execution:${input.receipt.executionId}`,
    causation: input.causation,
    correlation: input.receipt.executionId,
    provenance: { source: 'execution-broker', confidence: 100, chain: ['execution-broker', 'durable-ledger'] },
    previousEventHash: 'LEDGER_ASSIGNED',
    currentEventHash: 'LEDGER_ASSIGNED',
    payload: {
      proposalId: input.proposalId,
      sequence: input.sequence,
      receipt: input.receipt,
      ...input.payload,
    },
    integrityStatus: 'VALID',
  };
}
