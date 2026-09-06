import crypto from 'crypto';
import type {
  CanonicalEvent,
  ExecutionContext,
  Proposal,
  Evidence,
  PolicyRule,
  PolicyDecision,
  ExecutionResult,
  MemoryRecord,
  ApprovalRequest,
  Agent,
  RuntimeMode,
} from '../src/types';

export function calculateEventHash(
  previousHash: string,
  event: Omit<CanonicalEvent, 'previousEventHash' | 'currentEventHash' | 'integrityStatus'>
): string {
  const content = JSON.stringify({
    previousHash,
    id: event.id,
    name: event.name,
    type: event.type,
    timestamp: event.timestamp,
    actor: event.actor,
    agentId: event.agentId,
    executionId: event.executionId,
    traceId: event.traceId,
    causation: event.causation,
    correlation: event.correlation,
    payload: event.payload,
  });
  return crypto.createHash('sha256').update(content).digest('hex');
}

export class PolicyGateEngine {
  public static evaluate(
    proposal: Proposal,
    evidence: Evidence[],
    activeRules: PolicyRule[],
    actorRole: string
  ): PolicyDecision {
    const decisionId = `pol-dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const appliedPolicies: PolicyDecision['appliedPolicies'] = [];

    // Deterministic Rule 1: High risk or critical action requires human escalation
    let outcome: 'ALLOW' | 'DENY' | 'ESCALATE' = 'ALLOW';
    let reason = 'All policy invariant checks passed deterministically.';

    // Check minimum evidence confidence
    const avgConfidence =
      evidence.length > 0
        ? evidence.reduce((acc, e) => acc + e.confidence, 0) / evidence.length
        : proposal.confidence;

    for (const rule of activeRules) {
      let matches = false;
      let ruleEffect: 'ALLOW' | 'DENY' | 'ESCALATE' = 'ALLOW';

      if (
        rule.capabilityTarget === '*' ||
        rule.capabilityTarget.toLowerCase() === proposal.type.toLowerCase() ||
        rule.capabilityTarget.toLowerCase() === proposal.targetResource.toLowerCase()
      ) {
        matches = true;

        if (proposal.riskScore > rule.maxRiskScore) {
          if (rule.requiresHumanEscalation) {
            ruleEffect = 'ESCALATE';
          } else {
            ruleEffect = 'DENY';
          }
        } else if (avgConfidence < rule.minConfidence) {
          ruleEffect = 'ESCALATE';
        } else {
          ruleEffect = rule.action;
        }

        appliedPolicies.push({
          policyId: rule.id,
          policyName: rule.name,
          matched: true,
          effect: ruleEffect,
        });

        if (ruleEffect === 'DENY') {
          outcome = 'DENY';
          reason = `Violated security rule [${rule.name}]: Risk score (${proposal.riskScore}) exceeded deterministic threshold (${rule.maxRiskScore}).`;
          break;
        } else if (ruleEffect === 'ESCALATE') {
          outcome = 'ESCALATE';
          reason = `Triggered human escalation on rule [${rule.name}]: Requires human review due to risk level or confidence verification.`;
        }
      }
    }

    // Explicit invariant: Financial allocations > $100,000 or security reconfigurations always ESCALATE
    if (
      proposal.type === 'SECURITY_RECONFIGURATION' ||
      (proposal.type === 'FINANCIAL_ALLOCATION' && (proposal.parameters?.amount || 0) > 100000)
    ) {
      if (outcome !== 'DENY') {
        outcome = 'ESCALATE';
        reason = 'Deterministic Kernel Invariant: Consequential security/financial operations strictly require dual-custody human sign-off.';
      }
    }

    return {
      decisionId,
      outcome,
      reason,
      appliedPolicies,
      riskScore: proposal.riskScore,
      confidence: Math.round(avgConfidence),
      evaluatedAt: new Date().toISOString(),
      evaluator: 'DETERMINISTIC_GATE_KERNEL',
    };
  }
}
