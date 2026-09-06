import React, { useState } from 'react';
import {
  Brain,
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  Filter,
  ArrowRight,
  Code,
  Tag,
} from 'lucide-react';
import type { MemoryRecord, MemoryType } from '../types';

interface MemoryViewProps {
  memoryRecords: MemoryRecord[];
  onNavigateToLedger: (eventId: string) => void;
}

export const MemoryView: React.FC<MemoryViewProps> = ({
  memoryRecords,
  onNavigateToLedger,
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<MemoryRecord>(memoryRecords[0] || null);

  const filtered = memoryRecords.filter((m) => {
    if (selectedType === 'ALL') return true;
    return m.type === selectedType;
  });

  const getTypeBadge = (type: MemoryType) => {
    switch (type) {
      case 'RAW_OBSERVATION':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'EVIDENCE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'MEMORY':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'DISTILLED_KNOWLEDGE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MODEL_OUTPUT':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="text-lg font-bold font-mono text-neutral-100 uppercase tracking-wide flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-400" />
          <span>Epistemic Memory & Distilled Knowledge Explorer</span>
        </h1>
        <p className="text-xs text-neutral-400 font-mono mt-0.5">
          Strict separation of truth states: Raw Observation ≠ Grounded Evidence ≠ Memory ≠ Distilled Knowledge ≠ Model Output
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 text-xs font-mono">
        {['ALL', 'RAW_OBSERVATION', 'EVIDENCE', 'MEMORY', 'DISTILLED_KNOWLEDGE', 'MODEL_OUTPUT'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedType(cat)}
            className={`px-3 py-1.5 rounded-lg border transition ${
              selectedType === cat
                ? 'bg-neutral-800 text-neutral-100 border-neutral-600 font-bold'
                : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Records */}
        <div className="lg:col-span-5 space-y-2 font-mono text-xs">
          <span className="font-bold text-neutral-400 uppercase">
            Memory Records ({filtered.length})
          </span>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filtered.map((rec) => {
              const isSelected = selectedRecord?.id === rec.id;
              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecord(rec)}
                  className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'border-purple-500/60 bg-neutral-900/90 ring-1 ring-purple-500/30'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-200 truncate">{rec.domain}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded border ${getTypeBadge(rec.type)}`}>
                      {rec.type}
                    </span>
                  </div>

                  <p className="text-neutral-300 font-sans text-xs line-clamp-2">{rec.content}</p>

                  <div className="pt-1.5 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-400">
                    <span>Confidence: <strong className="text-emerald-400">{rec.confidence}%</strong></span>
                    <span>{new Date(rec.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Record Detail Inspector */}
        <div className="lg:col-span-7 space-y-4 font-mono text-xs">
          {selectedRecord ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div>
                  <span className="text-[10px] text-neutral-400 block">{selectedRecord.id}</span>
                  <h2 className="text-sm font-bold text-neutral-100">{selectedRecord.domain}</h2>
                </div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getTypeBadge(selectedRecord.type)}`}>
                  {selectedRecord.type}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                <span className="text-[11px] text-neutral-400 font-bold block uppercase">
                  Epistemic Payload Content:
                </span>
                <p className="text-neutral-200 font-sans text-xs leading-relaxed">
                  {selectedRecord.content}
                </p>
              </div>

              {/* Provenance & Event Linkage */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-400 block">Source Origin:</span>
                  <span className="text-neutral-200 font-semibold">{selectedRecord.provenance.source}</span>
                </div>
                <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-400 block">Ledger Event Link:</span>
                  <button
                    onClick={() => onNavigateToLedger(selectedRecord.provenance.eventId)}
                    className="text-cyan-400 hover:underline font-bold"
                  >
                    {selectedRecord.provenance.eventId}
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-neutral-400 uppercase">Tags & Indices:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRecord.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-purple-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-neutral-500 font-mono text-xs">
              Select a memory record to inspect provenance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
