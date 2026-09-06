import React, { useState } from 'react';
import {
  GitCommit, Layers, Cpu, Brain, ShieldCheck, ShieldAlert, XCircle, CheckCircle2,
  AlertTriangle, Play, RotateCcw, ArrowRight, ExternalLink, Code, Sparkles, Lock,
  FileText, Clock, ChevronDown, ChevronRight,
} from 'lucide-react';
import type { ExecutionContext, CanonicalEvent } from '../types';

interface ExecutionsViewProps {
  executions: ExecutionContext[];
  selectedExecutionId: string | null;
  onSelectExecution: (id: string) => void;
  onRunPipeline: (id: string) => Promise<void>;
  onNavigateToLedger: (eventId: string) => void;
  onReplayExecution: (id: string) => void;
}

export const ExecutionsView: React.FC<ExecutionsViewProps> = ({
  executions, selectedExecutionId, onSelectExecution, onRunPipeline, onNavigateToLedger, onReplayExecution,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'ESCALATED' | 'DENIED' | 'PENDING'>('ALL');
  const [activeGraphNode, setActiveGraphNode] = useState<string | null>(null);
  const [rawJsonOpen, setRawJsonOpen] = useState(false);

  const filtered = executions.filter((ex) => filter === 'ALL' || ex.status === filter);
  const selectedExecution = executions.find((ex) => ex.executionId === selectedExecutionId) || executions[0] || null;

  const graphNodes = [
    { id: 'request', label: '1. REQUEST', status: 'COMPLETED', icon: FileText },
    { id: 'context', label: '2. CONTEXT', status: 'COMPLETED', icon: Layers },
    { id: 'agent', label: '3. AGENT', status: 'COMPLETED', icon: Cpu },
    { id: 'proposal', label: '4. PROPOSAL', status: selectedExecution?.proposal ? 'COMPLETED' : 'PENDING', icon: Brain },
    { id: 'evidence', label: '5. EVIDENCE', status: (selectedExecution?.evidence.length ?? 0) > 0 ? 'COMPLETED' : 'PENDING', icon: ShieldCheck },
    { id: 'policy', label: '6. POLICY GATE', status: selectedExecution?.policyDecision ? 'COMPLETED' : 'PENDING', icon: Lock },
    { id: 'auth', label: '7. AUTHORIZATION', status: selectedExecution?.authorization ? 'COMPLETED' : 'PENDING', icon: ShieldCheck },
    { id: 'exec', label: '8. EXECUTION', status: selectedExecution?.status === 'COMPLETED' ? 'COMPLETED' : selectedExecution?.status === 'DENIED' ? 'DENIED' : 'PENDING', icon: Play },
    { id: 'event', label: '9. EVENT LEDGER', status: selectedExecution?.receipt ? 'COMPLETED' : 'PENDING', icon: GitCommit },
    { id: 'memory', label: '10. MEMORY', status: selectedExecution?.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING', icon: Brain },
  ];

  return (
    <div className="factory-enter space-y-5 pb-12">
      <header className="factory-panel factory-grid relative overflow-hidden p-5">
        <div className="factory-vignette pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-400/80">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />
              Runtime / Execution Control
            </div>
            <h1 className="flex items-center gap-2 text-xl font-bold font-mono uppercase tracking-tight text-neutral-100">
              <GitCommit className="h-5 w-5 text-cyan-400" />
              Execution Inspector
            </h1>
            <p className="mt-1 max-w-3xl text-xs font-mono leading-relaxed text-neutral-400">
              Deterministic lifecycle trace across request, reasoning, evidence, policy, authorization, execution, ledger and memory.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-neutral-800/90 bg-neutral-950/80 p-1 font-mono text-[10px]">
            {(['ALL', 'COMPLETED', 'ESCALATED', 'DENIED', 'PENDING'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-2.5 py-1.5 transition ${filter === f ? 'bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/30' : 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200'}`}>
                {f}<span className="ml-1.5 text-neutral-600">{f === 'ALL' ? executions.length : executions.filter((e) => e.status === f).length}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <aside className="lg:col-span-4 xl:col-span-3">
          <div className="factory-panel sticky top-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
              <div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">Execution Queue</div><div className="mt-0.5 font-mono text-xs font-semibold text-neutral-200">{filtered.length} traces</div></div>
              <Clock className="h-4 w-4 text-neutral-600" />
            </div>
            <div className="max-h-[760px] space-y-1.5 overflow-y-auto p-2">
              {filtered.length ? filtered.map((ex) => {
                const isSelected = selectedExecution?.executionId === ex.executionId;
                const statusClass = ex.status === 'COMPLETED' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' : ex.status === 'DENIED' ? 'text-rose-400 border-rose-500/30 bg-rose-500/5' : ex.status === 'ESCALATED' ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' : 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5';
                return (
                  <button key={ex.executionId} onClick={() => onSelectExecution(ex.executionId)} className={`group w-full rounded-lg border p-3 text-left transition ${isSelected ? 'border-cyan-400/50 bg-cyan-400/[0.06] shadow-[inset_2px_0_0_rgba(103,232,249,0.9)]' : 'border-neutral-800/80 bg-neutral-950/40 hover:border-neutral-700 hover:bg-neutral-900/70'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-neutral-200">{ex.executionId}</span>
                      <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] ${statusClass}`}>{ex.status}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-neutral-300">{ex.request.input}</p>
                    <div className="mt-2 flex items-center justify-between border-t border-neutral-900 pt-2 font-mono text-[9px] text-neutral-600">
                      <span className="max-w-[55%] truncate text-neutral-500">{ex.agentReasoning.specialist}</span><span>{new Date(ex.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </button>
                );
              }) : <div className="p-6 text-center font-mono text-[10px] text-neutral-600">NO EXECUTION TRACES MATCH FILTER</div>}
            </div>
          </div>
        </aside>

        <main className="min-w-0 lg:col-span-8 xl:col-span-9">
          {selectedExecution ? (
            <div className="space-y-5">
              <section className="factory-panel factory-grid overflow-hidden p-4">
                <div className="flex flex-col gap-3 border-b border-neutral-800 pb-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-400/70">Active Execution Trace</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-neutral-100">{selectedExecution.executionId}</span>
                      <span className="text-neutral-700">/</span><span className="font-mono text-[10px] text-neutral-500">{selectedExecution.traceId}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onReplayExecution(selectedExecution.executionId)} className="flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 font-mono text-[10px] text-purple-300 transition hover:border-purple-400/40 hover:bg-purple-400/10"><RotateCcw className="h-3 w-3" />REPLAY</button>
                    {selectedExecution.status === 'PENDING' && <button onClick={() => onRunPipeline(selectedExecution.executionId)} className="flex items-center gap-1.5 rounded-md border border-cyan-400/50 bg-cyan-400/10 px-2.5 py-1.5 font-mono text-[10px] font-bold text-cyan-300 transition hover:bg-cyan-400/20"><Play className="h-3 w-3 fill-current" />RUN PIPELINE</button>}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                  {graphNodes.map((node, index) => {
                    const Icon = node.icon; const selected = activeGraphNode === node.id;
                    const state = node.status === 'DENIED' ? 'border-rose-500/30 text-rose-300' : node.status === 'COMPLETED' ? 'border-emerald-500/25 text-emerald-300' : 'border-neutral-800 text-neutral-500';
                    return <button key={node.id} onClick={() => setActiveGraphNode(selected ? null : node.id)} className={`relative min-h-[68px] rounded-md border p-2 text-left transition ${selected ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/30' : `${state} bg-neutral-950/70 hover:border-neutral-600`}`}>
                      {index < graphNodes.length - 1 && <span className="pointer-events-none absolute -right-2 top-1/2 z-10 hidden h-px w-2 bg-neutral-700 sm:block" />}
                      <div className="flex items-center justify-between"><Icon className="h-3.5 w-3.5" /><span className="font-mono text-[8px] text-neutral-600">{node.status}</span></div>
                      <div className="mt-2 truncate font-mono text-[9px] font-semibold">{node.label}</div>
                    </button>;
                  })}
                </div>
              </section>

              <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {[
                  ['STATUS', selectedExecution.status], ['DOMAIN', selectedExecution.request.domain], ['ACTOR', selectedExecution.actorId], ['MODE', selectedExecution.mode],
                ].map(([label, value]) => <div key={label} className="factory-panel-raised p-3"><div className="font-mono text-[9px] uppercase tracking-[0.16em] text-neutral-600">{label}</div><div className="mt-1 truncate font-mono text-[11px] font-semibold text-neutral-200">{value}</div></div>)}
              </section>

              <div className="space-y-4">
                <div className="factory-panel-raised p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-cyan-400" /><h3 className="font-mono text-[11px] font-bold uppercase text-neutral-200">01 / Observation & Context</h3></div><span className="font-mono text-[9px] text-neutral-600">TRACE {selectedExecution.traceId}</span></div>
                  <p className="rounded-md border border-neutral-800 bg-neutral-950/80 p-3 font-mono text-xs leading-relaxed text-neutral-200">{selectedExecution.request.input}</p>
                </div>

                <div className="factory-panel-raised p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2"><div className="flex items-center gap-2"><Cpu className="h-4 w-4 text-purple-400" /><h3 className="font-mono text-[11px] font-bold uppercase text-neutral-200">02 / Specialist Reasoning</h3></div><span className="font-mono text-[9px] text-purple-400">{selectedExecution.agentReasoning.specialist}</span></div>
                  <div className="space-y-1.5">{selectedExecution.agentReasoning.steps.length ? selectedExecution.agentReasoning.steps.map((step) => <div key={step.step} className="flex items-start gap-2.5 rounded-md border border-neutral-800 bg-neutral-950/70 p-2.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-purple-500/30 bg-purple-500/10 font-mono text-[9px] font-bold text-purple-300">{step.step}</span><span className="font-mono text-[11px] leading-relaxed text-neutral-300">{step.thought}</span></div>) : <div className="font-mono text-[10px] text-neutral-600">AWAITING PIPELINE EXECUTION</div>}</div>
                </div>

                {selectedExecution.proposal && <div className="factory-panel-raised p-4 space-y-3">
                  <div className="flex flex-col gap-2 border-b border-neutral-800 pb-2 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-2"><Brain className="h-4 w-4 text-cyan-400" /><h3 className="font-mono text-[11px] font-bold uppercase text-neutral-200">03–04 / Proposal & Evidence</h3></div><div className="font-mono text-[9px] text-neutral-500">RISK <b className="text-neutral-200">{selectedExecution.proposal.riskScore}</b> / CONFIDENCE <b className="text-neutral-200">{selectedExecution.proposal.confidence}%</b></div></div>
                  <div className="rounded-md border border-cyan-500/15 bg-cyan-400/[0.025] p-3 font-mono"><div className="flex flex-wrap justify-between gap-2 text-[10px]"><span className="font-bold text-cyan-300">{selectedExecution.proposal.type}</span><span className="text-neutral-600">TARGET {selectedExecution.proposal.targetResource}</span></div><p className="mt-2 text-xs text-neutral-200">{selectedExecution.proposal.summary}</p><p className="mt-2 text-[10px] text-neutral-500">EXPECTED IMPACT: {selectedExecution.proposal.expectedImpact}</p></div>
                  {selectedExecution.evidence.length > 0 && <div className="space-y-1.5"><div className="font-mono text-[9px] uppercase tracking-[0.16em] text-neutral-600">Grounded Evidence / {selectedExecution.evidence.length}</div>{selectedExecution.evidence.map((evi) => <div key={evi.id} className="rounded-md border border-neutral-800 bg-neutral-950/70 p-2.5 font-mono"><div className="flex flex-wrap items-center justify-between gap-2 text-[10px]"><span className="font-semibold text-neutral-300">{evi.source}</span><span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="h-3 w-3" />{evi.confidence}%</span></div><p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">{evi.claim}</p><div className="mt-2 flex flex-wrap gap-1 border-t border-neutral-900 pt-2 text-[8px] text-neutral-600">{evi.provenanceTrail.map((p, i) => <span key={i} className="rounded border border-neutral-800 px-1.5 py-0.5">{p}</span>)}</div></div>)}</div>}
                </div>}

                {selectedExecution.policyDecision && <div className="factory-panel-raised p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2"><div className="flex items-center gap-2"><Lock className="h-4 w-4 text-emerald-400" /><h3 className="font-mono text-[11px] font-bold uppercase text-neutral-200">05 / Deterministic Policy Gate</h3></div><span className={`rounded border px-2 py-0.5 font-mono text-[9px] font-bold ${selectedExecution.policyDecision.outcome === 'ALLOW' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : selectedExecution.policyDecision.outcome === 'DENY' ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>{selectedExecution.policyDecision.outcome}</span></div>
                  <p className="rounded-md border border-neutral-800 bg-neutral-950/70 p-3 font-mono text-[11px] leading-relaxed text-neutral-300">{selectedExecution.policyDecision.reason}</p>
                  <div className="space-y-1">{selectedExecution.policyDecision.appliedPolicies.map((pol) => <div key={pol.policyId} className="flex items-center justify-between rounded border border-neutral-800 bg-neutral-950/60 px-2.5 py-2 font-mono text-[10px]"><span className="text-neutral-400">{pol.policyName}</span><span className={pol.effect === 'ALLOW' ? 'text-emerald-400' : pol.effect === 'DENY' ? 'text-rose-400' : 'text-amber-400'}>{pol.effect}</span></div>)}</div>
                </div>}

                {selectedExecution.executionResult && <div className="factory-panel-raised p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /><h3 className="font-mono text-[11px] font-bold uppercase text-neutral-200">06–09 / Execution & Canonical Receipt</h3></div><span className="font-mono text-[9px] text-neutral-500">{selectedExecution.executionResult.durationMs}ms</span></div>
                  <div className="rounded-md border border-neutral-800 bg-neutral-950/70 p-3 font-mono text-[10px]"><div className="mb-1 uppercase tracking-[0.12em] text-neutral-600">Side Effects</div><ul className="list-disc space-y-0.5 pl-4 text-neutral-300">{selectedExecution.executionResult.sideEffects.map((eff, i) => <li key={i}>{eff}</li>)}</ul></div>
                  {selectedExecution.receipt && <div className="flex flex-col gap-2 rounded-md border border-cyan-500/15 bg-cyan-400/[0.025] p-3 font-mono text-[10px] md:flex-row md:items-center md:justify-between"><div><span className="text-neutral-600">CANONICAL EVENT </span><button onClick={() => onNavigateToLedger(selectedExecution.receipt!.eventId)} className="font-bold text-cyan-400 hover:underline">{selectedExecution.receipt.eventId}</button></div><span className="truncate text-neutral-600">RECEIPT {selectedExecution.receipt.txHash}</span></div>}
                </div>}
              </div>

              <div className="border-t border-neutral-900 pt-2">
                <button onClick={() => setRawJsonOpen(!rawJsonOpen)} className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-600 transition hover:text-neutral-300">{rawJsonOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}{rawJsonOpen ? 'HIDE' : 'INSPECT'} RAW EXECUTION CONTEXT JSON</button>
                {rawJsonOpen && <pre className="mt-2 max-h-80 overflow-x-auto rounded-md border border-neutral-800 bg-neutral-950 p-3 font-mono text-[9px] leading-relaxed text-neutral-400">{JSON.stringify(selectedExecution, null, 2)}</pre>}
              </div>
            </div>
          ) : <div className="factory-panel p-12 text-center font-mono text-xs text-neutral-600">SELECT AN EXECUTION TRACE TO INSPECT ITS LIFECYCLE</div>}
        </main>
      </div>
    </div>
  );
};