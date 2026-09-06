import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { globalStore } from './server/store';
import { PolicyGateEngine } from './server/kernel';
import { runAgentReasoningPipeline } from './server/gemini';
import type {
  ExecutionContext,
  Proposal,
  Evidence,
  CanonicalEvent,
  ApprovalRequest,
  PolicyRule,
} from './src/types';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // API ROUTES
  // ==========================================

  // 1. System Status & Runtime Mode
  const getStatusHandler = (req: express.Request, res: express.Response) => {
    try {
      const status = globalStore.getSystemStatus();
      res.json({ status: 'ok', data: status });
    } catch (err: any) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  };
  app.get('/api/status', getStatusHandler);
  app.get('/api/system/status', getStatusHandler);

  const postModeHandler = (req: express.Request, res: express.Response) => {
    const { mode } = req.body;
    if (['LIVE', 'SIMULATION', 'REPLAY', 'RECOVERY'].includes(mode)) {
      const prevMode = globalStore.mode;
      globalStore.mode = mode;
      globalStore.appendEvent({
        id: `EVT-${Date.now()}-MODE`,
        name: 'RuntimeModeSwitched',
        type: 'STATE_TRANSITION',
        timestamp: new Date().toISOString(),
        actor: { id: 'act-operator-ui', name: 'Factory Operator Console', role: 'OPERATOR' },
        executionId: 'EX-SYSTEM-MODE',
        traceId: `trc-mode-${Date.now()}`,
        causation: 'MANUAL_MODE_SELECTION',
        correlation: 'OPERATOR_SESSION',
        provenance: {
          source: 'Control Plane UI Mode Selector',
          confidence: 100,
          chain: ['Operator UI', 'Mode Transition Dispatcher'],
        },
        payload: { previousMode: prevMode, newMode: mode },
      });
      res.json({ status: 'ok', data: { mode: globalStore.mode } });
    } else {
      res.status(400).json({ status: 'error', error: 'Invalid runtime mode' });
    }
  };
  app.post('/api/mode', postModeHandler);
  app.post('/api/system/mode', postModeHandler);

  // 2. Executions & Pipeline Runner
  app.get('/api/executions', (req, res) => {
    const list = Array.from(globalStore.executions.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    res.json({ status: 'ok', data: list });
  });

  app.get('/api/executions/:id', (req, res) => {
    const ex = globalStore.executions.get(req.params.id);
    if (!ex) return res.status(404).json({ status: 'error', error: 'Execution not found' });
    res.json({ status: 'ok', data: ex });
  });

  async function executePipeline(exec: ExecutionContext) {
    const agent = globalStore.agents.get(exec.agentId) || Array.from(globalStore.agents.values())[0];

    // Stage 1 & 2: Context Assembly & Reasoning
    exec.status = 'REASONING';
    const aiResult = await runAgentReasoningPipeline(exec.request.input, exec.request.domain, agent.name);

    exec.agentReasoning = {
      specialist: agent.name,
      steps: aiResult.reasoningSteps,
    };

    // Stage 3 & 4: Proposal & Evidence
    exec.status = 'PROPOSAL';
    const proposal: Proposal = {
      id: `prop-${Date.now().toString(36)}`,
      type: aiResult.proposal.type,
      summary: aiResult.proposal.summary,
      targetResource: aiResult.proposal.targetResource,
      requestedAction: aiResult.proposal.requestedAction,
      parameters: aiResult.proposal.parameters,
      expectedImpact: aiResult.proposal.expectedImpact,
      riskScore: aiResult.proposal.riskScore,
      confidence: aiResult.proposal.confidence,
      proposingAgentId: agent.id,
    };
    exec.proposal = proposal;

    exec.evidence = aiResult.evidence.map((e, idx) => ({
      id: `evi-${Date.now()}-${idx}`,
      type: e.type,
      source: e.source,
      claim: e.claim,
      confidence: e.confidence,
      verified: e.verified,
      timestamp: new Date().toISOString(),
      rawPayload: e.rawPayload,
      provenanceTrail: e.provenanceTrail,
    }));

    // Stage 5 & 6: Verification
    exec.status = 'VERIFICATION';
    const avgConfidence =
      exec.evidence.length > 0
        ? Math.round(exec.evidence.reduce((acc, ev) => acc + ev.confidence, 0) / exec.evidence.length)
        : proposal.confidence;

    exec.verification = {
      status: avgConfidence >= 80 ? 'VERIFIED' : 'UNCERTAIN',
      checks: [
        {
          checkName: 'Evidence Calibration & Source Provenance',
          passed: avgConfidence >= 80,
          details: `Average evidence confidence: ${avgConfidence}%`,
        },
        {
          checkName: 'Deterministic Security Invariant Bounds',
          passed: proposal.riskScore < 95,
          details: `Calculated proposal risk score: ${proposal.riskScore}/100`,
        },
      ],
      confidence: avgConfidence,
      riskScore: proposal.riskScore,
    };

    // Stage 7 & 8: Policy Gate Decision (ALLOW / DENY / ESCALATE)
    exec.status = 'POLICY_GATE';
    const activeRules = Array.from(globalStore.policyRules.values());
    const policyDecision = PolicyGateEngine.evaluate(proposal, exec.evidence, activeRules, 'OPERATOR');
    exec.policyDecision = policyDecision;

    // Stage 9 & 10: Authorization, Execution, and Ledger Event
    if (policyDecision.outcome === 'ALLOW') {
      exec.status = 'EXECUTING';
      exec.authorization = {
        authorized: true,
        authorizer: 'Deterministic Policy Gate Kernel',
        method: 'AUTOMATIC_POLICY',
        timestamp: new Date().toISOString(),
      };

      const eventId = `EVT-${Date.now()}-EXEC-OK`;
      const txHash = `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`;

      exec.executionResult = {
        success: true,
        output: {
          executedAction: proposal.requestedAction,
          targetResource: proposal.targetResource,
          status: 'SUCCESSFULLY_APPLIED',
          appliedAt: new Date().toISOString(),
        },
        sideEffects: [
          `State mutation successfully committed to ${proposal.targetResource}`,
          `Updated telemetry streams and runtime cache`,
        ],
        durationMs: Math.floor(25 + Math.random() * 80),
        canonicalEventId: eventId,
      };

      exec.receipt = {
        txHash,
        eventId,
        executedAt: new Date().toISOString(),
        durationMs: exec.executionResult.durationMs,
      };

      exec.status = 'COMPLETED';

      // Commit canonical event to ledger
      globalStore.appendEvent({
        id: eventId,
        name: 'AuthorizedProposalExecuted',
        type: 'EXECUTION_COMPLETED',
        timestamp: new Date().toISOString(),
        actor: { id: exec.actorId, name: 'Factory Operator Console', role: 'OPERATOR' },
        agentId: exec.agentId,
        executionId: exec.executionId,
        traceId: exec.traceId,
        causation: 'POLICY_GATE_ALLOW',
        correlation: 'PIPELINE_RUNNER',
        provenance: {
          source: 'Factory Execution Engine',
          confidence: avgConfidence,
          chain: ['Proposal', 'Verification[PASSED]', 'PolicyGate[ALLOW]', 'AuthorizedExecution'],
        },
        payload: {
          proposalSummary: proposal.summary,
          requestedAction: proposal.requestedAction,
          receiptHash: txHash,
        },
      });

      // Commit to Memory
      const newMemId = `mem-${Date.now().toString(36)}`;
      globalStore.memory.set(newMemId, {
        id: newMemId,
        type: 'MEMORY',
        content: `Execution ${exec.executionId} completed: ${proposal.summary}`,
        source: `Canonical Event Ledger ${eventId}`,
        provenance: {
          sourceId: eventId,
          traceId: exec.traceId,
          chain: ['Proposal', 'PolicyGate[ALLOW]', 'Execution', 'EventCommit'],
        },
        timestamp: new Date().toISOString(),
        confidence: 100,
        relevance: 95,
        associatedAgentId: exec.agentId,
        associatedExecutionId: exec.executionId,
        associatedEventId: eventId,
        tags: ['execution', 'completed', proposal.type.toLowerCase()],
      });
    } else if (policyDecision.outcome === 'ESCALATE') {
      exec.status = 'ESCALATED';

      const approvalId = `APP-${Math.floor(1000 + Math.random() * 9000)}`;
      const approvalRequest: ApprovalRequest = {
        id: approvalId,
        executionId: exec.executionId,
        agentId: exec.agentId,
        agentName: agent.name,
        proposal,
        evidence: exec.evidence,
        riskScore: proposal.riskScore,
        confidence: avgConfidence,
        policyName: policyDecision.appliedPolicies.find((p) => p.effect === 'ESCALATE')?.policyName || 'Human Review Required',
        requestedCapability: exec.capabilityId,
        requestedAction: proposal.requestedAction,
        timestamp: new Date().toISOString(),
        status: 'PENDING',
      };
      globalStore.approvals.set(approvalId, approvalRequest);

      // Record Escalation Event on Ledger
      globalStore.appendEvent({
        id: `EVT-${Date.now()}-ESCALATE`,
        name: 'ExecutionEscalatedToHumanQueue',
        type: 'ESCALATION_TRIGGERED',
        timestamp: new Date().toISOString(),
        actor: { id: 'act-sec-gate', name: 'Factory Policy Gate', role: 'SYSTEM' },
        agentId: exec.agentId,
        executionId: exec.executionId,
        traceId: exec.traceId,
        causation: 'POLICY_GATE_ESCALATE',
        correlation: 'PIPELINE_RUNNER',
        provenance: {
          source: 'Factory Policy Gate Kernel',
          confidence: avgConfidence,
          chain: ['Proposal', 'RiskScoring', 'PolicyGate[ESCALATE]'],
        },
        payload: {
          approvalRequestId: approvalId,
          reason: policyDecision.reason,
          riskScore: proposal.riskScore,
        },
      });
    } else {
      exec.status = 'DENIED';
      exec.authorization = {
        authorized: false,
        authorizer: 'Deterministic Policy Gate Kernel',
        method: 'AUTOMATIC_POLICY',
        timestamp: new Date().toISOString(),
      };

      // Record Denied Event on Ledger
      globalStore.appendEvent({
        id: `EVT-${Date.now()}-DENIED`,
        name: 'ExecutionDeniedByPolicyGate',
        type: 'POLICY_DECISION',
        timestamp: new Date().toISOString(),
        actor: { id: 'act-sec-gate', name: 'Factory Policy Gate', role: 'SYSTEM' },
        agentId: exec.agentId,
        executionId: exec.executionId,
        traceId: exec.traceId,
        causation: 'POLICY_GATE_DENY',
        correlation: 'PIPELINE_RUNNER',
        provenance: {
          source: 'Factory Policy Gate Kernel',
          confidence: avgConfidence,
          chain: ['Proposal', 'PolicyRuleViolation', 'PolicyGate[DENY]'],
        },
        payload: {
          reason: policyDecision.reason,
          riskScore: proposal.riskScore,
        },
      });
    }
  }

  app.post('/api/executions', async (req, res) => {
    try {
      const { input, agentId, domain, autoRun } = req.body;
      const executionId = `EX-${Math.floor(1000 + Math.random() * 9000)}`;
      const traceId = `trc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const selectedAgentId = agentId || 'agent-supervisor';
      const agent = globalStore.agents.get(selectedAgentId) || Array.from(globalStore.agents.values())[0];

      const newExec: ExecutionContext = {
        executionId,
        traceId,
        actorId: 'act-operator-ui',
        agentId: agent.id,
        capabilityId: agent.tools[0] || 'tool-context-assembler',
        timestamp: new Date().toISOString(),
        mode: globalStore.mode,
        status: 'PENDING',
        request: {
          input: input || 'Analyze system telemetry and optimize active cluster parameters.',
          contextSnapshot: { submittedAt: new Date().toISOString() },
          intent: 'OPERATOR_SUBMITTED_TASK',
          domain: domain || agent.type,
        },
        context: {
          memoryRecords: Array.from(globalStore.memory.values()).slice(0, 3),
          activeRules: Array.from(globalStore.policyRules.values()),
          systemState: { runtimeMode: globalStore.mode, activeAgents: globalStore.agents.size },
        },
        agentReasoning: {
          specialist: agent.name,
          steps: [],
        },
        evidence: [],
        verification: {
          status: 'UNCERTAIN',
          checks: [],
          confidence: 0,
          riskScore: 0,
        },
      };

      globalStore.executions.set(executionId, newExec);

      // Record Execution Started Event
      globalStore.appendEvent({
        id: `EVT-${Date.now()}-EXEC-START`,
        name: 'ExecutionPipelineInitiated',
        type: 'EXECUTION_STARTED',
        timestamp: new Date().toISOString(),
        actor: { id: 'act-operator-ui', name: 'Factory Operator Console', role: 'OPERATOR' },
        agentId: agent.id,
        executionId,
        traceId,
        causation: 'USER_SUBMITTED_TASK',
        correlation: 'PIPELINE_RUNNER',
        provenance: {
          source: 'Factory Pipeline Dispatcher',
          confidence: 100,
          chain: ['Operator Input', 'Context Dispatcher', 'Agent Assignment'],
        },
        payload: {
          requestInput: newExec.request.input,
          assignedAgent: agent.name,
          runtimeMode: globalStore.mode,
        },
      });

      if (autoRun !== false) {
        await executePipeline(newExec);
      }

      res.json({ status: 'ok', data: newExec });
    } catch (err: any) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  app.post('/api/executions/:id/run-pipeline', async (req, res) => {
    const ex = globalStore.executions.get(req.params.id);
    if (!ex) return res.status(404).json({ status: 'error', error: 'Execution not found' });
    await executePipeline(ex);
    res.json({ status: 'ok', data: ex });
  });

  // 3. Event Ledger API
  const getLedgerHandler = (req: express.Request, res: express.Response) => {
    const { type, limit } = req.query;
    let events = [...globalStore.events];
    if (type) {
      events = events.filter((e) => e.type === type);
    }
    events.reverse();
    if (limit) {
      events = events.slice(0, parseInt(limit as string, 10));
    }
    res.json({ status: 'ok', data: events });
  };
  app.get('/api/events', getLedgerHandler);
  app.get('/api/ledger', getLedgerHandler);

  const verifyLedgerHandler = (req: express.Request, res: express.Response) => {
    const result = globalStore.verifyLedgerIntegrity();
    res.json({ status: 'ok', data: result });
  };
  app.get('/api/events/verify/integrity', verifyLedgerHandler);
  app.post('/api/events/verify/integrity', verifyLedgerHandler);
  app.post('/api/ledger/verify', verifyLedgerHandler);

  const simulateTamperHandler = (req: express.Request, res: express.Response) => {
    const result = globalStore.simulateTamper();
    res.json({ status: 'ok', data: result });
  };
  app.post('/api/events/simulate-tamper', simulateTamperHandler);
  app.post('/api/ledger/simulate-tamper', simulateTamperHandler);

  const restoreLedgerHandler = (req: express.Request, res: express.Response) => {
    const ok = globalStore.restoreLedger();
    res.json({ status: 'ok', data: { success: ok } });
  };
  app.post('/api/events/restore', restoreLedgerHandler);
  app.post('/api/ledger/restore', restoreLedgerHandler);

  // 4. Policy Gate & Rules API
  const getPoliciesHandler = (req: express.Request, res: express.Response) => {
    res.json({ status: 'ok', data: Array.from(globalStore.policyRules.values()) });
  };
  app.get('/api/policies', getPoliciesHandler);
  app.get('/api/policy/rules', getPoliciesHandler);

  const postPolicyHandler = (req: express.Request, res: express.Response) => {
    const rule: PolicyRule = req.body;
    if (!rule.id) rule.id = `rule-${Date.now().toString(36)}`;
    globalStore.policyRules.set(rule.id, rule);
    res.json({ status: 'ok', data: rule });
  };
  app.post('/api/policies', postPolicyHandler);
  app.post('/api/policy/rules', postPolicyHandler);

  const testPolicyHandler = (req: express.Request, res: express.Response) => {
    const { proposal, evidence, actorRole } = req.body;
    const activeRules = Array.from(globalStore.policyRules.values());
    const decision = PolicyGateEngine.evaluate(proposal, evidence || [], activeRules, actorRole || 'OPERATOR');
    res.json({ status: 'ok', data: decision });
  };
  app.post('/api/policies/test', testPolicyHandler);
  app.post('/api/policy/evaluate', testPolicyHandler);

  // 5. Human-in-the-Loop Approvals API
  app.get('/api/approvals', (req, res) => {
    const approvals = Array.from(globalStore.approvals.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    res.json({ status: 'ok', data: approvals });
  });

  const reviewApprovalHandler = (req: express.Request, res: express.Response) => {
    const { action, decision: bodyDecision, notes, reviewer, operator } = req.body;
    const resolvedAction = action || bodyDecision;
    const approval = globalStore.approvals.get(req.params.id);
    if (!approval) return res.status(404).json({ status: 'error', error: 'Approval request not found' });

    approval.status = resolvedAction === 'APPROVE' || resolvedAction === 'APPROVED' ? 'APPROVED' : resolvedAction === 'DENY' || resolvedAction === 'DENIED' ? 'DENIED' : 'MORE_EVIDENCE_REQUESTED';
    approval.reviewer = reviewer || operator || 'Sovereign Operations Director';
    approval.reviewerNotes = notes || 'Reviewed against governance compliance mandates.';
    approval.reviewedAt = new Date().toISOString();

    const exec = globalStore.executions.get(approval.executionId);

    if (approval.status === 'APPROVED') {
      const eventId = `EVT-${Date.now()}-HUMAN-APP`;
      const txHash = `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`;

      if (exec) {
        exec.status = 'COMPLETED';
        exec.authorization = {
          authorized: true,
          authorizer: approval.reviewer,
          method: 'HUMAN_APPROVAL',
          timestamp: approval.reviewedAt,
        };
        exec.executionResult = {
          success: true,
          output: {
            approvedAction: approval.requestedAction,
            status: 'EXECUTED_UPON_HUMAN_SIGN_OFF',
            notes: approval.reviewerNotes,
          },
          sideEffects: [`Authorized action successfully executed: ${approval.proposal.summary}`],
          durationMs: 420,
          canonicalEventId: eventId,
        };
        exec.receipt = {
          txHash,
          eventId,
          executedAt: approval.reviewedAt,
          durationMs: 420,
        };
      }

      globalStore.appendEvent({
        id: eventId,
        name: 'HumanApprovalGrantedAndExecuted',
        type: 'HUMAN_APPROVAL',
        timestamp: new Date().toISOString(),
        actor: { id: 'act-human-director', name: approval.reviewer, role: 'SECURITY_ADMIN' },
        agentId: approval.agentId,
        executionId: approval.executionId,
        traceId: exec?.traceId || `trc-app-${approval.id}`,
        causation: 'HUMAN_OPERATOR_SIGN_OFF',
        correlation: 'APPROVAL_WORKFLOW',
        provenance: {
          source: 'Human-in-the-Loop Operator Console',
          confidence: 100,
          chain: [`ApprovalRequest#${approval.id}`, 'MFA Authorization Verified', 'AuthorizedExecutionCommit'],
        },
        payload: {
          approvalId: approval.id,
          decision: 'APPROVED',
          reviewerNotes: approval.reviewerNotes,
          receiptHash: txHash,
        },
      });
    } else if (approval.status === 'DENIED') {
      if (exec) {
        exec.status = 'DENIED';
        exec.authorization = {
          authorized: false,
          authorizer: approval.reviewer,
          method: 'HUMAN_APPROVAL',
          timestamp: approval.reviewedAt,
        };
      }

      globalStore.appendEvent({
        id: `EVT-${Date.now()}-HUMAN-DENIED`,
        name: 'HumanApprovalDenied',
        type: 'HUMAN_APPROVAL',
        timestamp: new Date().toISOString(),
        actor: { id: 'act-human-director', name: approval.reviewer, role: 'SECURITY_ADMIN' },
        agentId: approval.agentId,
        executionId: approval.executionId,
        traceId: exec?.traceId || `trc-app-${approval.id}`,
        causation: 'HUMAN_OPERATOR_REJECTION',
        correlation: 'APPROVAL_WORKFLOW',
        provenance: {
          source: 'Human-in-the-Loop Operator Console',
          confidence: 100,
          chain: [`ApprovalRequest#${approval.id}`, 'Human Review Decision[DENIED]'],
        },
        payload: {
          approvalId: approval.id,
          decision: 'DENIED',
          reviewerNotes: approval.reviewerNotes,
        },
      });
    }

    res.json({ status: 'ok', data: approval });
  };
  app.post('/api/approvals/:id/resolve', reviewApprovalHandler);
  app.post('/api/approvals/:id/review', reviewApprovalHandler);

  // 6. Agents Registry API
  app.get('/api/agents', (req, res) => {
    res.json({ status: 'ok', data: Array.from(globalStore.agents.values()) });
  });

  app.get('/api/agents/:id', (req, res) => {
    const ag = globalStore.agents.get(req.params.id);
    if (!ag) return res.status(404).json({ status: 'error', error: 'Agent not found' });
    res.json({ status: 'ok', data: ag });
  });

  // 7. Memory & Context API
  app.get('/api/memory', (req, res) => {
    const { type, query } = req.query;
    let memories = Array.from(globalStore.memory.values());
    if (type) {
      memories = memories.filter((m) => m.type === type);
    }
    if (query) {
      const q = (query as string).toLowerCase();
      memories = memories.filter(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          m.source.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    res.json({ status: 'ok', data: memories });
  });

  app.post('/api/memory', (req, res) => {
    const mem = req.body;
    if (!mem.id) mem.id = `mem-${Date.now().toString(36)}`;
    mem.timestamp = new Date().toISOString();
    globalStore.memory.set(mem.id, mem);
    res.json({ status: 'ok', data: mem });
  });

  // 8. Arbitration API
  app.get('/api/arbitration', (req, res) => {
    res.json({ status: 'ok', data: Array.from(globalStore.arbitrationCases.values()) });
  });

  app.post('/api/arbitration', (req, res) => {
    const { topic, executionId } = req.body;
    const arbCase: any = {
      id: `arb-case-${Date.now().toString(36)}`,
      executionId: executionId || 'EX-9102',
      topic: topic || 'Autonomous Workload Dispatch Dispute',
      participatingAgents: [
        {
          agentId: 'agent-infra-ops',
          name: 'Infrastructure & Grid Specialist',
          assessment: 'Optimizes for minimum electrical load and zero thermal hazard.',
          confidence: 93,
          risk: 25,
          evidence: ['Grid telemetry 94% loaded', 'Thermal sensor cluster B at 65°C'],
        },
        {
          agentId: 'agent-financial-risk',
          name: 'FinSight Risk & Capital Evaluator',
          assessment: 'Evaluates SLA penalty impacts and recommends staggered dispatch.',
          confidence: 91,
          risk: 45,
          evidence: ['Client contractual penalty curve', 'Energy spot price profile'],
        },
      ],
      disagreements: [
        'Infrastructure specialist prioritizes safety bounds over cost.',
        'Financial specialist highlights off-peak price arbitrage.',
      ],
      selectedAssessment: 'Balanced staged ramp: 15-minute staggered dispatch satisfying both thermal bounds and budget limits.',
      arbitrationResult: 'Consensus achieved on staged dispatch schedule.',
      arbitratorAgentId: 'agent-supervisor',
      policyImpact: 'Passed to Policy Gate with ALLOW condition under staged profile.',
      timestamp: new Date().toISOString(),
    };
    globalStore.arbitrationCases.set(arbCase.id, arbCase);
    res.json({ status: 'ok', data: arbCase });
  });

  // 9. Simulation Environment API (Zero live side effects)
  const simulationHandler = async (req: express.Request, res: express.Response) => {
    const { scenarioTitle, hypotheticalObservation, targetAgentId } = req.body;
    const agent = globalStore.agents.get(targetAgentId || 'agent-infra-ops') || Array.from(globalStore.agents.values())[0];

    const aiResult = await runAgentReasoningPipeline(
      hypotheticalObservation || 'Simulate complete regional grid blackout lasting 45 minutes.',
      agent.type,
      agent.name
    );

    const activeRules = Array.from(globalStore.policyRules.values());
    const mockProposal: Proposal = {
      id: `sim-prop-${Date.now().toString(36)}`,
      type: aiResult.proposal.type,
      summary: `[SIMULATION ONLY] ${aiResult.proposal.summary}`,
      targetResource: aiResult.proposal.targetResource,
      requestedAction: aiResult.proposal.requestedAction,
      parameters: aiResult.proposal.parameters,
      expectedImpact: `[SIMULATED] ${aiResult.proposal.expectedImpact}`,
      riskScore: aiResult.proposal.riskScore,
      confidence: aiResult.proposal.confidence,
      proposingAgentId: agent.id,
    };

    const mockEvidence: Evidence[] = aiResult.evidence.map((e, i) => ({
      id: `sim-evi-${i}`,
      type: e.type,
      source: `[SIMULATED SOURCE] ${e.source}`,
      claim: e.claim,
      confidence: e.confidence,
      verified: e.verified,
      timestamp: new Date().toISOString(),
      rawPayload: e.rawPayload,
      provenanceTrail: ['Scenario Generator', 'Hypothetical Observation', agent.name],
    }));

    const policyDecision = PolicyGateEngine.evaluate(mockProposal, mockEvidence, activeRules, 'OPERATOR');

    res.json({
      status: 'ok',
      data: {
        scenarioTitle: scenarioTitle || 'Hypothetical Grid Stress Test',
        mode: 'SIMULATION',
        isIsolatedFromLive: true,
        hypotheticalObservation,
        agentName: agent.name,
        reasoningSteps: aiResult.reasoningSteps,
        simulatedProposal: mockProposal,
        simulatedEvidence: mockEvidence,
        simulatedPolicyDecision: policyDecision,
        projectedEvents: [
          {
            name: 'ProjectedLoadCurtailmentEvent',
            expectedTimestamp: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
            estimatedImpact: 'Reduces demand by 18.4 MW without client disconnection',
          },
        ],
      },
    });
  };
  app.post('/api/simulation', simulationHandler);
  app.post('/api/simulation/run', simulationHandler);

  // 10. Replay & Recovery API
  app.post('/api/replay/execution/:id', (req, res) => {
    const ex = globalStore.executions.get(req.params.id);
    if (!ex) return res.status(404).json({ status: 'error', error: 'Execution not found for replay' });

    const executionEvents = globalStore.events.filter((e) => e.executionId === ex.executionId);
    const integrityCheck = globalStore.verifyLedgerIntegrity();

    res.json({
      status: 'ok',
      data: {
        executionId: ex.executionId,
        mode: 'REPLAY',
        diverged: false,
        reconstructedState: {
          status: ex.status,
          request: ex.request,
          proposal: ex.proposal,
          policyDecision: ex.policyDecision,
          authorization: ex.authorization,
          executionResult: ex.executionResult,
        },
        eventSequence: executionEvents,
        ledgerIntegrityAtReplay: integrityCheck.isValid ? 'VERIFIED_VALID' : 'TAMPER_ALERT',
        replayedAt: new Date().toISOString(),
      },
    });
  });

  // 11. Tools, Providers, Scheduler, Products, Observability, Security
  app.get('/api/tools', (req, res) => {
    res.json({ status: 'ok', data: Array.from(globalStore.tools.values()) });
  });

  app.get('/api/providers', (req, res) => {
    res.json({ status: 'ok', data: Array.from(globalStore.providers.values()) });
  });

  app.get('/api/scheduler', (req, res) => {
    res.json({ status: 'ok', data: Array.from(globalStore.scheduledTasks.values()) });
  });

  app.post('/api/scheduler/:id/toggle', (req, res) => {
    const task = globalStore.scheduledTasks.get(req.params.id);
    if (!task) return res.status(404).json({ status: 'error', error: 'Task not found' });
    task.status = task.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    res.json({ status: 'ok', data: task });
  });

  app.get('/api/products', (req, res) => {
    res.json({ status: 'ok', data: Array.from(globalStore.productIntegrations.values()) });
  });

  app.get('/api/observability', (req, res) => {
    res.json({
      status: 'ok',
      data: {
        telemetry: [
          { time: '10:00', latencyMs: 42, eventRate: 14, memoryOps: 8 },
          { time: '10:15', latencyMs: 58, eventRate: 22, memoryOps: 15 },
          { time: '10:30', latencyMs: 38, eventRate: 18, memoryOps: 12 },
          { time: '10:45', latencyMs: 65, eventRate: 31, memoryOps: 24 },
          { time: '11:00', latencyMs: 44, eventRate: 19, memoryOps: 14 },
          { time: '11:15', latencyMs: 52, eventRate: 28, memoryOps: 20 },
        ],
        totalExecutions: globalStore.executions.size,
        totalEvents: globalStore.events.length,
        averageLatencyMs: 49,
        errorCount: globalStore.errors.length,
        recentErrors: globalStore.errors,
      },
    });
  });

  app.get('/api/security', (req, res) => {
    res.json({
      status: 'ok',
      data: {
        actors: [
          { id: 'act-sec-admin', name: 'Sovereign Root Authority', role: 'SECURITY_ADMIN', status: 'ACTIVE', mfa: 'HARDWARE_KEY' },
          { id: 'act-operator-01', name: 'Fatima Al-Nuaimi', role: 'SECURITY_ADMIN', status: 'ACTIVE', mfa: 'FIDO2_PASSKEY' },
          { id: 'act-compliance', name: 'Compliance Enforcer', role: 'COMPLIANCE_OFFICER', status: 'ACTIVE', mfa: 'MANAGED_CERT' },
          { id: 'act-ops-sys', name: 'Factory Automated Kernel', role: 'SYSTEM', status: 'ACTIVE', mfa: 'INTERNAL_HSM' },
        ],
        capabilitiesMatrix: [
          { capability: 'STATE_MUTATION', allowedRoles: ['OPERATOR', 'SECURITY_ADMIN', 'SYSTEM'], gateRule: 'Max risk < 60' },
          { capability: 'INFRASTRUCTURE_DEPLOY', allowedRoles: ['SECURITY_ADMIN'], gateRule: 'Escalate to human' },
          { capability: 'FINANCIAL_ALLOCATION', allowedRoles: ['SECURITY_ADMIN'], gateRule: 'Dual-custody > $50k' },
          { capability: 'SECURITY_RECONFIGURATION', allowedRoles: ['SECURITY_ADMIN'], gateRule: 'Strict DENY by default' },
        ],
        ledgerIntegrity: globalStore.verifyLedgerIntegrity(),
      },
    });
  });

  // Catch-all 404 for undefined /api/* endpoints
  app.all('/api/*', (req, res) => {
    res.status(404).json({ status: 'error', error: `API route not found: ${req.method} ${req.url}` });
  });

  // ==========================================
  // VITE MIDDLEWARE / SPA SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[THE FACTORY] Control Plane & Runtime API listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
