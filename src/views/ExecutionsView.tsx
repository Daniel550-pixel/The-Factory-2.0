import React, { useState } from 'react';
import {
  GitCommit,
  Layers,
  Cpu,
  Brain,
  ShieldCheck,
  ShieldAlert,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  Code,
  Sparkles,
  Lock,
  FileText,
  Clock,
  ChevronDown,
  ChevronRight,
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
  executions,
  selectedExecutionId,
  onSelectExecution,
  onRunPipeline,
  onNavigateToLedger,
  onReplayExecution,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'ESCALATED' | 'DENIED' | 'PENDING'>('ALL');
  const [activeGraphNode, setActiveGraphNode] = useState<string | null>(null);
  const [rawJsonOpen, setRawJsonOpen] = useState(false);

  const filtered = executions.filter((ex) => {
    if (filter === 'ALL') return true;
    return ex.status === filter;
  });

  const selectedExecution =
    executions.find((ex) => ex.executionId === selectedExecutionId) || executions[0] || null;

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
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-lg font-bold font-mono text-neutral-100 uppercase tracking-wide flex items-center gap-2">
            <GitCommit className="h-5 w-5 text-cyan-400" />
            <span>Execution Lifecycle & Graph Inspector</span>
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Trace every execution across all 10 stages: Observation → Reasoning → Proposal → Evidence → Verification → Policy Gate → Ledger Event
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center rounded-lg bg-neutral-900 p-1 border border-neutral-800 text-xs font-mono">
          {(['ALL', 'COMPLETED', 'ESCALATED', 'DENIED', 'PENDING'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md transition ${
                filter === f
                  ? 'bg-neutral-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Execution List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-mono font-semibold text-neutral-400 uppercase mb-2">
            Executions List ({filtered.length})
          </div>

          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {filtered.map((ex) => {
              const isSelected = selectedExecution?.executionId === ex.executionId;
              const isComplete = ex.status === 'COMPLETED';
              const isDenied = ex.status === 'DENIED';
              const isEscalated = ex.status === 'ESCALATED';

              return (
                <div
                  key={ex.executionId}
                  onClick={() => onSelectExecution(ex.executionId)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'border-cyan-500/60 bg-neutral-900/90 shadow-md ring-1 ring-cyan-500/30'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono font-bold text-xs text-neutral-200">
                      {ex.executionId}
                    </span>
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
                      {ex.status}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 font-medium line-clamp-2 mb-2">
                    {ex.request.input}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-2 border-t border-neutral-900">
                    <span className="truncate">{ex.agentReasoning.specialist}</span>
                    <span>{new Date(ex.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Execution Graph & Detailed 10-Stage Inspector */}
        <div className="lg:col-span-8 space-y-6">
          {selectedExecution ? (
            <div className="space-y-6">
              {/* 1. Interactive Visual Execution Graph */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-neutral-300 uppercase">
                    Execution Pipeline Graph: {selectedExecution.executionId}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onReplayExecution(selectedExecution.executionId)}
                      className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-purple-300 flex items-center gap-1.5 transition"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Replay In Isolation</span>
                    </button>
                    {selectedExecution.status === 'PENDING' && (
                      <button
                        onClick={() => onRunPipeline(selectedExecution.executionId)}
                        className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-mono font-bold text-neutral-950 flex items-center gap-1.5 transition"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Run Full Pipeline</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Graph Node Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                  {graphNodes.map((node) => {
                    const isSelectedNode = activeGraphNode === node.id;
                    const Icon = node.icon;
                    return (
                      <button
                        key={node.id}
                        onClick={() => setActiveGraphNode(isSelectedNode ? null : node.id)}
                        className={`p-2 rounded-lg border text-left font-mono text-xs transition flex flex-col justify-between h-16 ${
                          isSelectedNode
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-400'
                            : node.status === 'COMPLETED'
                            ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300 hover:border-emerald-500/60'
                            : node.status === 'DENIED'
                            ? 'border-rose-500/30 bg-rose-500/5 text-rose-300'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-[9px] px-1 rounded bg-neutral-900 border border-neutral-800">
                            {node.status}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold truncate mt-1">
                          {node.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Structured Lifecycle Inspector Stages */}
              <div className="space-y-4">
                {/* Stage 1: Request & Context */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-cyan-400" />
                      <h3 className="text-xs font-bold font-mono text-neutral-200 uppercase">
                        Stage 1: Observation & Context Assembly
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Trace: {selectedExecution.traceId}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-mono text-neutral-400 text-[11px]">User / System Request:</span>
                      <p className="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 mt-1 font-mono">
                        {selectedExecution.request.input}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] font-mono pt-1">
                      <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                        <span className="text-neutral-400 block">Domain:</span>
                        <span className="font-semibold text-neutral-200">{selectedExecution.request.domain}</span>
                      </div>
                      <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                        <span className="text-neutral-400 block">Actor:</span>
                        <span className="font-semibold text-neutral-200">{selectedExecution.actorId}</span>
                      </div>
                      <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                        <span className="text-neutral-400 block">Runtime Mode:</span>
                        <span className="font-semibold text-cyan-400">{selectedExecution.mode}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 2: Specialist Agent Reasoning */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-purple-400" />
                      <h3 className="text-xs font-bold font-mono text-neutral-200 uppercase">
                        Stage 2: Specialist Agent Reasoning ({selectedExecution.agentReasoning.specialist})
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-purple-400">
                      AI Reasoning ≠ Authorized Execution
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedExecution.agentReasoning.steps.length > 0 ? (
                      selectedExecution.agentReasoning.steps.map((step) => (
                        <div
                          key={step.step}
                          className="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono flex items-start gap-2.5"
                        >
                          <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded bg-purple-950 text-purple-300 font-bold text-[10px] border border-purple-800">
                            {step.step}
                          </span>
                          <span className="text-neutral-300 leading-relaxed">{step.thought}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-xs font-mono text-neutral-500">
                        Awaiting pipeline execution trigger...
                      </div>
                    )}
                  </div>
                </div>

                {/* Stage 3: Proposal & Evidence */}
                {selectedExecution.proposal && (
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-cyan-400" />
                        <h3 className="text-xs font-bold font-mono text-neutral-200 uppercase">
                          Stage 3 & 4: Action Proposal & Evidentiary Claims
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span>Risk: <strong className="text-neutral-100">{selectedExecution.proposal.riskScore}/100</strong></span>
                        <span>Confidence: <strong className="text-neutral-100">{selectedExecution.proposal.confidence}%</strong></span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1.5 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-cyan-300">
                            PROPOSAL TYPE: {selectedExecution.proposal.type}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            Target: {selectedExecution.proposal.targetResource}
                          </span>
                        </div>
                        <p className="text-neutral-200">{selectedExecution.proposal.summary}</p>
                        <div className="text-[11px] text-neutral-400">
                          <strong>Expected Impact:</strong> {selectedExecution.proposal.expectedImpact}
                        </div>
                      </div>

                      {/* Evidence List */}
                      {selectedExecution.evidence.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-mono text-neutral-400 uppercase">
                            Grounded Evidence ({selectedExecution.evidence.length})
                          </span>
                          {selectedExecution.evidence.map((evi) => (
                            <div
                              key={evi.id}
                              className="p-2.5 rounded bg-neutral-900/60 border border-neutral-800 text-xs font-mono space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-neutral-300 font-semibold">{evi.source}</span>
                                <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {evi.confidence}% Confidence
                                </span>
                              </div>
                              <p className="text-neutral-400">{evi.claim}</p>
                              <div className="text-[10px] text-neutral-400 flex items-center gap-2 pt-1 border-t border-neutral-900">
                                <span>Provenance:</span>
                                {evi.provenanceTrail.map((p, i) => (
                                  <span key={i} className="px-1 py-0.2 rounded bg-neutral-950 border border-neutral-800">
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stage 4: Policy Gate Decision */}
                {selectedExecution.policyDecision && (
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-emerald-400" />
                        <h3 className="text-xs font-bold font-mono text-neutral-200 uppercase">
                          Stage 5: Policy Gate Decision (Deterministic Kernel)
                        </h3>
                      </div>
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                          selectedExecution.policyDecision.outcome === 'ALLOW'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : selectedExecution.policyDecision.outcome === 'DENY'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {selectedExecution.policyDecision.outcome}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <p className="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-200">
                        {selectedExecution.policyDecision.reason}
                      </p>

                      <div className="space-y-1">
                        <span className="text-[11px] text-neutral-400 uppercase">
                          Applied Deterministic Rules:
                        </span>
                        {selectedExecution.policyDecision.appliedPolicies.map((pol) => (
                          <div
                            key={pol.policyId}
                            className="p-2 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-between text-[11px]"
                          >
                            <span className="text-neutral-300">{pol.policyName}</span>
                            <span
                              className={`font-semibold ${
                                pol.effect === 'ALLOW'
                                  ? 'text-emerald-400'
                                  : pol.effect === 'DENY'
                                  ? 'text-rose-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {pol.effect}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Stage 5: Execution Result & Canonical Event */}
                {selectedExecution.executionResult && (
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <h3 className="text-xs font-bold font-mono text-neutral-200 uppercase">
                          Stage 6 & 7: Authorized Execution & Canonical Event Receipt
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-neutral-400">
                        Duration: {selectedExecution.executionResult.durationMs}ms
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                        <span className="text-neutral-400 block text-[10px]">Side Effects:</span>
                        <ul className="list-disc list-inside text-neutral-300 mt-1 space-y-0.5">
                          {selectedExecution.executionResult.sideEffects.map((eff, i) => (
                            <li key={i}>{eff}</li>
                          ))}
                        </ul>
                      </div>

                      {selectedExecution.receipt && (
                        <div className="p-2.5 rounded bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                          <div>
                            <span className="text-neutral-400">Canonical Event: </span>
                            <button
                              onClick={() => onNavigateToLedger(selectedExecution.receipt!.eventId)}
                              className="text-cyan-400 hover:underline font-bold"
                            >
                              {selectedExecution.receipt.eventId}
                            </button>
                          </div>
                          <div className="text-neutral-400 truncate max-w-xs">
                            Receipt: {selectedExecution.receipt.txHash}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Raw JSON Toggle */}
                <div className="pt-2">
                  <button
                    onClick={() => setRawJsonOpen(!rawJsonOpen)}
                    className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-neutral-200"
                  >
                    {rawJsonOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    <span>{rawJsonOpen ? 'Hide' : 'Inspect'} Raw Execution Context JSON</span>
                  </button>

                  {rawJsonOpen && (
                    <pre className="mt-2 p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-80">
                      {JSON.stringify(selectedExecution, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-neutral-500 font-mono text-xs">
              Select an execution to inspect its complete lifecycle.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
