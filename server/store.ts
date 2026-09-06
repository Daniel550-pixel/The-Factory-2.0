import { calculateEventHash, PolicyGateEngine } from './kernel';
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
  ToolDefinition,
  ProviderDefinition,
  ScheduledTask,
  ProductIntegration,
  ArbitrationCase,
  SystemStatus,
  RuntimeMode,
} from '../src/types';

export class FactoryStore {
  public mode: RuntimeMode = 'LIVE';
  public events: CanonicalEvent[] = [];
  public executions: Map<string, ExecutionContext> = new Map();
  public agents: Map<string, Agent> = new Map();
  public memory: Map<string, MemoryRecord> = new Map();
  public approvals: Map<string, ApprovalRequest> = new Map();
  public policyRules: Map<string, PolicyRule> = new Map();
  public tools: Map<string, ToolDefinition> = new Map();
  public providers: Map<string, ProviderDefinition> = new Map();
  public scheduledTasks: Map<string, ScheduledTask> = new Map();
  public productIntegrations: Map<string, ProductIntegration> = new Map();
  public arbitrationCases: Map<string, ArbitrationCase> = new Map();
  public errors: any[] = [];
  public telemetry: { timestamp: string; latencyMs: number; eventRate: number; memoryOps: number }[] = [];

  constructor() {
    this.seedInitialData();
  }

  public getPreviousHash(): string {
    if (this.events.length === 0) {
      return '0000000000000000000000000000000000000000000000000000000000000000';
    }
    return this.events[this.events.length - 1].currentEventHash;
  }

  public appendEvent(eventData: Omit<CanonicalEvent, 'previousEventHash' | 'currentEventHash' | 'integrityStatus'>): CanonicalEvent {
    const prevHash = this.getPreviousHash();
    const currentHash = calculateEventHash(prevHash, eventData);

    const fullEvent: CanonicalEvent = {
      ...eventData,
      previousEventHash: prevHash,
      currentEventHash: currentHash,
      integrityStatus: 'VALID',
    };

    this.events.push(fullEvent);
    return fullEvent;
  }

  public verifyLedgerIntegrity(): { isValid: boolean; corruptedIndex?: number; expectedHash?: string; actualHash?: string } {
    let prev = '0000000000000000000000000000000000000000000000000000000000000000';
    for (let i = 0; i < this.events.length; i++) {
      const e = this.events[i];
      if (e.previousEventHash !== prev) {
        return { isValid: false, corruptedIndex: i, expectedHash: prev, actualHash: e.previousEventHash };
      }
      const recalculated = calculateEventHash(prev, e);
      if (recalculated !== e.currentEventHash) {
        return { isValid: false, corruptedIndex: i, expectedHash: recalculated, actualHash: e.currentEventHash };
      }
      prev = e.currentEventHash;
    }
    return { isValid: true };
  }

  public simulateTamper(): { success: boolean; tamperedIndex: number } {
    if (this.events.length > 2) {
      const idx = Math.floor(this.events.length / 2);
      this.events[idx].payload = { ...this.events[idx].payload, _unauthorized_mutation: 'TAMPER_INJECTED_FOR_AUDIT_TEST' };
      this.events[idx].integrityStatus = 'TAMPERED';
      return { success: true, tamperedIndex: idx };
    }
    return { success: false, tamperedIndex: -1 };
  }

  public restoreLedger(): boolean {
    // Recompute all hashes cleanly
    let prev = '0000000000000000000000000000000000000000000000000000000000000000';
    for (let i = 0; i < this.events.length; i++) {
      delete this.events[i].payload._unauthorized_mutation;
      this.events[i].previousEventHash = prev;
      this.events[i].currentEventHash = calculateEventHash(prev, this.events[i]);
      this.events[i].integrityStatus = 'VALID';
      prev = this.events[i].currentEventHash;
    }
    return true;
  }

  public getSystemStatus(): SystemStatus {
    const integrity = this.verifyLedgerIntegrity();
    let allowCount = 0;
    let denyCount = 0;
    let escalateCount = 0;

    for (const ex of this.executions.values()) {
      if (ex.policyDecision?.outcome === 'ALLOW') allowCount++;
      else if (ex.policyDecision?.outcome === 'DENY') denyCount++;
      else if (ex.policyDecision?.outcome === 'ESCALATE') escalateCount++;
    }

    let activeExec = 0;
    for (const ex of this.executions.values()) {
      if (['PENDING', 'CONTEXT_ASSEMBLY', 'REASONING', 'PROPOSAL', 'VERIFICATION', 'POLICY_GATE', 'EXECUTING'].includes(ex.status)) {
        activeExec++;
      }
    }

    let pendingAppr = 0;
    for (const ap of this.approvals.values()) {
      if (ap.status === 'PENDING') pendingAppr++;
    }

    let activeAg = 0;
    for (const ag of this.agents.values()) {
      if (ag.status === 'ACTIVE' || ag.status === 'BUSY') activeAg++;
    }

    return {
      runtimeStatus: integrity.isValid ? 'OPERATIONAL' : 'DEGRADED',
      runtimeMode: this.mode,
      ledgerIntegrity: integrity.isValid ? 'VERIFIED' : 'TAMPER_DETECTED',
      totalEvents: this.events.length,
      activeAgents: activeAg,
      activeExecutions: activeExec,
      pendingApprovals: pendingAppr,
      policyStats: {
        allow: allowCount,
        deny: denyCount,
        escalate: escalateCount,
      },
      totalFailures: this.errors.length,
      totalMemoryRecords: this.memory.size,
      provenanceIntegrityPct: 99.8,
      securityState: integrity.isValid ? 'ENFORCED' : 'ALERT',
      lastIntegrityCheck: new Date().toISOString(),
    };
  }

  private seedInitialData() {
    // 1. Policy Rules
    const defaultRules: PolicyRule[] = [
      {
        id: 'rule-sec-01',
        name: 'Deterministic Core Invariant: AI Cannot Execute Without Gate',
        description: 'Enforces that AI reasoning output remains a proposal until validated by Policy Gate.',
        capabilityTarget: '*',
        maxRiskScore: 80,
        minConfidence: 70,
        requiresHumanEscalation: true,
        isDeterministic: true,
        action: 'ALLOW',
      },
      {
        id: 'rule-fin-02',
        name: 'High-Value Financial Allocation Threshold',
        description: 'Financial transactions or capital commitments over $50,000 strictly require dual-custody approval.',
        capabilityTarget: 'FINANCIAL_ALLOCATION',
        maxRiskScore: 40,
        minConfidence: 85,
        requiresHumanEscalation: true,
        isDeterministic: true,
        action: 'ESCALATE',
      },
      {
        id: 'rule-infra-03',
        name: 'Critical Infrastructure & Power Grid Guardrail',
        description: 'Direct modifications to power generation, transmission, or physical assets require human sign-off.',
        capabilityTarget: 'INFRASTRUCTURE_DEPLOY',
        maxRiskScore: 30,
        minConfidence: 90,
        requiresHumanEscalation: true,
        isDeterministic: true,
        action: 'ESCALATE',
      },
      {
        id: 'rule-sec-04',
        name: 'Strict Root Policy & Cryptographic Key Protection',
        description: 'Any modification to root access policies, ledger hashes, or authorization tables is strictly prohibited by default.',
        capabilityTarget: 'SECURITY_RECONFIGURATION',
        maxRiskScore: 10,
        minConfidence: 95,
        requiresHumanEscalation: true,
        isDeterministic: true,
        action: 'DENY',
      },
      {
        id: 'rule-tool-05',
        name: 'Standard Read & Analysis Ingestion',
        description: 'Low-risk read queries, telemetry ingestion, and simulation scenarios pass with automatic authorization.',
        capabilityTarget: 'STATE_MUTATION',
        maxRiskScore: 60,
        minConfidence: 75,
        requiresHumanEscalation: false,
        isDeterministic: true,
        action: 'ALLOW',
      },
    ];
    defaultRules.forEach((r) => this.policyRules.set(r.id, r));

    // 2. Agents Registry
    const defaultAgents: Agent[] = [
      {
        id: 'agent-supervisor',
        name: 'Chief Orchestrator Agent',
        description: 'Deconstructs incoming intents, assigns domain specialists, synthesizes proposals, and enforces execution boundaries.',
        type: 'SUPERVISOR',
        status: 'ACTIVE',
        capabilities: ['INTENT_DECOMPOSITION', 'SPECIALIST_DISPATCH', 'PROPOSAL_SYNTHESIS', 'CONTEXT_ASSEMBLY'],
        tools: ['tool-context-assembler', 'tool-agent-arbiter'],
        modelProvider: 'Google Gemini 2.5 Pro / Server-Side',
        confidence: 96,
        riskProfile: 'LOW',
        currentTask: 'Monitoring multi-agent runtime pipelines',
        executionsCount: 142,
        performanceScore: 99.4,
        permissions: ['READ_CONTEXT', 'DISPATCH_AGENTS', 'PROPOSE_EXECUTION'],
        lastActivity: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      },
      {
        id: 'agent-infra-ops',
        name: 'Infrastructure & Grid Specialist',
        description: 'Monitors power distribution, compute clusters, serverless nodes, and physical telemetry across UAE sites.',
        type: 'INFRASTRUCTURE_OPS',
        status: 'ACTIVE',
        capabilities: ['TELEMETRY_ANALYSIS', 'CAPACITY_PROJECTION', 'GRID_LOAD_OPTIMIZATION'],
        tools: ['tool-telemetry-ingest', 'tool-cluster-scale'],
        modelProvider: 'Google Gemini 2.5 Flash / Server-Side',
        confidence: 92,
        riskProfile: 'MEDIUM',
        currentTask: 'Evaluating thermal telemetry at Dubai South DC-2',
        executionsCount: 89,
        performanceScore: 98.1,
        permissions: ['READ_TELEMETRY', 'PROPOSE_SCALE'],
        lastActivity: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: 'agent-security-officer',
        name: 'Security & Deterministic Verifier',
        description: 'Validates cryptographic proofs, audits evidence provenance, and checks deterministic policy constraints.',
        type: 'SECURITY_OFFICER',
        status: 'ACTIVE',
        capabilities: ['PROVENANCE_VERIFICATION', 'SIGNATURE_CHECK', 'POLICY_AUDITING', 'TAMPER_DETECTION'],
        tools: ['tool-ledger-verifier', 'tool-policy-evaluator'],
        modelProvider: 'Deterministic Kernel Engine + Gemini Guardrail',
        confidence: 99,
        riskProfile: 'STRICT',
        currentTask: 'Continuously verifying SHA-256 ledger integrity',
        executionsCount: 310,
        performanceScore: 100.0,
        permissions: ['READ_LEDGER', 'RUN_VERIFICATION', 'FLAG_TAMPER'],
        lastActivity: new Date(Date.now() - 1000 * 30).toISOString(),
      },
      {
        id: 'agent-financial-risk',
        name: 'FinSight Risk & Capital Evaluator',
        description: 'Analyzes liquidity, budget limits, contractual commitments, and cross-border currency exposure.',
        type: 'FINANCIAL_RISK',
        status: 'IDLE',
        capabilities: ['CAPITAL_RISK_SCORING', 'BUDGET_AUDITING', 'ROI_PROJECTION'],
        tools: ['tool-market-stream', 'tool-treasury-ledger'],
        modelProvider: 'Google Gemini 2.5 Pro / Server-Side',
        confidence: 94,
        riskProfile: 'STRICT',
        executionsCount: 64,
        performanceScore: 97.8,
        permissions: ['READ_FINANCIALS', 'PROPOSE_ALLOCATION'],
        lastActivity: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      },
      {
        id: 'agent-logistics-geo',
        name: 'Geospatial & Supply Chain Analyst',
        description: 'Evaluates freight routes, port dwell times, customs throughput, and geographical bottlenecks across Jebel Ali and Khalifa Port.',
        type: 'LOGISTICS_GEO',
        status: 'ACTIVE',
        capabilities: ['ROUTE_OPTIMIZATION', 'PORT_DWELL_FORECAST', 'GEOSPATIAL_SELECTION'],
        tools: ['tool-geo-spatial-query', 'tool-customs-feed'],
        modelProvider: 'Google Gemini 2.5 Flash / Server-Side',
        confidence: 91,
        riskProfile: 'MEDIUM',
        currentTask: 'Analyzing Jebel Ali Berth 4 container congestion',
        executionsCount: 118,
        performanceScore: 98.6,
        permissions: ['READ_GEO_TELEMETRY', 'PROPOSE_DISPATCH'],
        lastActivity: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      },
      {
        id: 'agent-compliance',
        name: 'Regulatory & Sovereign Governance Agent',
        description: 'Ensures full compliance with UAE sovereign data residency laws, regulatory mandates, and audit trails.',
        type: 'COMPLIANCE',
        status: 'ACTIVE',
        capabilities: ['SOVEREIGNTY_CHECK', 'RESIDENCY_VERIFICATION', 'AUDIT_COMPLIANCE'],
        tools: ['tool-compliance-rules', 'tool-audit-exporter'],
        modelProvider: 'Deterministic Rules + Gemini 2.5 Pro',
        confidence: 98,
        riskProfile: 'STRICT',
        executionsCount: 204,
        performanceScore: 99.8,
        permissions: ['READ_AUDIT', 'ENFORCE_SOVEREIGNTY'],
        lastActivity: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      },
    ];
    defaultAgents.forEach((a) => this.agents.set(a.id, a));

    // 3. Tools Registry
    const defaultTools: ToolDefinition[] = [
      {
        id: 'tool-context-assembler',
        name: 'Context Assembly Engine',
        description: 'Fetches relevant provenance records, memory vectors, and active policy rules for an execution context.',
        capabilities: ['VECTOR_SEARCH', 'GRAPH_EXPANSION', 'TOKEN_BUDGETING'],
        riskLevel: 'LOW',
        requiredPermissions: ['READ_CONTEXT'],
        executionMode: 'LOCAL_KERNEL',
        status: 'AVAILABLE',
        owningAgentId: 'agent-supervisor',
        auditStatus: 'COMPLIANT',
        invocationCount: 1420,
      },
      {
        id: 'tool-telemetry-ingest',
        name: 'Industrial Sensor & SCADA Ingestion',
        description: 'Ingests high-frequency telemetry streams from UAE datacenter chillers, power distribution units, and grid interconnects.',
        capabilities: ['STREAM_READ', 'ANOMALY_FILTER', 'TIME_SERIES_AGG'],
        riskLevel: 'LOW',
        requiredPermissions: ['READ_TELEMETRY'],
        executionMode: 'API_GATEWAY',
        status: 'AVAILABLE',
        owningAgentId: 'agent-infra-ops',
        auditStatus: 'COMPLIANT',
        invocationCount: 8930,
      },
      {
        id: 'tool-cluster-scale',
        name: 'Autonomous Cluster Reallocator',
        description: 'Proposes and initiates compute cluster scaling, GPU pod migrations, and dynamic cooling adjustments.',
        capabilities: ['POD_MIGRATE', 'POWER_REDUCE', 'NODE_DRAIN'],
        riskLevel: 'HIGH',
        requiredPermissions: ['PROPOSE_SCALE', 'EXECUTE_SCALE'],
        executionMode: 'SANDBOXED',
        status: 'RESTRICTED',
        owningAgentId: 'agent-infra-ops',
        auditStatus: 'NEEDS_REVIEW',
        invocationCount: 42,
      },
      {
        id: 'tool-ledger-verifier',
        name: 'Cryptographic SHA-256 Ledger Verifier',
        description: 'Iterates through the canonical event ledger, verifying parent hash integrity and block state continuity.',
        capabilities: ['HASH_VERIFICATION', 'CHAIN_INTEGRITY', 'TAMPER_LOCALIZATION'],
        riskLevel: 'LOW',
        requiredPermissions: ['READ_LEDGER'],
        executionMode: 'LOCAL_KERNEL',
        status: 'AVAILABLE',
        owningAgentId: 'agent-security-officer',
        auditStatus: 'COMPLIANT',
        invocationCount: 512,
      },
      {
        id: 'tool-policy-evaluator',
        name: 'Deterministic Policy Gate Kernel',
        description: 'Evaluates execution proposals against invariant rules without allowing LLM authority bypass.',
        capabilities: ['DETERMINISTIC_RULES', 'RISK_SCORING', 'ESCALATION_DISPATCH'],
        riskLevel: 'LOW',
        requiredPermissions: ['EVALUATE_POLICY'],
        executionMode: 'LOCAL_KERNEL',
        status: 'AVAILABLE',
        owningAgentId: 'agent-security-officer',
        auditStatus: 'COMPLIANT',
        invocationCount: 840,
      },
      {
        id: 'tool-treasury-ledger',
        name: 'Sovereign Treasury Settlement Adapter',
        description: 'Connects to enterprise banking and escrow smart contracts for authorized financial disbursements.',
        capabilities: ['ESCROW_RELEASE', 'WIRE_SUBMIT', 'LEDGER_RECONCILE'],
        riskLevel: 'CRITICAL',
        requiredPermissions: ['FINANCIAL_DISBURSE'],
        executionMode: 'HOST_ISOLATED',
        status: 'RESTRICTED',
        owningAgentId: 'agent-financial-risk',
        auditStatus: 'COMPLIANT',
        invocationCount: 19,
      },
    ];
    defaultTools.forEach((t) => this.tools.set(t.id, t));

    // 4. Providers Registry
    const defaultProviders: ProviderDefinition[] = [
      {
        id: 'provider-gemini',
        name: 'Google Gemini 2.5 Pro & Flash',
        type: 'GEMINI',
        model: 'gemini-2.5-pro / gemini-2.5-flash',
        availability: 'ONLINE',
        capabilities: ['COMPLEX_REASONING', 'MULTIMODAL_INGESTION', 'STRUCTURED_PROPOSALS', 'FAST_INFERENCE'],
        latencyMs: 380,
        usageRequests: 1420,
        status: 'Server-side integration configured via GEMINI_API_KEY environment variable.',
      },
      {
        id: 'provider-local-kernel',
        name: 'The Factory Deterministic Kernel',
        type: 'LOCAL_KERNEL',
        model: 'Deterministic Rule Engine (TypeScript/Node)',
        availability: 'ONLINE',
        capabilities: ['ZERO_HALLUCINATION_DECISIONS', 'CRYPTO_HASH_CHAIN', 'INVARIANT_ENFORCEMENT'],
        latencyMs: 2,
        usageRequests: 18450,
        status: 'Authoritative in-process execution engine.',
      },
    ];
    defaultProviders.forEach((p) => this.providers.set(p.id, p));

    // 5. Memory Records (Distinguishing RAW OBSERVATION, EVIDENCE, MEMORY, DISTILLED KNOWLEDGE, MODEL OUTPUT)
    const defaultMemories: MemoryRecord[] = [
      {
        id: 'mem-raw-001',
        type: 'RAW_OBSERVATION',
        content: 'Jebel Ali Port sensor array reports 94.2% container yard occupancy on Berth 7.',
        source: 'SCADA Telemetry Feed #994',
        provenance: {
          sourceId: 'src-iot-jebel-ali-07',
          traceId: 'trc-obs-991',
          chain: ['Sensor#77', 'IoT Gateway DXB-04', 'Raw Telemetry Table'],
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        confidence: 99,
        relevance: 95,
        tags: ['logistics', 'jebel_ali', 'raw_sensor'],
      },
      {
        id: 'mem-evi-002',
        type: 'EVIDENCE',
        content: 'Historical throughput comparison confirms Berth 7 dwell time increased by 42% over 72h moving average.',
        source: 'Verified Statistical Aggregation Pipeline',
        provenance: {
          sourceId: 'src-stat-dwell-72h',
          traceId: 'trc-evi-442',
          chain: ['mem-raw-001', 'Time-Series Resampler', 'Deterministic Deviation Model'],
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        confidence: 96,
        relevance: 92,
        tags: ['evidence', 'dwell_time', 'bottleneck'],
      },
      {
        id: 'mem-mod-003',
        type: 'MODEL_OUTPUT',
        content: 'Specialist Agent Logistics proposed rerouting 450 TEU to Khalifa Port Terminal 2.',
        source: 'Agent Reasoning Model (Gemini 2.5 Pro)',
        provenance: {
          sourceId: 'src-agent-logistics-01',
          traceId: 'trc-exec-101',
          chain: ['mem-evi-002', 'agent-logistics-geo', 'Heuristic Rerouting Strategy'],
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        confidence: 89,
        relevance: 88,
        tags: ['model_output', 'proposal', 'unverified_ai'],
      },
      {
        id: 'mem-dist-004',
        type: 'DISTILLED_KNOWLEDGE',
        content: 'Customs clearance buffer at Khalifa Port T2 requires minimum 4.5 hours pre-arrival manifest transmission.',
        source: 'Sovereign Port Authority Operating Standard v3.4',
        provenance: {
          sourceId: 'src-sovereign-regs-dxb',
          traceId: 'trc-rule-910',
          chain: ['Federal Customs Authority Directive 2026', 'Compliance Knowledge Distiller'],
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
        confidence: 100,
        relevance: 98,
        tags: ['distilled_knowledge', 'customs', 'rules'],
      },
      {
        id: 'mem-mem-005',
        type: 'MEMORY',
        content: 'Execution EX-8821 committed automatic dispatch of 120 zero-emission autonomous trucks after Policy Gate ALLOW.',
        source: 'Canonical Event Ledger Event #EVT-4820',
        provenance: {
          sourceId: 'src-ledger-evt-4820',
          traceId: 'trc-exec-8821',
          chain: ['Proposal#4820', 'PolicyGate[ALLOW]', 'AuthorizedExecution', 'EventLedgerCommit'],
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        confidence: 100,
        relevance: 94,
        associatedExecutionId: 'EX-8821',
        associatedEventId: 'EVT-4820',
        tags: ['committed_memory', 'canonical_event', 'execution_record'],
      },
    ];
    defaultMemories.forEach((m) => this.memory.set(m.id, m));

    // 6. Product Integrations (Domain neutral kernel with actual adapters)
    const defaultProducts: ProductIntegration[] = [
      {
        id: 'prod-bitminer',
        name: 'BitMiner AI',
        adapter: 'BitMinerRuntimeAdapter',
        status: 'CONNECTED',
        capabilities: ['HASHRATE_BALANCING', 'SUBSTATION_DYNAMIC_CURTAILMENT', 'THERMAL_PROJECTION'],
        eventsCount: 1420,
        executionsCount: 198,
        health: 'HEALTHY',
        connectionState: 'Active TLS 1.3 socket over UAE Sovereign Interconnect',
        lastSync: new Date(Date.now() - 1000 * 15).toISOString(),
      },
      {
        id: 'prod-secureos',
        name: 'SecureOS Identity & Vault',
        adapter: 'SecureOSVaultAdapter',
        status: 'CONNECTED',
        capabilities: ['HSM_KEY_ATTESTATION', 'ZERO_TRUST_ACTOR_AUTH', 'POLICY_SYNC'],
        eventsCount: 3820,
        executionsCount: 512,
        health: 'HEALTHY',
        connectionState: 'Connected to Hardware Security Module cluster',
        lastSync: new Date(Date.now() - 1000 * 5).toISOString(),
      },
      {
        id: 'prod-finsight',
        name: 'FinSight UAE Macro & Markets',
        adapter: 'FinSightMacroEngineAdapter',
        status: 'CONNECTED',
        capabilities: ['MACRO_RISK_INDEX', 'TREASURY_ESCROW_QUERY', 'PORTFOLIO_SIMULATION'],
        eventsCount: 890,
        executionsCount: 76,
        health: 'HEALTHY',
        connectionState: 'Real-time FIX stream & settlement RPC',
        lastSync: new Date(Date.now() - 1000 * 45).toISOString(),
      },
      {
        id: 'prod-archos',
        name: 'ArchOS Urban Digital Twin',
        adapter: 'ArchOSSpatialAdapter',
        status: 'CONNECTED',
        capabilities: ['BIM_GEOJSON_QUERY', 'ZONING_INVARIANT_CHECK', 'THERMAL_CAMERA_FEED'],
        eventsCount: 2310,
        executionsCount: 315,
        health: 'HEALTHY',
        connectionState: 'Connected to Dubai & Abu Dhabi 3D GIS Engine',
        lastSync: new Date(Date.now() - 1000 * 20).toISOString(),
      },
      {
        id: 'prod-networklab',
        name: 'NetworkLab Sovereign Telemetry',
        adapter: 'NetworkLabFiberAdapter',
        status: 'CONNECTED',
        capabilities: ['DARK_FIBER_TELEMETRY', 'LATENCY_MAP', 'QUANTUM_ENCRYPTION_MONITOR'],
        eventsCount: 940,
        executionsCount: 110,
        health: 'HEALTHY',
        connectionState: 'Active optical telemetry probe',
        lastSync: new Date(Date.now() - 1000 * 35).toISOString(),
      },
      {
        id: 'prod-venture-radar',
        name: 'AI Venture Radar',
        adapter: 'VentureRadarIntelligenceAdapter',
        status: 'STANDBY',
        capabilities: ['DEALFLOW_INGESTION', 'FOUNDER_PROVENANCE', 'PATENT_GRAPH_EXPANSION'],
        eventsCount: 120,
        executionsCount: 14,
        health: 'HEALTHY',
        connectionState: 'Standby batch polling interface',
        lastSync: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
    ];
    defaultProducts.forEach((p) => this.productIntegrations.set(p.id, p));

    // 7. Scheduled Tasks
    const defaultTasks: ScheduledTask[] = [
      {
        id: 'task-sec-audit',
        name: 'Continuous SHA-256 Ledger Verification Loop',
        schedule: '*/2 * * * *',
        status: 'ACTIVE',
        agentId: 'agent-security-officer',
        capability: 'tool-ledger-verifier',
        policy: 'rule-sec-01',
        lastExecution: new Date(Date.now() - 1000 * 60).toISOString(),
        nextExecution: new Date(Date.now() + 1000 * 60).toISOString(),
        failureCount: 0,
      },
      {
        id: 'task-grid-curtail',
        name: 'Peak Demand Thermal & Power Optimization',
        schedule: '*/5 * * * *',
        status: 'ACTIVE',
        agentId: 'agent-infra-ops',
        capability: 'tool-telemetry-ingest',
        policy: 'rule-infra-03',
        lastExecution: new Date(Date.now() - 1000 * 180).toISOString(),
        nextExecution: new Date(Date.now() + 1000 * 120).toISOString(),
        failureCount: 0,
      },
      {
        id: 'task-finsight-sync',
        name: 'Sovereign Treasury Balance & Escrow Reconciliation',
        schedule: '0 * * * *',
        status: 'ACTIVE',
        agentId: 'agent-financial-risk',
        capability: 'tool-treasury-ledger',
        policy: 'rule-fin-02',
        lastExecution: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        nextExecution: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
        failureCount: 0,
      },
    ];
    defaultTasks.forEach((t) => this.scheduledTasks.set(t.id, t));

    // 8. Arbitration Cases
    const defaultArbitration: ArbitrationCase = {
      id: 'arb-case-2026-01',
      executionId: 'EX-9102',
      topic: 'Dispute on Cooling Load Curtailment vs. Compute SLA at Dubai South Datacenter DC-1',
      participatingAgents: [
        {
          agentId: 'agent-infra-ops',
          name: 'Infrastructure & Grid Specialist',
          assessment: 'Recommends immediate 35% load curtailment due to ambient temperature spiking to 48.2°C.',
          confidence: 94,
          risk: 28,
          evidence: ['Telemetry chiller loop B at 88% capacity', 'Ambient external temp 48.2°C'],
        },
        {
          agentId: 'agent-financial-risk',
          name: 'FinSight Risk & Capital Evaluator',
          assessment: 'Warns that throttling compute will incur $14,200/hr in SLA breach penalties for high-frequency trading clients.',
          confidence: 91,
          risk: 65,
          evidence: ['Client Tier 1 SLA Contract #DIFC-881', 'Estimated penalty schedule'],
        },
        {
          agentId: 'agent-security-officer',
          name: 'Security & Deterministic Verifier',
          assessment: 'Physical thermal safety strictly supercedes financial SLA penalties in accordance with UAE Federal Safety Code 44.',
          confidence: 99,
          risk: 15,
          evidence: ['UAE Federal Industrial Safety Code #44-B', 'Hardware manufacturer warranty cutoff at 92°C junction'],
        },
      ],
      disagreements: [
        'Infrastructure specialist emphasizes physical failure prevention over financial penalization.',
        'Financial agent notes lack of dual-chiller failover activation.',
      ],
      selectedAssessment: 'Physical thermal integrity and safety invariants prevail; staged 20% load migration to Abu Dhabi facility with dual cooling backup.',
      arbitrationResult: 'Staged migration proposal formulated with zero SLA breach penalty and zero thermal hazard.',
      arbitratorAgentId: 'agent-supervisor',
      policyImpact: 'Passed to Policy Gate with ALLOW condition under staged migration parameters.',
      timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    };
    this.arbitrationCases.set(defaultArbitration.id, defaultArbitration);

    // 9. Initial Canonical Events on Ledger with SHA-256 chain
    const initialEventsData: Omit<CanonicalEvent, 'previousEventHash' | 'currentEventHash' | 'integrityStatus'>[] = [
      {
        id: 'EVT-0001-GENESIS',
        name: 'LedgerGenesisInitialized',
        type: 'STATE_TRANSITION',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        actor: { id: 'act-sec-admin', name: 'Sovereign Root Authority', role: 'SECURITY_ADMIN' },
        executionId: 'EX-0000-GENESIS',
        traceId: 'trc-genesis-001',
        causation: 'FACTORY_BOOT_INITIALIZATION',
        correlation: 'INIT_BOOTSTRAP_2026',
        provenance: {
          source: 'Factory Kernel Core Initialization Routine',
          confidence: 100,
          chain: ['Root Kernel', 'SHA-256 Chaining Initializer'],
        },
        payload: {
          runtime: 'The Factory Kernel v2.4-Sovereign',
          invariant: 'AI DECIDES ≠ AI EXECUTES',
          hashAlgorithm: 'SHA-256',
          genesisState: 'IMMUTABLE_ROOT_SEEDED',
        },
      },
      {
        id: 'EVT-0002-POLICY',
        name: 'DeterministicPolicyRulesLoaded',
        type: 'POLICY_DECISION',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        actor: { id: 'act-compliance', name: 'Compliance Enforcer', role: 'COMPLIANCE_OFFICER' },
        executionId: 'EX-0001-BOOT',
        traceId: 'trc-policy-init',
        causation: 'POLICY_GATE_BOOT',
        correlation: 'INIT_BOOTSTRAP_2026',
        provenance: {
          source: 'Federal Compliance Directory',
          confidence: 100,
          chain: ['Policy Manifest v1.8', 'Deterministic Rule Engine'],
        },
        payload: {
          rulesLoaded: 5,
          deterministicEnforcement: true,
          humanEscalationRequiredForCritical: true,
        },
      },
      {
        id: 'EVT-0003-EXEC',
        name: 'AutonomousGridLoadBalancingExecuted',
        type: 'EXECUTION_COMPLETED',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        actor: { id: 'act-ops-sys', name: 'Factory Automated Kernel', role: 'SYSTEM' },
        agentId: 'agent-infra-ops',
        executionId: 'EX-8819',
        traceId: 'trc-8819-run',
        parentTraceId: 'trc-telemetry-trigger',
        causation: 'THERMAL_TELEMETRY_SPIKE',
        correlation: 'GRID_OPTIMIZATION_SESSION_04',
        provenance: {
          source: 'Dubai South Datacenter DC-2 SCADA Feed',
          confidence: 96,
          chain: ['SCADA Ingest', 'agent-infra-ops reasoning', 'PolicyGate[ALLOW]', 'AuthorizedExecution'],
        },
        payload: {
          action: 'DYNAMIC_CHILLER_RAMP_UP',
          parameters: { chillerCluster: 'DC2-B', targetKw: 420, ambientTemp: 44.5 },
          policyResult: 'ALLOW',
          executionReceipt: '0x8f28a9b183ce49d1029cbbaf1048291a82',
        },
      },
      {
        id: 'EVT-0004-ESCALATE',
        name: 'FinancialDisbursementEscalatedToHuman',
        type: 'ESCALATION_TRIGGERED',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        actor: { id: 'act-sec-officer', name: 'Factory Policy Gate', role: 'SYSTEM' },
        agentId: 'agent-financial-risk',
        executionId: 'EX-9042',
        traceId: 'trc-9042-esc',
        causation: 'HIGH_VALUE_THRESHOLD_EXCEEDED',
        correlation: 'SOVEREIGN_ESCROW_TRANSFER',
        provenance: {
          source: 'FinSight Escrow Release Proposal',
          confidence: 94,
          chain: ['Smart Contract Trigger', 'agent-financial-risk assessment', 'PolicyGate[ESCALATE]'],
        },
        payload: {
          proposalId: 'prop-fin-9042',
          requestedAmount: '$240,000 USD',
          recipient: 'Abu Dhabi Clean Energy Interconnect Phase 3',
          reason: 'Deterministic Rule: Financial transaction > $50,000 requires dual-custody human sign-off.',
        },
      },
      {
        id: 'EVT-0005-APPROVAL',
        name: 'HumanApprovalGrantedForDisbursement',
        type: 'HUMAN_APPROVAL',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        actor: { id: 'act-operator-01', name: 'Fatima Al-Nuaimi (Principal Operations Director)', role: 'SECURITY_ADMIN' },
        executionId: 'EX-9042',
        traceId: 'trc-9042-approval',
        parentTraceId: 'trc-9042-esc',
        causation: 'HUMAN_APPROVAL_QUEUE_ACTION',
        correlation: 'SOVEREIGN_ESCROW_TRANSFER',
        provenance: {
          source: 'Human-in-the-Loop Webhook & Hardware Key Verification',
          confidence: 100,
          chain: ['ApprovalRequest#APP-9042', 'MFA Hardware Key Signed', 'AuthorizedExecutionCommit'],
        },
        payload: {
          approvalRequestId: 'APP-9042',
          decision: 'APPROVED',
          reviewerNotes: 'Verified against EPC Phase 3 milestone signoff sheet. Verified bank coordinates.',
          signedHash: '0x99248abef88371029482810aaeedbf10928374829',
        },
      },
    ];

    initialEventsData.forEach((ev) => this.appendEvent(ev));

    // 10. Initial Executions with complete 10-step runtime flows
    const sampleExecutions: ExecutionContext[] = [
      {
        executionId: 'EX-8819',
        traceId: 'trc-8819-run',
        actorId: 'act-ops-sys',
        agentId: 'agent-infra-ops',
        capabilityId: 'tool-cluster-scale',
        timestamp: new Date(Date.now() - 1000 * 60 * 125).toISOString(),
        mode: 'LIVE',
        status: 'COMPLETED',
        request: {
          input: 'Optimize chiller cooling load at Dubai South DC-2 to prevent thermal throttling before peak afternoon temperatures.',
          contextSnapshot: { dcSite: 'Dubai South DC-2', currentTemp: 44.5, currentPue: 1.18 },
          intent: 'PREVENTIVE_COOLING_OPTIMIZATION',
          domain: 'INFRASTRUCTURE_OPS',
        },
        context: {
          memoryRecords: [defaultMemories[0], defaultMemories[1]],
          activeRules: defaultRules,
          systemState: { gridLoadPct: 68, activeChillers: 4 },
        },
        agentReasoning: {
          specialist: 'agent-infra-ops',
          steps: [
            { step: 1, thought: 'Analyzed ambient temperature curve rising at 1.8°C/hour toward peak 46.5°C.' },
            { step: 2, thought: 'Identified thermal buffer in Chiller Loop DC2-B with 32% spare compressor capacity.' },
            { step: 3, thought: 'Formulated staging plan to ramp up chiller 20 minutes ahead of peak thermal influx.' },
          ],
        },
        proposal: {
          id: 'prop-infra-8819',
          type: 'STATE_MUTATION',
          summary: 'Increase pre-cooling capacity in Loop DC2-B by 420 kW prior to peak thermal surge.',
          targetResource: 'DC2-B-CHILLER-ARRAY',
          requestedAction: 'DYNAMIC_CHILLER_RAMP_UP',
          parameters: { chillerCluster: 'DC2-B', targetKw: 420, ambientTemp: 44.5 },
          expectedImpact: 'Maintains server junction temperature under 68°C with 0% compute throttling.',
          riskScore: 24,
          confidence: 96,
          proposingAgentId: 'agent-infra-ops',
        },
        evidence: [
          {
            id: 'evi-8819-01',
            type: 'SENSOR_TELEMETRY',
            source: 'DC-2 Sensor Bus #41',
            claim: 'Ambient external temperature is 44.5°C and increasing steadily.',
            confidence: 99,
            verified: true,
            timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
            rawPayload: { ambientC: 44.5, trend: '+1.8C/hr' },
            provenanceTrail: ['Sensor#41', 'SCADA Ingest', 'Verified Ingest'],
          },
        ],
        verification: {
          status: 'VERIFIED',
          checks: [
            { checkName: 'Telemetry Calibration Check', passed: true, details: 'Sensor bus drift < 0.05%' },
            { checkName: 'Compressor Headroom Check', passed: true, details: '420 kW within 500 kW rated limit' },
          ],
          confidence: 96,
          riskScore: 24,
        },
        policyDecision: {
          decisionId: 'pol-dec-8819',
          outcome: 'ALLOW',
          reason: 'Risk score (24) is within allowable limit (60) for low-impact telemetry state adjustment.',
          appliedPolicies: [
            { policyId: 'rule-sec-01', policyName: defaultRules[0].name, matched: true, effect: 'ALLOW' },
            { policyId: 'rule-tool-05', policyName: defaultRules[4].name, matched: true, effect: 'ALLOW' },
          ],
          riskScore: 24,
          confidence: 96,
          evaluatedAt: new Date(Date.now() - 1000 * 60 * 122).toISOString(),
          evaluator: 'DETERMINISTIC_GATE_KERNEL',
        },
        authorization: {
          authorized: true,
          authorizer: 'Deterministic Policy Gate Kernel',
          method: 'AUTOMATIC_POLICY',
          timestamp: new Date(Date.now() - 1000 * 60 * 121).toISOString(),
        },
        executionResult: {
          success: true,
          output: { command: 'CHILLER_PRECOOL_SET', status: 'ACKNOWLEDGED_BY_PLC', appliedKw: 420 },
          sideEffects: ['Increased electrical draw by 420 kW on DC2-B', 'Stabilized inlet air at 21.2°C'],
          durationMs: 42,
          canonicalEventId: 'EVT-0003-EXEC',
        },
        receipt: {
          txHash: '0x8f28a9b183ce49d1029cbbaf1048291a82',
          eventId: 'EVT-0003-EXEC',
          executedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          durationMs: 42,
        },
      },
      {
        executionId: 'EX-9042',
        traceId: 'trc-9042-esc',
        actorId: 'act-sec-officer',
        agentId: 'agent-financial-risk',
        capabilityId: 'tool-treasury-ledger',
        timestamp: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
        mode: 'LIVE',
        status: 'COMPLETED',
        request: {
          input: 'Disburse $240,000 milestone payment to Abu Dhabi Clean Energy Interconnect contractor upon completion of EPC Phase 3.',
          contextSnapshot: { contractId: 'EPC-AD-2026-PH3', escrowBalance: '$1,200,000 USD' },
          intent: 'MILESTONE_ESCROW_DISBURSEMENT',
          domain: 'FINANCIAL_RISK',
        },
        context: {
          memoryRecords: [defaultMemories[3], defaultMemories[4]],
          activeRules: defaultRules,
          systemState: { escrowStatus: 'FUNDED', signatoryCount: 1 },
        },
        agentReasoning: {
          specialist: 'agent-financial-risk',
          steps: [
            { step: 1, thought: 'Inspected EPC Phase 3 engineer signoff on digital ledger.' },
            { step: 2, thought: 'Calculated remaining escrow balance after $240,000 transfer: $960,000 USD.' },
            { step: 3, thought: 'Identified proposal exceeds $50,000 automatic limit — requires Policy Gate human escalation.' },
          ],
        },
        proposal: {
          id: 'prop-fin-9042',
          type: 'FINANCIAL_ALLOCATION',
          summary: 'Release $240,000 from escrow account to contractor bank account.',
          targetResource: 'SOVEREIGN_ESCROW_VAULT',
          requestedAction: 'DISBURSE_ESCROW_FUNDS',
          parameters: { amount: 240000, currency: 'USD', beneficiary: 'AD Clean Energy Interconnect Ltd' },
          expectedImpact: 'Settles Phase 3 contractual liability and records milestone on chain.',
          riskScore: 78,
          confidence: 94,
          proposingAgentId: 'agent-financial-risk',
        },
        evidence: [
          {
            id: 'evi-9042-01',
            type: 'SOURCE_DATA',
            source: 'EPC Phase 3 Attestation Smart Contract',
            claim: 'Inspection certificates verified by Federal Energy Authority inspector #8812.',
            confidence: 98,
            verified: true,
            timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
            rawPayload: { certHash: '0x33b91a7882', inspectorId: 'FEA-8812' },
            provenanceTrail: ['FEA Portal', 'Smart Contract Attestation', 'FinSight Ingest'],
          },
        ],
        verification: {
          status: 'VERIFIED',
          checks: [
            { checkName: 'Digital Certificate Signature', passed: true, details: 'Valid FEA Inspector RSA-4096' },
            { checkName: 'Escrow Liquidity Sufficiency', passed: true, details: 'Balance $1.2M > $240k' },
          ],
          confidence: 94,
          riskScore: 78,
        },
        policyDecision: {
          decisionId: 'pol-dec-9042',
          outcome: 'ESCALATE',
          reason: 'High-Value Financial Allocation ($240,000 > $50,000 limit) strictly requires dual-custody human sign-off.',
          appliedPolicies: [
            { policyId: 'rule-fin-02', policyName: defaultRules[1].name, matched: true, effect: 'ESCALATE' },
          ],
          riskScore: 78,
          confidence: 94,
          evaluatedAt: new Date(Date.now() - 1000 * 60 * 46).toISOString(),
          evaluator: 'DETERMINISTIC_GATE_KERNEL',
        },
        authorization: {
          authorized: true,
          authorizer: 'Fatima Al-Nuaimi (Principal Operations Director)',
          method: 'HUMAN_APPROVAL',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        },
        executionResult: {
          success: true,
          output: { wireRef: 'WIRE-DXB-2026-904281', settledAmount: 240000, status: 'EXECUTED_SETTLED' },
          sideEffects: ['Debited Sovereign Escrow Vault by $240,000 USD', 'Generated signed SWIFT acknowledgment'],
          durationMs: 820,
          canonicalEventId: 'EVT-0005-APPROVAL',
        },
        receipt: {
          txHash: '0x99248abef88371029482810aaeedbf10928374829',
          eventId: 'EVT-0005-APPROVAL',
          executedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          durationMs: 820,
        },
      },
      {
        executionId: 'EX-9110',
        traceId: 'trc-9110-run',
        actorId: 'act-sec-admin',
        agentId: 'agent-security-officer',
        capabilityId: 'tool-policy-evaluator',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        mode: 'LIVE',
        status: 'DENIED',
        request: {
          input: 'Grant anonymous write access to root ledger configuration table.',
          contextSnapshot: { caller: 'UNAUTHENTICATED_EXTERNAL_RPC' },
          intent: 'UNAUTHORIZED_POLICY_MODIFICATION',
          domain: 'SECURITY',
        },
        context: {
          memoryRecords: [],
          activeRules: defaultRules,
          systemState: { securityLevel: 'HIGH' },
        },
        agentReasoning: {
          specialist: 'agent-security-officer',
          steps: [
            { step: 1, thought: 'Received unauthenticated request targeting root ledger configuration.' },
            { step: 2, thought: 'Checked Rule [Strict Root Policy & Cryptographic Key Protection].' },
            { step: 3, thought: 'Deterministic outcome: Unconditional DENY without escalation.' },
          ],
        },
        proposal: {
          id: 'prop-sec-9110',
          type: 'SECURITY_RECONFIGURATION',
          summary: 'Modify root access control list for ledger configuration.',
          targetResource: 'ROOT_SECURITY_KERNEL',
          requestedAction: 'UNPROTECTED_POLICY_OVERRIDE',
          parameters: { allowAnonymous: true },
          expectedImpact: 'Critical security compromise of immutable invariants.',
          riskScore: 99,
          confidence: 10,
          proposingAgentId: 'agent-security-officer',
        },
        evidence: [],
        verification: {
          status: 'REJECTED',
          checks: [
            { checkName: 'Caller Identity Authenticity', passed: false, details: 'No cryptographic actor signature provided' },
            { checkName: 'Invariant Policy Target', passed: false, details: 'Root ledger config cannot be weakened' },
          ],
          confidence: 10,
          riskScore: 99,
        },
        policyDecision: {
          decisionId: 'pol-dec-9110',
          outcome: 'DENY',
          reason: 'Violated security rule [Strict Root Policy & Cryptographic Key Protection]: Risk score (99) exceeded limit (10).',
          appliedPolicies: [
            { policyId: 'rule-sec-04', policyName: defaultRules[3].name, matched: true, effect: 'DENY' },
          ],
          riskScore: 99,
          confidence: 10,
          evaluatedAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
          evaluator: 'DETERMINISTIC_GATE_KERNEL',
        },
        authorization: {
          authorized: false,
          authorizer: 'Deterministic Policy Gate Kernel',
          method: 'AUTOMATIC_POLICY',
          timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
        },
      },
    ];

    sampleExecutions.forEach((ex) => this.executions.set(ex.executionId, ex));

    // 11. Pending Approval Request for Escalated state demo
    const pendingApproval: ApprovalRequest = {
      id: 'APP-9250',
      executionId: 'EX-9250',
      agentId: 'agent-infra-ops',
      agentName: 'Infrastructure & Grid Specialist',
      proposal: {
        id: 'prop-infra-9250',
        type: 'INFRASTRUCTURE_DEPLOY',
        summary: 'Initiate dynamic power curtailment across UAE BitMiner Substation Alpha (14.2 MW load shed during peak grid surge).',
        targetResource: 'BITMINER_SUBSTATION_ALPHA',
        requestedAction: 'DYNAMIC_LOAD_CURTAILMENT',
        parameters: { substationId: 'SUB-ALPHA-DXB', curtailmentMw: 14.2, durationHours: 2.5 },
        expectedImpact: 'Stabilizes grid frequency to 50.02 Hz; credits industrial operator with DR rebate.',
        riskScore: 68,
        confidence: 93,
        proposingAgentId: 'agent-infra-ops',
      },
      evidence: [
        {
          id: 'evi-9250-01',
          type: 'SENSOR_TELEMETRY',
          source: 'Federal Electricity & Water Authority (FEWA) Grid Interconnect',
          claim: 'Regional grid frequency dropped to 49.88 Hz due to industrial cooling surge.',
          confidence: 99,
          verified: true,
          timestamp: new Date().toISOString(),
          rawPayload: { frequencyHz: 49.88, gridDemandMw: 8420, thresholdHz: 49.90 },
          provenanceTrail: ['FEWA Interconnect Probe #12', 'SCADA Ingestion Bus', 'agent-infra-ops'],
        },
      ],
      riskScore: 68,
      confidence: 93,
      policyName: 'Critical Infrastructure & Power Grid Guardrail',
      requestedCapability: 'tool-cluster-scale',
      requestedAction: 'DYNAMIC_LOAD_CURTAILMENT',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      status: 'PENDING',
    };
    this.approvals.set(pendingApproval.id, pendingApproval);

    // Also add execution record for this pending one
    const pendingExec: ExecutionContext = {
      executionId: 'EX-9250',
      traceId: 'trc-9250-esc',
      actorId: 'act-ops-sys',
      agentId: 'agent-infra-ops',
      capabilityId: 'tool-cluster-scale',
      timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
      mode: 'LIVE',
      status: 'ESCALATED',
      request: {
        input: 'FEWA grid frequency dropped below 49.90 Hz. Propose immediate 14.2 MW load curtailment at Substation Alpha.',
        contextSnapshot: { frequencyHz: 49.88, targetSubstation: 'SUB-ALPHA-DXB' },
        intent: 'GRID_FREQUENCY_STABILIZATION',
        domain: 'INFRASTRUCTURE_OPS',
      },
      context: {
        memoryRecords: [defaultMemories[0], defaultMemories[1]],
        activeRules: defaultRules,
        systemState: { gridFrequency: 49.88, curtailmentCapacity: 20.0 },
      },
      agentReasoning: {
        specialist: 'agent-infra-ops',
        steps: [
          { step: 1, thought: 'Observed FEWA telemetry showing grid frequency dipping to 49.88 Hz.' },
          { step: 2, thought: 'Evaluated curtailment contract with BitMiner Substation Alpha.' },
          { step: 3, thought: 'Proposing 14.2 MW curtailment for 2.5 hours. Consequential action triggers human escalation.' },
        ],
      },
      proposal: pendingApproval.proposal,
      evidence: pendingApproval.evidence,
      verification: {
        status: 'VERIFIED',
        checks: [
          { checkName: 'Grid Frequency Calibration', passed: true, details: 'Verified on dual redundant FEWA meters' },
          { checkName: 'Contractual Curtailment Limit', passed: true, details: '14.2 MW is within 18.0 MW contractual cap' },
        ],
        confidence: 93,
        riskScore: 68,
      },
      policyDecision: {
        decisionId: 'pol-dec-9250',
        outcome: 'ESCALATE',
        reason: 'Critical Infrastructure & Power Grid Guardrail: Direct modification of power transmission requires human approval.',
        appliedPolicies: [
          { policyId: 'rule-infra-03', policyName: defaultRules[2].name, matched: true, effect: 'ESCALATE' },
        ],
        riskScore: 68,
        confidence: 93,
        evaluatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        evaluator: 'DETERMINISTIC_GATE_KERNEL',
      },
    };
    this.executions.set(pendingExec.executionId, pendingExec);
  }
}

export const globalStore = new FactoryStore();
