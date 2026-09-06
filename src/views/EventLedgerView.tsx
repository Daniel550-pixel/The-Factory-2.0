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
      return (
        e.id.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.executionId.toLowerCase().includes(q) ||
        e.currentEventHash.toLowerCase().includes(q) ||
        e.actor.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await onVerifyIntegrity();
      setVerificationResult(res);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Verification & Tamper Testing */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-lg font-bold font-mono text-neutral-100 uppercase tracking-wide flex items-center gap-2">
            <Database className="h-5 w-5 text-cyan-400" />
            <span>Cryptographic Event Ledger Explorer</span>
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Immutable, ordered, SHA-256 chained source of truth for all state transitions and policy decisions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-mono text-emerald-300 transition flex items-center gap-1.5"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{isVerifying ? 'Verifying Hashes...' : 'Verify Ledger Integrity'}</span>
          </button>

          <button
            onClick={onSimulateTamper}
            className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-mono text-rose-300 transition flex items-center gap-1.5"
            title="Simulate unauthorized payload tampering to test verification"
          >
            <Bug className="h-3.5 w-3.5" />
            <span>Simulate Tamper</span>
          </button>

          <button
            onClick={onRestoreLedger}
            className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-300 transition flex items-center gap-1.5"
            title="Recompute clean hashes and restore valid integrity"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restore Ledger</span>
          </button>
        </div>
      </div>

      {/* Verification Banner */}
      {verificationResult && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
            verificationResult.isValid
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/60 bg-rose-500/20 text-rose-200 animate-pulse'
          }`}
        >
          <div className="flex items-center gap-2">
            {verificationResult.isValid ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>EXHAUSTIVE CRYPTOGRAPHIC CHECK PASSED: All {events.length} block hashes are mathematically unbroken.</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>
                  CRITICAL TAMPER DETECTED at event index {verificationResult.corruptedIndex}! Hash link broken between parent and child blocks.
                </span>
              </>
            )}
          </div>
          <span className="text-[10px] text-neutral-400">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by event ID, name, hash, actor, or execution ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 pl-9 pr-4 py-2 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-mono text-neutral-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="ALL">All Event Types</option>
          <option value="STATE_TRANSITION">STATE_TRANSITION</option>
          <option value="POLICY_DECISION">POLICY_DECISION</option>
          <option value="EXECUTION_COMPLETED">EXECUTION_COMPLETED</option>
          <option value="ESCALATION_TRIGGERED">ESCALATION_TRIGGERED</option>
          <option value="HUMAN_APPROVAL">HUMAN_APPROVAL</option>
          <option value="MEMORY_COMMITTED">MEMORY_COMMITTED</option>
        </select>
      </div>

      {/* Main Ledger Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chained Event Stream */}
        <div className="lg:col-span-5 space-y-2">
          <div className="text-xs font-mono font-semibold text-neutral-400 uppercase mb-2 flex items-center justify-between">
            <span>Canonical Blocks ({filteredEvents.length})</span>
            <span className="text-[10px] text-neutral-500">Linked by SHA-256</span>
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filteredEvents.map((evt, idx) => {
              const isSelected = selectedEvent?.id === evt.id;
              const isCorrupted = evt.integrityStatus === 'TAMPERED';

              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className={`p-3 rounded-xl border transition cursor-pointer text-left font-mono text-xs ${
                    isSelected
                      ? 'border-cyan-500/60 bg-neutral-900/90 shadow-md ring-1 ring-cyan-500/30'
                      : isCorrupted
                      ? 'border-rose-500/60 bg-rose-950/30'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-cyan-400">{evt.id}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border ${
                        isCorrupted
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                      }`}
                    >
                      {evt.integrityStatus}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-neutral-200 truncate">
                    {evt.name}
                  </div>

                  <div className="text-[11px] text-neutral-400 flex items-center justify-between mt-1">
                    <span>Type: {evt.type}</span>
                    <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-neutral-900 text-[10px] text-neutral-400 flex items-center justify-between">
                    <span className="truncate max-w-[180px]">
                      Hash: {evt.currentEventHash.substring(0, 16)}...
                    </span>
                    <span className="text-neutral-400">Ex: {evt.executionId}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Complete Structured Payload & Hash Linkage Inspector */}
        <div className="lg:col-span-7 space-y-6">
          {selectedEvent ? (
            <div className="space-y-6">
              {/* Event Header & Integrity Card */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div>
                    <span className="text-[11px] text-neutral-400 block">CANONICAL EVENT ID</span>
                    <h2 className="text-sm font-bold text-cyan-400">{selectedEvent.id}</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-neutral-400 block">RECORDED TIMESTAMP</span>
                    <span className="text-neutral-200">{new Date(selectedEvent.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-400 block">Event Type:</span>
                    <span className="font-semibold text-neutral-200">{selectedEvent.type}</span>
                  </div>
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-400 block">Actor:</span>
                    <span className="font-semibold text-neutral-200">{selectedEvent.actor.name}</span>
                  </div>
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-400 block">Execution:</span>
                    <button
                      onClick={() => onNavigateToExecution(selectedEvent.executionId)}
                      className="text-cyan-400 hover:underline font-bold"
                    >
                      {selectedEvent.executionId}
                    </button>
                  </div>
                </div>

                {/* Cryptographic Hash Chaining Verification */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-neutral-300 uppercase flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-cyan-400" />
                    Cryptographic SHA-256 Hash Chain
                  </span>

                  <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 text-[11px] space-y-1">
                    <div>
                      <span className="text-neutral-400 block">Previous Event Hash (Parent Link):</span>
                      <code className="text-neutral-300 break-all">{selectedEvent.previousEventHash}</code>
                    </div>
                    <div className="pt-1 border-t border-neutral-900">
                      <span className="text-cyan-400 block">Current Event Hash (SHA-256 Digest):</span>
                      <code className="text-cyan-300 break-all font-bold">{selectedEvent.currentEventHash}</code>
                    </div>
                  </div>
                </div>

                {/* Provenance & Causation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-400 block">Causation (Trigger):</span>
                    <span className="text-neutral-200 font-semibold">{selectedEvent.causation}</span>
                  </div>
                  <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-400 block">Correlation:</span>
                    <span className="text-neutral-200 font-semibold">{selectedEvent.correlation}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 text-[11px]">
                  <span className="text-neutral-400 block">Provenance Source:</span>
                  <span className="text-neutral-200 font-medium">{selectedEvent.provenance.source}</span>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-neutral-400">
                    <span>Chain:</span>
                    {selectedEvent.provenance.chain.map((c, i) => (
                      <span key={i} className="px-1 py-0.2 rounded bg-neutral-900 border border-neutral-800">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Complete Structured Payload Viewer */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-neutral-200">
                    <Code className="h-4 w-4 text-cyan-400" />
                    <span>Structured Event Payload (Canonical State)</span>
                  </div>
                </div>

                <pre className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-cyan-200 overflow-x-auto max-h-96">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-neutral-500 font-mono text-xs">
              Select an event block to inspect its complete cryptographic record.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
