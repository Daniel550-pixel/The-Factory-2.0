import React from 'react';
import {
  Activity, ArrowRight, Brain, CheckCircle2, ChevronRight, CircleDot, Clock3, Cpu,
  Database, FileCheck2, GitBranch, LockKeyhole, Play, Radio, ShieldCheck, Sparkles, Workflow,
} from 'lucide-react';
import type { SystemStatus, ExecutionContext, CanonicalEvent, Agent, ApprovalRequest, RuntimeMode } from '../types';

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

const toneForStatus = (status: ExecutionContext['status']) => {
  if (status === 'COMPLETED') return 'text-emerald-300';
  if (status === 'FAILED' || status === 'DENIED') return 'text-rose-300';
  if (status === 'ESCALATED') return 'text-amber-300';
  return 'text-cyan-300';
};

const formatTime = (value: string) => {
  try { return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return '—'; }
};

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  status, executions, events, agents, approvals, activeMode, onNavigate,
  onSelectExecution, onSelectEvent, onOpenQuickLaunch,
}) => {
  const pendingApprovals = approvals.filter((item) => item.status === 'PENDING');
  const recentExecutions = executions.slice(0, 5);
  const recentEvents = events.slice(0, 8);
  const activeAgents = agents.filter((agent) => agent.status === 'ACTIVE' || agent.status === 'BUSY');
  const runtimeState = status?.runtimeStatus ?? 'OPERATIONAL';

  const pipeline = [
    ['01', 'REQUEST', 'Intent'], ['02', 'CONTEXT', 'State'], ['03', 'AGENT', 'Reasoning'],
    ['04', 'PROPOSAL', 'Plan'], ['05', 'EVIDENCE', 'Provenance'], ['06', 'POLICY', 'Governance'],
    ['07', 'AUTH', 'Permission'], ['08', 'EXECUTE', 'Action'], ['09', 'LEDGER', 'Canonical'],
    ['10', 'MEMORY', 'Persist'],
  ];

  return (
    <div className="factory-enter min-h-full pb-10 text-neutral-200">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 font-mono text-[9px] tracking-[0.24em] text-neutral-600">
            <span className="text-cyan-400">FACTORY://</span><span>COMMAND_CENTER</span><span>/</span><span className="text-neutral-500">{activeMode}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Command Center</h1>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 font-mono text-[9px] tracking-wider text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />{runtimeState}
            </span>
          </div>
          <p className="mt-1.5 max-w-2xl text-xs text-neutral-500">Live control surface for governed agent reasoning, authorization, execution and immutable state.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('simulation')} className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 font-mono text-[10px] text-neutral-400 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-neutral-200"><Sparkles className="h-3.5 w-3.5 text-amber-300" /> SIMULATE</button>
          <button onClick={onOpenQuickLaunch} className="flex h-9 items-center gap-2 rounded-lg bg-cyan-400 px-3.5 font-mono text-[10px] font-semibold text-[#041014] shadow-[0_0_24px_rgba(34,211,238,0.12)] transition hover:bg-cyan-300"><Play className="h-3.5 w-3.5 fill-current" /> DISPATCH TASK</button>
        </div>
      </div>

      <section className="factory-spatial relative overflow-hidden rounded-2xl border border-white/[0.09] p-5 xl:p-6">
        <div className="factory-grid-fine pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,0.09),transparent_25%),radial-gradient(circle_at_78%_65%,rgba(139,92,246,0.08),transparent_24%)]" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-cyan-400/15 bg-cyan-400/[0.04] px-2.5 py-1.5 font-mono text-[9px] tracking-[0.16em] text-cyan-200"><LockKeyhole className="h-3.5 w-3.5" /> FUNDAMENTAL INVARIANT</div>
            <h2 className="font-mono text-xl font-semibold tracking-tight text-white">AI DECIDES <span className="text-cyan-300">≠</span> AI EXECUTES</h2>
            <p className="mt-2 text-xs leading-5 text-neutral-500">Reasoning may propose. Evidence verifies. Deterministic policy authorizes. Execution occurs only after the governed path completes.</p>
          </div>
          <div className="grid min-w-[300px] grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[470px]">
            {[
              ['LEDGER', status?.ledgerIntegrity ?? 'VERIFYING', status?.ledgerIntegrity === 'VERIFIED' ? 'text-emerald-300' : 'text-amber-300'],
              ['AGENTS', String(status?.activeAgents ?? activeAgents.length), 'text-cyan-300'],
              ['EXECUTIONS', String(status?.activeExecutions ?? 0), 'text-violet-300'],
              ['APPROVALS', String(status?.pendingApprovals ?? pendingApprovals.length), 'text-amber-300'],
            ].map(([label, value, tone]) => <div key={label} className="factory-panel rounded-xl px-3 py-2.5"><div className="font-mono text-[8px] tracking-[0.18em] text-neutral-600">{label}</div><div className={`mt-1 font-mono text-sm font-semibold ${tone}`}>{value}</div></div>)}
          </div>
        </div>

        <div className="relative mt-6 overflow-x-auto border-t border-white/[0.06] pt-5">
          <div className="flex min-w-[1120px] items-center">
            {pipeline.map(([num, title, sub], index) => (
              <React.Fragment key={num}>
                <div className={`factory-node factory-signal min-w-[96px] flex-1 rounded-xl px-2.5 py-3 text-center ${index === 6 ? 'factory-node-active' : ''}`}>
                  <div className="font-mono text-[8px] text-neutral-700">{num}</div>
                  <div className={`mt-1 text-[9px] font-semibold tracking-wider ${index === 6 ? 'text-cyan-200' : 'text-neutral-300'}`}>{title}</div>
                  <div className="mt-1 text-[8px] text-neutral-600">{sub}</div>
                </div>
                {index < pipeline.length - 1 && <ArrowRight className="mx-1.5 h-3 w-3 shrink-0 text-neutral-700" />}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-[7px] tracking-[0.18em] text-neutral-700">
            <span>INTENT / SIGNAL</span><span>GOVERNED TRANSITION</span><span>CANONICAL STATE / PERSISTENCE</span>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          { label: 'CANONICAL EVENTS', value: status?.totalEvents ?? events.length, sub: 'ledger records', icon: Database, action: 'event-ledger', tone: 'text-cyan-300' },
          { label: 'PROVENANCE', value: `${status?.provenanceIntegrityPct ?? 0}%`, sub: 'integrity coverage', icon: GitBranch, action: 'evidence-provenance', tone: 'text-violet-300' },
          { label: 'POLICY', value: `${status?.policyStats.allow ?? 0} / ${status?.policyStats.deny ?? 0}`, sub: 'allow / deny', icon: ShieldCheck, action: 'policy-gate', tone: 'text-emerald-300' },
          { label: 'MEMORY', value: status?.totalMemoryRecords ?? 0, sub: 'linked records', icon: Brain, action: 'memory', tone: 'text-fuchsia-300' },
        ].map((metric) => { const Icon = metric.icon; return <button key={metric.label} onClick={() => onNavigate(metric.action)} className="factory-panel group p-3.5 text-left transition hover:border-white/[0.14] hover:bg-white/[0.035]"><div className="flex items-center justify-between"><span className="font-mono text-[8px] tracking-[0.18em] text-neutral-600">{metric.label}</span><Icon className={`h-3.5 w-3.5 ${metric.tone}`} /></div><div className="mt-2 font-mono text-lg font-semibold text-neutral-100">{metric.value}</div><div className="mt-0.5 text-[9px] text-neutral-600">{metric.sub}</div></button>; })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="factory-panel overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5"><div className="flex items-center gap-2"><Workflow className="h-4 w-4 text-cyan-300" /><div><h3 className="text-xs font-semibold tracking-wide text-neutral-200">ACTIVE EXECUTION GRAPH</h3><p className="mt-0.5 font-mono text-[8px] tracking-wider text-neutral-600">LIVE PIPELINES / TRACE STATE</p></div></div><button onClick={() => onNavigate('executions')} className="flex items-center gap-1 font-mono text-[9px] text-cyan-400 hover:text-cyan-300">OPEN <ChevronRight className="h-3 w-3" /></button></div>
          <div className="divide-y divide-white/[0.05]">{recentExecutions.length === 0 ? <div className="flex min-h-[190px] items-center justify-center text-xs text-neutral-600">No executions recorded.</div> : recentExecutions.map((execution) => <button key={execution.executionId} onClick={() => onSelectExecution(execution.executionId)} className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.025]"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-black/20"><CircleDot className={`h-3.5 w-3.5 ${toneForStatus(execution.status)}`} /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate font-mono text-[10px] text-neutral-300">{execution.executionId}</span><span className={`font-mono text-[8px] tracking-wider ${toneForStatus(execution.status)}`}>{execution.status}</span></div><div className="mt-1 truncate text-[10px] text-neutral-600">{execution.request.input}</div></div><div className="hidden items-center gap-1.5 font-mono text-[8px] text-neutral-600 sm:flex"><Clock3 className="h-3 w-3" />{formatTime(execution.timestamp)}</div><ChevronRight className="h-3.5 w-3.5 text-neutral-700 transition group-hover:text-neutral-400" /></button>)}</div>
        </section>

        <section className="factory-panel overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5"><div className="flex items-center gap-2"><Radio className="h-4 w-4 text-cyan-300" /><div><h3 className="text-xs font-semibold tracking-wide text-neutral-200">EVENT STREAM</h3><p className="mt-0.5 font-mono text-[8px] tracking-wider text-neutral-600">CANONICAL LEDGER FEED</p></div></div><span className="flex items-center gap-1.5 font-mono text-[8px] text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> LIVE</span></div>
          <div className="max-h-[315px] overflow-y-auto divide-y divide-white/[0.05]">{recentEvents.length === 0 ? <div className="flex min-h-[190px] items-center justify-center text-xs text-neutral-600">Waiting for canonical events.</div> : recentEvents.map((event) => <button key={event.id} onClick={() => onSelectEvent(event)} className="group flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/[0.025]"><div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${event.integrityStatus === 'VALID' ? 'bg-emerald-400' : 'bg-rose-400'}`} /><div className="min-w-0 flex-1"><div className="truncate text-[10px] font-medium text-neutral-300">{event.name}</div><div className="mt-1 flex items-center gap-2 font-mono text-[8px] text-neutral-600"><span>{event.type}</span><span>•</span><span>{formatTime(event.timestamp)}</span></div></div><ChevronRight className="h-3.5 w-3.5 text-neutral-700 group-hover:text-neutral-400" /></button>)}</div>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="factory-panel rounded-2xl p-4 lg:col-span-2"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Cpu className="h-4 w-4 text-cyan-300" /><h3 className="text-xs font-semibold tracking-wide">AGENT FABRIC</h3></div><button onClick={() => onNavigate('agents')} className="font-mono text-[9px] text-cyan-400">REGISTRY →</button></div><div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">{activeAgents.slice(0, 6).map((agent) => <div key={agent.id} className="rounded-xl border border-white/[0.06] bg-black/20 p-3"><div className="flex items-center justify-between gap-2"><span className="truncate text-[10px] font-medium text-neutral-300">{agent.name}</span><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${agent.status === 'BUSY' ? 'bg-cyan-300 shadow-[0_0_7px_rgba(103,232,249,0.8)]' : 'bg-emerald-400'}`} /></div><div className="mt-1.5 font-mono text-[8px] text-neutral-600">{agent.type} / {agent.modelProvider}</div><div className="mt-2 flex items-center justify-between font-mono text-[8px]"><span className="text-neutral-600">CONFIDENCE</span><span className="text-cyan-300">{agent.confidence}%</span></div></div>)}{activeAgents.length === 0 && <div className="col-span-full py-8 text-center text-xs text-neutral-600">No active agents.</div>}</div></section>

        <section className={`rounded-2xl border p-4 ${pendingApprovals.length > 0 ? 'border-amber-400/20 bg-amber-400/[0.035]' : 'factory-panel'}`}><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-amber-300" /><h3 className="text-xs font-semibold tracking-wide">HUMAN GATE</h3></div><span className="rounded-full bg-amber-400/10 px-2 py-1 font-mono text-[8px] text-amber-300">{pendingApprovals.length} PENDING</span></div>{pendingApprovals.length > 0 ? <div className="space-y-2">{pendingApprovals.slice(0, 2).map((approval) => <button key={approval.id} onClick={() => onNavigate('approvals')} className="w-full rounded-xl border border-amber-400/10 bg-black/20 p-3 text-left transition hover:border-amber-400/20"><div className="font-mono text-[8px] text-amber-300">{approval.id}</div><div className="mt-1.5 line-clamp-2 text-[10px] text-neutral-300">{approval.proposal.summary}</div><div className="mt-2 flex items-center justify-between font-mono text-[8px] text-neutral-600"><span>RISK</span><span className="text-amber-300">{approval.riskScore}/100</span></div></button>)}<button onClick={() => onNavigate('approvals')} className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 font-mono text-[9px] font-semibold text-[#171006]">REVIEW QUEUE <ArrowRight className="h-3 w-3" /></button></div> : <div className="flex min-h-[150px] flex-col items-center justify-center text-center"><CheckCircle2 className="h-7 w-7 text-emerald-400" /><div className="mt-2 text-xs font-medium text-neutral-300">No human action required</div><div className="mt-1 text-[9px] text-neutral-600">Policy gate is clear.</div></div>}</section>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 font-mono text-[8px] text-neutral-600"><div className="flex items-center gap-3"><span className="flex items-center gap-1.5"><Activity className="h-3 w-3 text-cyan-400" /> RUNTIME LINKED</span><span>•</span><span>SHA-256 EVENT CHAIN</span></div><div className="flex items-center gap-3"><span>LAST CHECK</span><span className="text-neutral-500">{status?.lastIntegrityCheck ? formatTime(status.lastIntegrityCheck) : '—'}</span></div></div>
    </div>
  );
};