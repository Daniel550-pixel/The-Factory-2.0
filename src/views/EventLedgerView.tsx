import React, { useState } from 'react';
import {
  Database,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Lock,
  ArrowRight,
  Code,
  Bug,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { CanonicalEvent, EventType } from '../types';

interface EventLedgerViewProps {
  events: CanonicalEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: CanonicalEvent) => void;
  onVerifyIntegrity: () => Promise<{ isValid: boolean; corruptedIndex?: number }>;
  onSimulateTamper: () => Promise<void>;
  onRestoreLedger: () => Promise<void>;
  onNavigateToExecution: (executionId: string) => void;
}

export const EventLedgerView: React.FC<EventLedgerViewProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  onVerifyIntegrity,
  onSimulateTamper,
  onRestoreLedger,
  onNavigateToExecution,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationResult, setVerificationResult] = useState<{ isValid: boolean; corruptedIndex?: number } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;
  const filteredEvents = events.filter((e) => {
    if (filterType !== 'ALL' && e.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return e.id.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || e.executionId.toLowerCase().includes(q) || e.currentEventHash.toLowerCase().includes(q) || e.actor.name.toLowerCase().includes(q);
    }
    return true;
  });

  const handleVerify = async () => {
    setIsVerifying(true);
    try { setVerificationResult(await onVerifyIntegrity()); } finally { setIsVerifying(false); }
  };

  return (
    <div className="factory-enter factory-grid space-y-6 pb-12 font-mono text-xs">
      <header className="factory-panel factory-scan rounded-xl p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-cyan-400"><Database className="h-4 w-4" /> Runtime / Integrity</div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-100 uppercase">Cryptographic Event Ledger</h1>
            <p className="mt-1 max-w-3xl text-[11px] leading-5 text-neutral-400">Immutable, ordered, SHA-256 chained source of truth for all state transitions and policy decisions.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleVerify} disabled={isVerifying} className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[10px] text-emerald-300 transition hover:bg-emerald-500/20 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />{isVerifying ? 'VERIFYING...' : 'VERIFY INTEGRITY'}</button>
            <button onClick={onSimulateTamper} className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-300 transition hover:bg-rose-500/20 flex items-center gap-1.5"><Bug className="h-3.5 w-3.5" />SIMULATE TAMPER</button>
            <button onClick={onRestoreLedger} className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-[10px] text-neutral-300 transition hover:bg-neutral-800 flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" />RESTORE LEDGER</button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3">
          <div className="factory-panel-raised rounded-lg px-3 py-2.5"><div className="text-[9px] uppercase tracking-wider text-neutral-500">CANONICAL BLOCKS</div><div className="mt-1 text-lg font-bold text-cyan-300">{events.length}</div></div>
          <div className="factory-panel-raised rounded-lg px-3 py-2.5"><div className="text-[9px] uppercase tracking-wider text-neutral-500">CHAIN</div><div className="mt-1 text-lg font-bold text-emerald-300">SHA-256</div></div>
          <div className="factory-panel-raised rounded-lg px-3 py-2.5"><div className="text-[9px] uppercase tracking-wider text-neutral-500">INTEGRITY</div><div className="mt-1 text-lg font-bold text-neutral-100">VERIFIABLE</div></div>
        </div>
      </header>

      {verificationResult && <div className={`factory-panel rounded-xl p-3.5 flex items-center justify-between ${verificationResult.isValid ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/60 bg-rose-950/30 text-rose-200 animate-pulse'}`}><div className="flex items-center gap-2">{verificationResult.isValid ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-rose-400" />}<span>{verificationResult.isValid ? `CRYPTOGRAPHIC CHECK PASSED: All ${events.length} block hashes are unbroken.` : `CRITICAL TAMPER DETECTED at event index ${verificationResult.corruptedIndex}! Hash link broken.`}</span></div><span className="text-[10px] text-neutral-400">{new Date().toLocaleTimeString()}</span></div>}

      <div className="factory-panel rounded-xl p-3 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative"><Search className="h-4 w-4 absolute left-3 top-2.5 text-neutral-500" /><input type="text" placeholder="Search event ID, name, hash, actor, execution..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-9 pr-4 py-2 text-xs text-neutral-200 placeholder-neutral-600 focus:border-cyan-500/60 focus:outline-none" /></div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 focus:border-cyan-500/60 focus:outline-none"><option value="ALL">ALL EVENT TYPES</option><option value="STATE_TRANSITION">STATE_TRANSITION</option><option value="POLICY_DECISION">POLICY_DECISION</option><option value="EXECUTION_COMPLETED">EXECUTION_COMPLETED</option><option value="ESCALATION_TRIGGERED">ESCALATION_TRIGGERED</option><option value="HUMAN_APPROVAL">HUMAN_APPROVAL</option><option value="MEMORY_COMMITTED">MEMORY_COMMITTED</option></select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="factory-panel lg:col-span-5 rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between border-b border-neutral-800 pb-3"><div><div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Canonical Stream</div><div className="mt-0.5 text-sm font-bold text-neutral-100">Event Blocks</div></div><span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-[9px] text-cyan-300">{filteredEvents.length} BLOCKS</span></div>
          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filteredEvents.map((evt) => {
              const isSelected = selectedEvent?.id === evt.id;
              const isCorrupted = evt.integrityStatus === 'TAMPERED';
              return <div key={evt.id} onClick={() => onSelectEvent(evt)} className={`factory-panel-raised rounded-xl p-3 transition cursor-pointer text-left ${isSelected ? 'border-cyan-500/60 ring-1 ring-cyan-500/30' : isCorrupted ? 'border-rose-500/60 bg-rose-950/30' : 'hover:border-neutral-700'}`}>
                <div className="flex items-center justify-between gap-2 mb-1"><span className="font-bold text-cyan-400">{evt.id}</span><span className={`text-[9px] px-1.5 py-0.5 rounded border ${isCorrupted ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold' : 'bg-neutral-900 text-neutral-400 border-neutral-800'}`}>{evt.integrityStatus}</span></div>
                <div className="text-xs font-semibold text-neutral-200 truncate">{evt.name}</div>
                <div className="text-[11px] text-neutral-400 flex items-center justify-between mt-1"><span>Type: {evt.type}</span><span>{new Date(evt.timestamp).toLocaleTimeString()}</span></div>
                <div className="mt-2 pt-1.5 border-t border-neutral-800 text-[10px] text-neutral-500 flex items-center justify-between"><span className="truncate max-w-[180px]">Hash: {evt.currentEventHash.substring(0, 16)}...</span><span>Ex: {evt.executionId}</span></div>
              </div>;
            })}
          </div>
        </section>

        <section className="lg:col-span-7 space-y-5">
          {selectedEvent ? <>
            <div className="factory-panel-raised rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3"><div><div className="text-[9px] tracking-wider text-neutral-600">CANONICAL EVENT ID</div><h2 className="mt-1 text-base font-bold text-cyan-300">{selectedEvent.id}</h2></div><div className="text-right"><div className="text-[9px] text-neutral-600">RECORDED</div><span className="text-neutral-200">{new Date(selectedEvent.timestamp).toLocaleString()}</span></div></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2"><div className="factory-panel rounded-lg p-2.5"><span className="text-neutral-500 block">TYPE</span><span className="font-semibold text-neutral-200">{selectedEvent.type}</span></div><div className="factory-panel rounded-lg p-2.5"><span className="text-neutral-500 block">ACTOR</span><span className="font-semibold text-neutral-200">{selectedEvent.actor.name}</span></div><div className="factory-panel rounded-lg p-2.5"><span className="text-neutral-500 block">EXECUTION</span><button onClick={() => onNavigateToExecution(selectedEvent.executionId)} className="text-cyan-400 hover:underline font-bold">{selectedEvent.executionId}</button></div></div>
              <div className="space-y-2"><span className="text-[11px] font-bold text-neutral-300 uppercase flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-cyan-400" /> Cryptographic SHA-256 Hash Chain</span><div className="factory-panel rounded-lg p-3 text-[11px] space-y-2"><div><span className="text-neutral-500 block">PREVIOUS EVENT HASH</span><code className="text-neutral-300 break-all">{selectedEvent.previousEventHash}</code></div><div className="pt-2 border-t border-neutral-800"><span className="text-cyan-400 block">CURRENT EVENT HASH</span><code className="text-cyan-300 break-all font-bold">{selectedEvent.currentEventHash}</code></div></div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2"><div className="factory-panel rounded-lg p-2.5"><span className="text-neutral-500 block">CAUSATION</span><span className="text-neutral-200 font-semibold">{selectedEvent.causation}</span></div><div className="factory-panel rounded-lg p-2.5"><span className="text-neutral-500 block">CORRELATION</span><span className="text-neutral-200 font-semibold">{selectedEvent.correlation}</span></div></div>
              <div className="factory-panel rounded-lg p-3"><span className="text-neutral-500 block">PROVENANCE SOURCE</span><span className="text-neutral-200 font-medium">{selectedEvent.provenance.source}</span><div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] text-neutral-500"><span>CHAIN:</span>{selectedEvent.provenance.chain.map((c, i) => <span key={i} className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">{c}</span>)}</div></div>
            </div>
            <div className="factory-panel rounded-xl p-4 space-y-2"><div className="flex items-center gap-2 border-b border-neutral-800 pb-2 text-xs font-bold text-neutral-200"><Code className="h-4 w-4 text-cyan-400" /> STRUCTURED EVENT PAYLOAD</div><pre className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-cyan-200 overflow-x-auto max-h-96">{JSON.stringify(selectedEvent.payload, null, 2)}</pre></div>
          </> : <div className="factory-panel rounded-xl p-12 text-center text-neutral-500">Select an event block to inspect its complete cryptographic record.</div>}
        </section>
      </div>
    </div>
  );
};
