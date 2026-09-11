/**
 * The Factory — Core Typed Models & Invariants
 * Architectural source of truth derived from Daniel550-pixel/The-Factory
 * Fundamental invariant: AI DECIDES ≠ AI EXECUTES
 */

export type RuntimeMode = 'LIVE' | 'SIMULATION' | 'REPLAY' | 'RECOVERY';

export type EventType =
  | 'STATE_TRANSITION'
  | 'POLICY_DECISION'
  | 'PROPOSAL_GENERATED'
  | 'EVALUATION_COMPLETED'
  | 'EXECUTION_AUTHORIZED'
  | 'EXECUTION_CLAIMED'
  | 'EXECUTION_STARTED'
  | 'EXECUTION_COMPLETED'
  | 'EXECUTION_FAILED'
  | 'ESCALATION_TRIGGERED'
  | 'HUMAN_APPROVAL'
  | 'MEMORY_COMMITTED'
  | 'INTEGRITY_CHECK'
  | 'TOOL_INVOKED'
  | 'RECOVERY_ACTION'
  | 'ARBITRATION_RESOLVED';

export type PolicyOutcome = 'ALLOW' | 'DENY' | 'ESCALATE';

export interface Actor {
  id: string;
  name: string;
  role: 'OPERATOR' | 'SYSTEM' | 'SECURITY_ADMIN' | 'COMPLIANCE_OFFICER';
}

export interface ProvenanceInfo {
  source: string;
  confidence: number;
  chain: string[];
}

export interface CanonicalEvent {
  id: string;
  name: string;
  type: EventType;
  timestamp: string;
  actor: Actor;
  agentId?: string;
  executionId: string;
  traceId: string;
  parentTraceId?: string;
  causation: string;
  correlation: string;
  provenance: ProvenanceInfo;
  previousEventHash: string;
  currentEventHash: string;
  payload: Record<string, any>;
  integrityStatus: 'VALID' | 'CORRUPTED' | 'TAMPERED';
}

export interface Proposal {
  id: string;
  type: 'STATE_MUTATION' | 'INFRASTRUCTURE_DEPLOY' | 'FINANCIAL_ALLOCATION' | 'POLICY_UPDATE' | 'TOOL_INVOCATION' | 'DATA_EXPORT' | 'SECURITY_RECONFIGURATION';
  summary: string;
  targetResource: string;
  requestedAction: string;
  parameters: Record<string, any>;
  expectedImpact: string;
  riskScore: number;
  confidence: number;
  proposingAgentId: string;
}

export interface Evidence {
  id: string;
  type: 'OBSERVATION' | 'SOURCE_DATA' | 'DETERMINISTIC_CALCULATION' | 'SENSOR_TELEMETRY' | 'LEDGER_HISTORIC' | 'MODEL_INFERENCE';
  source: string;
  claim: string;
  confidence: number;
  verified: boolean;
  timestamp: string;
  rawPayload: any;
  provenanceTrail: string[];
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  capabilityTarget: string;
  maxRiskScore: number;
  minConfidence: number;
  requiresHumanEscalation: boolean;
  isDeterministic: boolean;
  action: PolicyOutcome;
}

export interface PolicyDecision {
  decisionId: string;
  outcome: PolicyOutcome;
  reason: string;
  appliedPolicies: {
    policyId: string;
    policyName: string;
    matched: boolean;
    effect: PolicyOutcome;
  }[];
  riskScore: number;
  confidence: number;
  evaluatedAt: string;
  evaluator: 'DETERMINISTIC_GATE_KERNEL';
}

export type ExecutionLifecycleStatus = 'AUTHORIZED' | 'CLAIMED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN' | 'RECOVERING';

export interface ExecutionReceipt {
  executionId: string;
  proposalId: string;
  policyDecisionId: string;
  authorizationNonce: string;
  capability: string;
  subject: string;
  status: ExecutionLifecycleStatus;
  createdAt: string;
  claimedAt?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  output?: unknown;
  error?: string;
  ledgerEventIds: string[];
}

export interface ExecutionResult {
  success: boolean;
  output: any;
  sideEffects: string[];
  durationMs: number;
  canonicalEventId: string;
}

export interface StructuredError {
  errorId: string;
  traceId: string;
  executionId: string;
  operation: string;
  component: string;
  cause: string;
  recoveryState: 'RECOVERABLE' | 'UNRECOVERABLE' | 'DEGRADED' | 'MANUAL_INTERVENTION_REQUIRED';
  timestamp: string;
}

export interface ExecutionContext {
  executionId: string;
  traceId: string;
  parentTraceId?: string;
  actorId: string;
  agentId: string;
  capabilityId: string;
  taskId?: string;
  timestamp: string;
  mode: RuntimeMode;
  status:
    | 'PENDING' | 'CONTEXT_ASSEMBLY' | 'REASONING' | 'PROPOSAL' | 'VERIFICATION'
    | 'POLICY_GATE' | 'AUTHORIZATION' | 'EXECUTING' | 'COMPLETED' | 'DENIED'
    | 'ESCALATED' | 'FAILED';
  request: { input: string; contextSnapshot: any; intent: string; domain: string };
  context: { memoryRecords: MemoryRecord[]; activeRules: PolicyRule[]; systemState: Record<string, any> };
  agentReasoning: { specialist: string; steps: { step: number; thought: string; evidenceRef?: string }[]; rawOutput?: string };
  proposal?: Proposal;
  evidence: Evidence[];
  verification: { status: 'VERIFIED' | 'UNCERTAIN' | 'REJECTED'; checks: { checkName: string; passed: boolean; details: string }[]; confidence: number; riskScore: number };
  policyDecision?: PolicyDecision;
  authorization?: { authorized: boolean; authorizer: string; method: 'AUTOMATIC_POLICY' | 'HUMAN_APPROVAL' | 'REPLAY_OVERRIDE'; timestamp: string };
  executionResult?: ExecutionResult;
  receipt?: { txHash: string; eventId: string; executedAt: string; durationMs: number };
  replayStatus?: { isReplay: boolean; originalExecutionId?: string; diverged: boolean; divergenceReason?: string };
  error?: StructuredError;
}

export interface Agent { id: string; name: string; description: string; type: 'SUPERVISOR' | 'SYSTEMS_ARCHITECT' | 'SECURITY_OFFICER' | 'INFRASTRUCTURE_OPS' | 'FINANCIAL_RISK' | 'LOGISTICS_GEO' | 'VERIFIER' | 'COMPLIANCE'; status: 'ACTIVE' | 'IDLE' | 'BUSY' | 'PAUSED' | 'DEGRADED'; capabilities: string[]; tools: string[]; modelProvider: string; confidence: number; riskProfile: 'LOW' | 'MEDIUM' | 'HIGH' | 'STRICT'; currentTask?: string; executionsCount: number; performanceScore: number; permissions: string[]; lastActivity: string; }
export type EvidenceRecord = Evidence;
export type MemoryType = 'RAW_OBSERVATION' | 'EVIDENCE' | 'MEMORY' | 'DISTILLED_KNOWLEDGE' | 'MODEL_OUTPUT';
export interface MemoryRecord { id: string; type: MemoryType; content: string; source: string; provenance: { sourceId: string; traceId: string; chain: string[] }; timestamp: string; confidence: number; relevance: number; associatedAgentId?: string; associatedExecutionId?: string; associatedEventId?: string; tags: string[]; }
export interface ApprovalRequest { id: string; executionId: string; agentId: string; agentName: string; proposal: Proposal; evidence: Evidence[]; riskScore: number; confidence: number; policyName: string; requestedCapability: string; requestedAction: string; timestamp: string; status: 'PENDING' | 'APPROVED' | 'DENIED' | 'MORE_EVIDENCE_REQUESTED'; reviewer?: string; reviewerNotes?: string; reviewedAt?: string; }
export interface ToolDefinition { id: string; name: string; description: string; capabilities: string[]; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; requiredPermissions: string[]; executionMode: 'SANDBOXED' | 'LOCAL_KERNEL' | 'API_GATEWAY' | 'HOST_ISOLATED'; status: 'AVAILABLE' | 'RESTRICTED' | 'OFFLINE'; owningAgentId: string; auditStatus: 'COMPLIANT' | 'NEEDS_REVIEW'; invocationCount: number; }
export interface ProviderDefinition { id: string; name: string; type: 'GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'LOCAL_KERNEL'; model: string; availability: 'ONLINE' | 'DEGRADED' | 'OFFLINE'; capabilities: string[]; latencyMs: number; usageRequests: number; status: string; }
export interface ScheduledTask { id: string; name: string; schedule: string; status: 'ACTIVE' | 'PAUSED' | 'FAILED' | 'COMPLETED'; agentId: string; capability: string; policy: string; lastExecution: string; nextExecution: string; failureCount: number; }
export interface ProductIntegration { id: string; name: string; adapter: string; status: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED' | 'STANDBY'; capabilities: string[]; eventsCount: number; executionsCount: number; health: 'HEALTHY' | 'WARNING' | 'ERROR'; connectionState: string; lastSync: string; }
export interface ArbitrationCase { id: string; executionId: string; topic: string; participatingAgents: { agentId: string; name: string; assessment: string; confidence: number; risk: number; evidence: string[] }[]; disagreements: string[]; selectedAssessment: string; arbitrationResult: string; arbitratorAgentId: string; policyImpact: string; timestamp: string; }
export interface SystemStatus { runtimeStatus: 'OPERATIONAL' | 'DEGRADED' | 'EMERGENCY_LOCKDOWN'; runtimeMode: RuntimeMode; ledgerIntegrity: 'VERIFIED' | 'TAMPER_DETECTED' | 'VERIFYING'; totalEvents: number; activeAgents: number; activeExecutions: number; pendingApprovals: number; policyStats: { allow: number; deny: number; escalate: number }; totalFailures: number; totalMemoryRecords: number; provenanceIntegrityPct: number; securityState: 'ENFORCED' | 'ALERT' | 'AUDIT_MODE'; lastIntegrityCheck: string; }
export interface NavigationTab { id: string; label: string; section: 'MAIN' | 'RUNTIME' | 'TRUST' | 'STATE' | 'OPERATIONS' | 'INTELLIGENCE' | 'PRODUCTS' | 'SYSTEM'; badge?: number | string; }
