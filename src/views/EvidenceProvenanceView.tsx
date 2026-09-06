import React, { useState } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  ShieldCheck,
  Database,
  ArrowRight,
  ExternalLink,
  Layers,
  Cpu,
  Lock,
  GitCommit,
} from 'lucide-react';
import type { EvidenceRecord, ExecutionContext } from '../types';

interface EvidenceProvenanceViewProps {
  executions: ExecutionContext[];
  onNavigateToExecution: (id: string) => void;
}

export const EvidenceProvenanceView: React.FC<EvidenceProvenanceViewProps> = ({
  executions,
  onNavigateToExecution,
}) => {
  const allEvidence: (EvidenceRecord & { executionId: string; specialist: string })[] = [];
  executions.forEach((ex) => {
    ex.evidence.forEach((ev) => {
      allEvidence.push({ ...ev, executionId: ex.executionId, specialist: ex.agentReasoning.specialist });
    });
  });

  const [selectedEvidence, setSelectedEvidence] = useState(allEvidence[0] || null);

  const provenanceChain = [
    { step: '1. RAW SOURCE', desc: selectedEvidence?.source || 'Sensor / SCADA / DB', icon: Database },
    { step: '2. OBSERVATION', desc: 'Timestamped Telemetry Ingest', icon: Layers },
    { step: '3. GROUNDED CLAIM', desc: selectedEvidence?.claim.substring(0, 45) + '...', icon: ShieldCheck },
    { step: '4. AGENT REASONING', desc: selectedEvidence?.specialist || 'Specialist Agent', icon: Cpu },
    { step: '5. POLICY GATE', desc: 'Deterministic Evaluation', icon: Lock },
    { step: '6. CANONICAL EVENT', desc: 'Immutable SHA-256 Ledger Record', icon: GitCommit },
  ];

  return (
    <div className="factory-enter factory-grid space-y-6 pb-12">
      <div className="factory-panel factory-scan rounded-xl p-5 border-b border-neutral-800">
        <div className="text-[10px] font-mono text-cyan-300 tracking-[0.2em] uppercase">Evidence / Provenance Control Plane</div>
        <h1 className="text-lg font-bold font-mono text-neutral-100 uppercase tracking-wide flex items-center gap-2 mt-1"><GitPullRequest className="h-5 w-5 text-cyan-400" /><span>Evidence Grounding & Provenance Chain</span></h1>
        <p className="text-xs text-neutral-400 font-mono mt-0.5">Every claim and action must trace directly back to verifiable source data: Claim → Source → Evidence → Transformation → Agent → Decision → Execution → Event</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="factory-panel-raised rounded-xl p-4"><div className="text-[10px] text-neutral-500 font-mono uppercase">Evidence Registry</div><div className="text-2xl font-bold text-neutral-100 font-mono mt-1">{allEvidence.length}</div><div className="text-[10px] text-neutral-500 font-mono">grounded records</div></div>
        <div className="factory-panel-raised rounded-xl p-4"><div className="text-[10px] text-neutral-500 font-mono uppercase">Source Integrity</div><div className="text-2xl font-bold text-emerald-300 font-mono mt-1">VERIFIED</div><div className="text-[10px] text-neutral-500 font-mono">traceable origin required</div></div>
        <div className="factory-panel-raised rounded-xl p-4"><div className="text-[10px] text-neutral-500 font-mono uppercase">Provenance Depth</div><div className="text-2xl font-bold text-cyan-300 font-mono mt-1">06</div><div className="text-[10px] text-neutral-500 font-mono">causal verification stages</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between"><span className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest">Grounded Evidence Registry</span><span className="text-[10px] text-neutral-600 font-mono">{allEvidence.length} records</span></div>
          <div className="factory-panel rounded-xl p-3 space-y-2 max-h-[700px] overflow-y-auto font-mono text-xs">
            {allEvidence.map((evi) => {
              const isSelected = selectedEvidence?.id === evi.id;
              return (
                <div key={evi.id + evi.executionId} onClick={() => setSelectedEvidence(evi)} className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${isSelected ? 'border-cyan-500/60 bg-neutral-900/90 ring-1 ring-cyan-500/30 factory-node-active' : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-900/40'}`}>
                  <div className="flex items-center justify-between"><span className="font-bold text-neutral-200 truncate">{evi.source}</span><span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{evi.confidence}%</span></div>
                  <p className="text-neutral-300 line-clamp-2 font-sans text-xs">{evi.claim}</p>
                  <div className="pt-1.5 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-400"><span className="text-cyan-400">{evi.executionId}</span><span>{evi.specialist}</span></div>
                </div>
              );
            })}
            {!allEvidence.length && <div className="p-10 text-center text-neutral-600">No grounded evidence records available.</div>}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {selectedEvidence ? (
            <div className="space-y-4">
              <div className="factory-panel-raised rounded-xl p-5 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2"><h2 className="font-bold text-neutral-100 uppercase">End-to-End Provenance Pipeline</h2><span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]"><CheckCircle2 className="h-3.5 w-3.5" />VERIFIED SOURCE</span></div>
                <div className="space-y-2">
                  {provenanceChain.map((node, index) => {
                    const Icon = node.icon;
                    return <div key={node.step} className="space-y-1"><div className="factory-panel rounded-lg p-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2.5"><div className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-cyan-400"><Icon className="h-4 w-4" /></div><div><div className="font-bold text-neutral-200">{node.step}</div><div className="text-[11px] text-neutral-400 font-sans">{node.desc}</div></div></div><span className="text-[10px] text-neutral-400">Step {index + 1}/6</span></div>{index < provenanceChain.length - 1 && <div className="flex justify-center my-0.5"><ArrowRight className="h-3.5 w-3.5 text-neutral-600 rotate-90" /></div>}</div>;
                  })}
                </div>
              </div>

              <div className="factory-panel rounded-xl p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2"><span className="font-bold text-neutral-200 uppercase">Evidence Claim & Metadata</span><button onClick={() => onNavigateToExecution(selectedEvidence.executionId)} className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"><span>View Execution</span><ArrowRight className="h-3 w-3" /></button></div>
                <div className="space-y-2 text-neutral-300"><div className="p-2.5 rounded bg-neutral-900 border border-neutral-800 font-sans"><strong className="font-mono text-neutral-400 text-xs block mb-1">Grounded Claim:</strong>{selectedEvidence.claim}</div><div className="p-2.5 rounded bg-neutral-900 border border-neutral-800 space-y-1"><span className="text-neutral-400 text-[11px] block">Provenance Trail:</span><div className="flex flex-wrap gap-1.5">{selectedEvidence.provenanceTrail.map((item, i) => <span key={i} className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-cyan-300">{item}</span>)}</div></div></div>
              </div>
            </div>
          ) : <div className="factory-panel rounded-xl p-12 text-center text-neutral-500 font-mono text-xs">Select an evidence item to trace its provenance tree.</div>}
        </div>
      </div>
    </div>
  );
};
