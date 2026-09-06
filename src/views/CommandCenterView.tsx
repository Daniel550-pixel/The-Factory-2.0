import React from 'react';
import {
  Activity,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Database,
  Cpu,
  Brain,
  Layers,
  ArrowRight,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Lock,
  Boxes,
  FileCheck,
} from 'lucide-react';
import type {
  SystemStatus,
  ExecutionContext,
  CanonicalEvent,
  Agent,
  ApprovalRequest,
  RuntimeMode,
} from '../types';

interface CommandCenterViewProps {
  status: SystemStatus | null;
  executions: ExecutionContext[];
  events: CanonicalEvent[];
  agents: Agent[];
  approvals: ApprovalRequest[];
  activeMode: RuntimeMode;
  onNavigate: (tabId: string) => void;
  onSelectExecution: (id: string) => void;
  onSelectEvent: (event: CanonicalEvent) => void;
  onOpenQuickLaunch: () => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  status,
  executions,
  events,
  agents,
  approvals,
  activeMode,
  onNavigate,
  onSelectExecution,
  onSelectEvent,
  onOpenQuickLaunch,
}) => {
  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Invariant & System Status Hero Banner */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                <Lock className="h-3 w-3" />
                FUNDAMENTAL SECURITY INVARIANT
              </span>
              <span className="text-xs font-mono text-neutral-400">
                MODE: <strong className="text-neutral-100">{activeMode}</strong>
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-100 font-mono">
              AI DECIDES ≠ AI EXECUTES
            </h1>
            <p className="text-xs text-neutral-400 max-w-3xl leading-relaxed">
              The Factory separates observation, specialist agent reasoning, proposal generation, evidentiary verification, risk scoring, deterministic policy authorization, and cryptographically verified execution on the immutable Event Ledger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('simulation')}
              className="px-3.5 py-2 rounded-lg border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-800 text-xs font-mono text-neutral-200 transition flex items-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Simulation Sandbox</span>
            </button>
            <button
              onClick={onOpenQuickLaunch}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-mono font-bold text-neutral-950 transition flex items-center gap-2 shadow-sm"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Dispatch New Task</span>
            </button>
          </div>
        </div>

        {/* Runtime Pipeline Diagram */}
        <div className="mt-5 pt-4 border-t border-neutral-800/80 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[760px] text-[11px] font-mono">
            {[
              { step: '1. REQUEST', sub: 'Observation' },
              { step: '2. CONTEXT', sub: 'Assembly' },
              { step: '3. REASONING', sub: 'Agent Model' },
              { step: '4. PROPOSAL', sub: 'Action Plan' },
              { step: '5. EVIDENCE', sub: 'Provenance' },
              { step: '6. VERIFICATION', sub: 'Integrity Check' },
              { step: '7. POLICY GATE', sub: 'ALLOW/DENY/ESC' },
              { step: '8. EXECUTION', sub: 'Authorized Run' },
              { step: '9. EVENT LEDGER', sub: 'SHA-256 Chain' },
              { step: '10. MEMORY', sub: 'Distilled Knowledge' },
            ].map((item, idx, arr) => (
              <React.Fragment key={item.step}>
                <div className="flex flex-col items-center text-center px-2 py-1 rounded bg-neutral-950/60 border border-neutral-800/60 min-w-[70px]">
                  <span className="font-semibold text-neutral-200">{item.step}</span>
                  <span className="text-[9px] text-neutral-400">{item.sub}</span>
                </div>
                {idx < arr.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-neutral-600 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Ledger Integrity */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>LEDGER STATE</span>
            <Database className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <div className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>{status?.ledgerIntegrity || 'VERIFIED'}</span>
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              {status?.totalEvents || events.length} Canonical Events
            </div>
          </div>
          <button
            onClick={() => onNavigate('event-ledger')}
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-1"
          >
            <span>Inspect Chain</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Policy Gate Stats */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>POLICY GATE</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <span className="text-emerald-400">{status?.policyStats.allow ?? 0} Allow</span>
              <span className="text-rose-400">{status?.policyStats.deny ?? 0} Deny</span>
              <span className="text-amber-400">{status?.policyStats.escalate ?? 0} Esc</span>
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              Deterministic Rules
            </div>
          </div>
          <button
            onClick={() => onNavigate('policy-gate')}
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-1"
          >
            <span>Configure Gate</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Pending Approvals */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>APPROVAL QUEUE</span>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="text-base font-bold font-mono text-neutral-100">
              {pendingApprovals.length} <span className="text-xs font-normal text-amber-400">Escalated</span>
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              Dual-Custody Human Sign-Off
            </div>
          </div>
          <button
            onClick={() => onNavigate('approvals')}
            className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-1 font-semibold"
          >
            <span>Review Queue</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Active Agents */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>AGENT RUNTIME</span>
            <Cpu className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <div className="text-base font-bold font-mono text-neutral-100">
              {status?.activeAgents ?? agents.length} <span className="text-xs font-normal text-cyan-400">Specialists</span>
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              Server-Side Reasoning
            </div>
          </div>
          <button
            onClick={() => onNavigate('agents')}
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-1"
          >
            <span>Agent Registry</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Context & Memory */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>STATE MEMORY</span>
            <Brain className="h-4 w-4 text-purple-400" />
          </div>
          <div className="my-2">
            <div className="text-base font-bold font-mono text-neutral-100">
              {status?.totalMemoryRecords ?? 5} <span className="text-xs font-normal text-purple-400">Records</span>
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              Provenance-Linked
            </div>
          </div>
          <button
            onClick={() => onNavigate('memory')}
            className="text-[11px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1"
          >
            <span>Explore Memory</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Product Integrations */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>DOMAIN ADAPTERS</span>
            <Boxes className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-base font-bold font-mono text-neutral-100">
              6 <span className="text-xs font-normal text-emerald-400">Connected</span>
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              BitMiner, SecureOS, ArchOS
            </div>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-1"
          >
            <span>View Adapters</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 3. Main Dashboard 2-Column Split: Active Executions & Live Ledger Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Executions & Human Approval Alerts */}
        <div className="lg:col-span-7 space-y-6">
          {/* Pending Approval Alert Card (if any) */}
          {pendingApprovals.length > 0 && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Human-in-the-Loop Approval Required ({pendingApprovals.length})</span>
                </div>
                <button
                  onClick={() => onNavigate('approvals')}
                  className="px-2.5 py-1 rounded bg-amber-500 text-neutral-950 text-xs font-mono font-bold hover:bg-amber-400 transition"
                >
                  Review All
                </button>
              </div>

              <div className="space-y-2">
                {pendingApprovals.slice(0, 2).map((appr) => (
                  <div
                    key={appr.id}
                    className="p-3 rounded-lg border border-amber-500/20 bg-neutral-950/60 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-300">{appr.id}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-400 border border-amber-800/40">
                          {appr.policyName}
                        </span>
                      </div>
                      <p className="text-neutral-300 font-medium">{appr.proposal.summary}</p>
                      <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-3">
                        <span>Agent: {appr.agentName}</span>
                        <span>Risk Score: <strong className="text-amber-400">{appr.riskScore}/100</strong></span>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('approvals')}
                      className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono transition flex-shrink-0"
                    >
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Executions Panel */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                <h2 className="text-sm font-bold font-mono text-neutral-100 uppercase">
                  Runtime Executions & Pipelines
                </h2>
              </div>
              <button
                onClick={() => onNavigate('executions')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>View All ({executions.length})</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {executions.slice(0, 5).map((exec) => {
                const isComplete = exec.status === 'COMPLETED';
                const isDenied = exec.status === 'DENIED';
                const isEscalated = exec.status === 'ESCALATED';

                return (
                  <div
                    key={exec.executionId}
                    onClick={() => onSelectExecution(exec.executionId)}
                    className="p-3 rounded-lg border border-neutral-800 bg-neutral-950 hover:border-neutral-700 transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-neutral-200 group-hover:text-cyan-300">
                          {exec.executionId}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {exec.agentReasoning.specialist}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            isComplete
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isDenied
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : isEscalated
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          }`}
                        >
                          {exec.status}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {new Date(exec.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-300 font-medium truncate">
                      {exec.request.input}
                    </p>

                    {exec.proposal && (
                      <div className="mt-2 pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                        <span className="truncate max-w-[280px]">
                          Action: <strong className="text-neutral-200">{exec.proposal.requestedAction}</strong>
                        </span>
                        <div className="flex items-center gap-3">
                          <span>Risk: <strong className="text-neutral-200">{exec.proposal.riskScore}</strong></span>
                          <span>Confidence: <strong className="text-neutral-200">{exec.proposal.confidence}%</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Event Ledger Stream */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-cyan-400" />
                <h2 className="text-sm font-bold font-mono text-neutral-100 uppercase">
                  Canonical Event Ledger
                </h2>
              </div>
              <button
                onClick={() => onNavigate('event-ledger')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Ledger Explorer</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-2">
              {events.slice(0, 6).map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className="p-3 rounded-lg border border-neutral-800/80 bg-neutral-950 hover:border-neutral-700 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-bold text-cyan-400 group-hover:text-cyan-300 truncate">
                      {evt.name}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 flex-shrink-0">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-neutral-400">
                    <span className="truncate">Type: {evt.type}</span>
                    <span>•</span>
                    <span className="truncate">Actor: {evt.actor.name}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1.5 border-t border-neutral-900">
                    <span className="truncate max-w-[180px]">Hash: {evt.currentEventHash.substring(0, 16)}...</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      SHA-256 LINKED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Agents Snapshot */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-400" />
                <h3 className="text-xs font-bold font-mono text-neutral-200 uppercase">
                  Specialist Agents Registry
                </h3>
              </div>
              <button
                onClick={() => onNavigate('agents')}
                className="text-xs font-mono text-purple-400 hover:text-purple-300"
              >
                All Agents
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {agents.slice(0, 4).map((ag) => (
                <div
                  key={ag.id}
                  className="p-2.5 rounded-lg border border-neutral-800/80 bg-neutral-950 text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-200 truncate">{ag.name.split(' ')[0]}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {ag.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">{ag.type}</div>
                  <div className="text-[10px] text-cyan-400">Score: {ag.performanceScore}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
