import path from 'node:path';
import crypto from 'node:crypto';
import { DurableEventLedger } from './durable-ledger';
import { ExecutionBroker } from './execution-broker';
import { PolicyGateEngine } from './kernel';
import { issueExecutionAuthorization, type AuthenticatedPrincipal } from './security';
import type { CanonicalEvent, Evidence, ExecutionReceipt, PolicyDecision, PolicyRule, Proposal } from '../src/types';

export interface VerificationResult {
  status: 'VERIFIED' | 'UNCERTAIN' | 'REJECTED';
  checks: { checkName: string; passed: boolean; details: string }[];
  confidence: number;
  riskScore: number;
}

export interface AgentProposalInput {
  proposal: Proposal;
  evidence: Evidence[];
  actorRole: AuthenticatedPrincipal['roles'][number];
  agentId?: string;
}

export interface AgentRunResult {
  executionId: string;
  proposal: Proposal;
  evidence: Evidence[];
  verification: VerificationResult;
  policyDecision: PolicyDecision;
  authorizationIssued: boolean;
  authorization?: { executionId: string; proposalId: string; policyDecisionId: string; capability: string };
  receipt?: ExecutionReceipt;
  status: 'EXECUTED' | 'DENIED' | 'ESCALATED' | 'VERIFICATION_REJECTED';
  output?: unknown;
  reason?: string;
}

/**
 * Governed runtime boundary: agent proposal -> verification -> policy -> authorization -> broker execution.
 * Agents can propose, but only the runtime execution principal can authorize execution.
 */
export class AgentRuntime {
  constructor(
    private readonly broker: ExecutionBroker,
    private readonly executionPrincipal: AuthenticatedPrincipal,
    private readonly executionSecret: string,
    private readonly ledger: DurableEventLedger = new DurableEventLedger(path.resolve('.runtime', 'execution-ledger.jsonl')),
  ) {}

  async run(input: AgentProposalInput, activeRules: PolicyRule[]): Promise<AgentRunResult> {
    const executionId = `exec-${crypto.randomUUID()}`;
    const proposal = input.proposal;
    const agentId = input.agentId ?? proposal.proposingAgentId;

    await this.record('PROPOSAL_GENERATED', executionId, proposal, agentId, {
      proposal,
      evidenceCount: input.evidence.length,
    });

    const verification = this.verifyProposal(proposal, input.evidence);
    await this.record('EVALUATION_COMPLETED', executionId, proposal, agentId, { verification });

    if (verification.status === 'REJECTED') {
      return {
        executionId, proposal, evidence: input.evidence, verification,
        policyDecision: this.rejectedVerificationDecision(executionId, verification),
        authorizationIssued: false, status: 'VERIFICATION_REJECTED', reason: 'Proposal verification rejected execution.',
      };
    }

    const policyDecision = PolicyGateEngine.evaluate(proposal, input.evidence, activeRules, input.actorRole);
    await this.record('POLICY_DECISION', executionId, proposal, agentId, { policyDecision });

    if (policyDecision.outcome === 'DENY') {
      return { executionId, proposal, evidence: input.evidence, verification, policyDecision, authorizationIssued: false, status: 'DENIED', reason: policyDecision.reason };
    }

    if (policyDecision.outcome === 'ESCALATE') {
      await this.record('ESCALATION_TRIGGERED', executionId, proposal, agentId, { policyDecision });
      return { executionId, proposal, evidence: input.evidence, verification, policyDecision, authorizationIssued: false, status: 'ESCALATED', reason: policyDecision.reason };
    }

    const authorization = issueExecutionAuthorization(this.executionPrincipal, {
      executionId,
      proposalId: proposal.id,
      policyDecisionId: policyDecision.decisionId,
      capability: proposal.requestedAction,
    }, this.executionSecret);

    await this.record('EXECUTION_AUTHORIZED', executionId, proposal, this.executionPrincipal.subject, {
      policyDecisionId: policyDecision.decisionId,
      authorizationNonce: authorization.nonce,
      authorizedBy: this.executionPrincipal.subject,
    });

    const result = await this.broker.execute(authorization, proposal, policyDecision, this.executionSecret);
    return {
      executionId, proposal, evidence: input.evidence, verification, policyDecision,
      authorizationIssued: true,
      authorization: {
        executionId: authorization.executionId,
        proposalId: authorization.proposalId,
        policyDecisionId: authorization.policyDecisionId,
        capability: authorization.capability,
      },
      receipt: result.receipt,
      status: 'EXECUTED',
      output: result.output,
    };
  }

  private verifyProposal(proposal: Proposal, evidence: Evidence[]): VerificationResult {
    const checks: VerificationResult['checks'] = [];
    const requiredStrings: [string, unknown][] = [
      ['proposal.id', proposal.id],
      ['proposal.summary', proposal.summary],
      ['proposal.targetResource', proposal.targetResource],
      ['proposal.requestedAction', proposal.requestedAction],
      ['proposal.proposingAgentId', proposal.proposingAgentId],
    ];
    for (const [name, value] of requiredStrings) checks.push({ checkName: `${name}:present`, passed: typeof value === 'string' && value.trim().length > 0, details: 'Required proposal field must be non-empty.' });

    const numericRisk = Number.isFinite(proposal.riskScore) && proposal.riskScore >= 0 && proposal.riskScore <= 100;
    const numericConfidence = Number.isFinite(proposal.confidence) && proposal.confidence >= 0 && proposal.confidence <= 100;
    checks.push({ checkName: 'risk-score:bounded', passed: numericRisk, details: 'Risk score must be between 0 and 100.' });
    checks.push({ checkName: 'confidence:bounded', passed: numericConfidence, details: 'Proposal confidence must be between 0 and 100.' });

    const verifiedEvidence = evidence.length > 0 && evidence.every((item) => item.verified && item.confidence >= 0 && item.confidence <= 100);
    checks.push({ checkName: 'evidence:verified', passed: verifiedEvidence, details: 'All supplied evidence must be verified and confidence-bounded.' });

    const avgEvidenceConfidence = evidence.length > 0 ? evidence.reduce((sum, item) => sum + item.confidence, 0) / evidence.length : 0;
    const confidence = Math.round(Math.min(proposal.confidence, avgEvidenceConfidence));
    const passed = checks.every((check) => check.passed);
    const status: VerificationResult['status'] = !passed ? 'REJECTED' : confidence < 60 ? 'UNCERTAIN' : 'VERIFIED';
    return { status, checks, confidence, riskScore: proposal.riskScore };
  }

  private rejectedVerificationDecision(executionId: string, verification: VerificationResult): PolicyDecision {
    return {
      decisionId: `verification-rejected-${executionId}`,
      outcome: 'DENY',
      reason: `Verification rejected proposal: ${verification.checks.filter((check) => !check.passed).map((check) => check.checkName).join(', ')}`,
      appliedPolicies: [],
      riskScore: verification.riskScore,
      confidence: verification.confidence,
      evaluatedAt: new Date().toISOString(),
      evaluator: 'DETERMINISTIC_GATE_KERNEL',
    };
  }

  private async record(
    type: CanonicalEvent['type'],
    executionId: string,
    proposal: Proposal,
    actorId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const event: CanonicalEvent = {
      id: crypto.randomUUID(),
      name: `Agent runtime ${type.toLowerCase()}`,
      type,
      timestamp: new Date().toISOString(),
      actor: { id: actorId, name: actorId, role: actorId === this.executionPrincipal.subject ? 'SYSTEM' : 'SYSTEM' },
      agentId: proposal.proposingAgentId,
      executionId,
      traceId: `execution:${executionId}`,
      causation: proposal.id,
      correlation: executionId,
      provenance: { source: 'agent-runtime', confidence: 100, chain: ['agent-runtime', 'policy-gate'] },
      previousEventHash: 'LEDGER_ASSIGNED',
      currentEventHash: 'LEDGER_ASSIGNED',
      payload,
      integrityStatus: 'VALID',
    };
    await this.ledger.append(event);
  }
}
