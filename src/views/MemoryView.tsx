import React, { useMemo, useState } from 'react';
import {
  Brain,
  Database,
  Sparkles,
  CheckCircle2,
  Upload,
  FileText,
  MessageSquare,
  Hash,
  Link2,
} from 'lucide-react';
import type { MemoryRecord, MemoryType } from '../types';

interface MemoryViewProps {
  memoryRecords: MemoryRecord[];
  onNavigateToLedger: (eventId: string) => void;
}

type IngestSource = 'OBSIDIAN' | 'CLAUDE';

function splitKnowledge(content: string, maxChars = 2400): string[] {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];
  const sections = normalized.split(/\n(?=#{1,6}\s)/g);
  const chunks: string[] = [];
  let current = '';
  for (const section of sections) {
    if (!current) current = section;
    else if ((current + '\n\n' + section).length <= maxChars) current += '\n\n' + section;
    else {
      chunks.push(current.trim());
      current = section;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.flatMap((chunk) => {
    if (chunk.length <= maxChars) return [chunk];
    const parts: string[] = [];
    for (let i = 0; i < chunk.length; i += maxChars) parts.push(chunk.slice(i, i + maxChars).trim());
    return parts;
  }).filter(Boolean);
}

export const MemoryView: React.FC<MemoryViewProps> = ({ memoryRecords, onNavigateToLedger }) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<MemoryRecord | null>(memoryRecords[0] || null);
  const [showIngest, setShowIngest] = useState(false);
  const [source, setSource] = useState<IngestSource>('OBSIDIAN');
  const [sourceName, setSourceName] = useState('Obsidian Vault');
  const [path, setPath] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('');
  const [ingesting, setIngesting] = useState(false);

  const filtered = memoryRecords.filter((m) => selectedType === 'ALL' || m.type === selectedType);
  const knowledgeRecords = useMemo(
    () => memoryRecords.filter((m) => m.tags.includes('knowledge')),
    [memoryRecords]
  );
  const obsidianCount = knowledgeRecords.filter((m) => m.tags.includes('obsidian')).length;
  const claudeCount = knowledgeRecords.filter((m) => m.tags.includes('claude')).length;

  const getTypeBadge = (type: MemoryType) => {
    switch (type) {
      case 'RAW_OBSERVATION': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'EVIDENCE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'MEMORY': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'DISTILLED_KNOWLEDGE': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MODEL_OUTPUT': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
  };

  const ingest = async () => {
    const chunks = splitKnowledge(content);
    if (!sourceName.trim() || chunks.length === 0) {
      setStatus('Source name and knowledge content are required.');
      return;
    }
    setIngesting(true);
    setStatus('');
    try {
      const now = new Date().toISOString();
      const baseTags = ['knowledge', source.toLowerCase(), ...tags.split(',').map((t) => t.trim()).filter(Boolean)];
      let created = 0;
      for (let i = 0; i < chunks.length; i++) {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${sourceName}:${path}:${chunks[i]}`));
        const hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
        const memory: MemoryRecord = {
          id: `kmem-${hash.slice(0, 20)}`,
          type: source === 'CLAUDE' ? 'DISTILLED_KNOWLEDGE' : 'RAW_OBSERVATION',
          content: chunks[i],
          source: `${sourceName}${path ? `:${path}` : ''}`,
          provenance: {
            sourceId: `doc-${hash.slice(0, 16)}`,
            traceId: `knowledge-${hash.slice(0, 12)}`,
            chain: [source, 'Document Ingestion', 'SHA-256 Content Identity', 'Markdown Chunking', source === 'CLAUDE' ? 'DISTILLED_KNOWLEDGE' : 'RAW_OBSERVATION'],
          },
          timestamp: now,
          confidence: source === 'CLAUDE' ? 85 : 95,
          relevance: 100,
          tags: [...baseTags, `chunk:${i + 1}/${chunks.length}`, `content-hash:${hash.slice(0, 12)}`],
        };
        const response = await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memory),
        });
        if (!response.ok) throw new Error(`Memory commit failed (${response.status})`);
        created++;
      }
      setStatus(`Committed ${created} ${source} knowledge chunk${created === 1 ? '' : 's'} into Factory Memory.`);
      setContent('');
      setPath('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Knowledge ingestion failed.');
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-neutral-800 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold font-mono text-neutral-100 uppercase tracking-wide flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <span>Epistemic Memory & Knowledge</span>
            </h1>
            <p className="text-xs text-neutral-400 font-mono mt-1">
              Claude knowledge and Obsidian vault material enter Factory Memory as provenance-bound records — never as opaque context.
            </p>
          </div>
          <button
            onClick={() => setShowIngest((v) => !v)}
            className="shrink-0 px-3 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-mono font-bold flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {showIngest ? 'Close Ingestion' : 'Ingest Knowledge'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-[10px] text-neutral-500 font-mono uppercase">Factory Knowledge</div>
          <div className="text-2xl font-bold text-neutral-100 font-mono mt-1">{knowledgeRecords.length}</div>
          <div className="text-[10px] text-neutral-500 font-mono">committed chunks</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-[10px] text-neutral-500 font-mono uppercase flex items-center gap-1"><FileText className="h-3 w-3" /> Obsidian</div>
          <div className="text-2xl font-bold text-blue-300 font-mono mt-1">{obsidianCount}</div>
          <div className="text-[10px] text-neutral-500 font-mono">vault-derived records</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-[10px] text-neutral-500 font-mono uppercase flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Claude</div>
          <div className="text-2xl font-bold text-amber-300 font-mono mt-1">{claudeCount}</div>
          <div className="text-[10px] text-neutral-500 font-mono">distilled knowledge records</div>
        </div>
      </div>

      {showIngest && (
        <div className="rounded-xl border border-cyan-500/20 bg-neutral-900/70 p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold font-mono text-neutral-100"><Sparkles className="h-4 w-4 text-cyan-400" /> Knowledge Ingestion Boundary</div>
          <div className="text-[11px] text-neutral-500 font-mono">
            Paste exported Markdown/text from Obsidian or Claude. The Factory hashes and chunks it before committing each chunk to Memory.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-[10px] font-mono text-neutral-400">SOURCE TYPE
              <select value={source} onChange={(e) => setSource(e.target.value as IngestSource)} className="mt-1 w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200">
                <option value="OBSIDIAN">OBSIDIAN</option>
                <option value="CLAUDE">CLAUDE</option>
              </select>
            </label>
            <label className="text-[10px] font-mono text-neutral-400">SOURCE NAME
              <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} className="mt-1 w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200" />
            </label>
            <label className="text-[10px] font-mono text-neutral-400">VAULT / EXPORT PATH
              <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="e.g. Factory/Claude/architecture.md" className="mt-1 w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200" />
            </label>
            <label className="text-[10px] font-mono text-neutral-400">TAGS
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="architecture, agents, memory" className="mt-1 w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200" />
            </label>
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={source === 'OBSIDIAN' ? '# Note title\n\nPaste the selected Obsidian note or exported Markdown here...' : 'Paste the selected Claude conversation/export or distilled Claude knowledge here...'} className="w-full min-h-56 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-200 font-mono resize-y" />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1"><Hash className="h-3 w-3" /> SHA-256 identity + provenance chain generated client-side</span>
            <button disabled={ingesting} onClick={ingest} className="px-4 py-2 rounded-lg bg-cyan-500 text-neutral-950 text-xs font-mono font-bold disabled:opacity-50">
              {ingesting ? 'COMMITTING…' : 'COMMIT TO FACTORY MEMORY'}
            </button>
          </div>
          {status && <div className="text-xs font-mono text-cyan-300 border-t border-neutral-800 pt-3">{status}</div>}
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs font-mono">
        {['ALL', 'RAW_OBSERVATION', 'EVIDENCE', 'MEMORY', 'DISTILLED_KNOWLEDGE', 'MODEL_OUTPUT'].map((cat) => (
          <button key={cat} onClick={() => setSelectedType(cat)} className={`px-3 py-1.5 rounded-lg border transition ${selectedType === cat ? 'bg-neutral-800 text-neutral-100 border-neutral-600 font-bold' : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'}`}>{cat}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-2 font-mono text-xs">
          <span className="font-bold text-neutral-400 uppercase">Memory Records ({filtered.length})</span>
          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filtered.map((rec) => {
              const isSelected = selectedRecord?.id === rec.id;
              return (
                <div key={rec.id} onClick={() => setSelectedRecord(rec)} className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${isSelected ? 'border-purple-500/60 bg-neutral-900/90 ring-1 ring-purple-500/30' : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-neutral-200 truncate">{rec.domain || rec.source}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded border ${getTypeBadge(rec.type)}`}>{rec.type}</span>
                  </div>
                  <p className="text-neutral-300 font-sans text-xs line-clamp-2">{rec.content}</p>
                  <div className="pt-1.5 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-400"><span>Confidence: <strong className="text-emerald-400">{rec.confidence}%</strong></span><span>{new Date(rec.timestamp).toLocaleTimeString()}</span></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4 font-mono text-xs">
          {selectedRecord ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 gap-3">
                <div><span className="text-[10px] text-neutral-500 block">{selectedRecord.id}</span><h2 className="text-sm font-bold text-neutral-100">{selectedRecord.source}</h2></div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getTypeBadge(selectedRecord.type)}`}>{selectedRecord.type}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2"><span className="text-[11px] text-neutral-400 font-bold block uppercase">Knowledge Payload</span><p className="text-neutral-200 font-sans text-xs leading-relaxed whitespace-pre-wrap">{selectedRecord.content}</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800"><span className="text-neutral-500 block">Source Origin</span><span className="text-neutral-200 font-semibold">{selectedRecord.source}</span></div>
                <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800"><span className="text-neutral-500 block">Trace</span><span className="text-cyan-300 font-semibold">{selectedRecord.provenance.traceId}</span></div>
              </div>
              <div className="space-y-1.5"><span className="text-[11px] text-neutral-400 uppercase flex items-center gap-1"><Link2 className="h-3 w-3" /> Provenance Chain</span><div className="flex flex-wrap gap-1.5">{selectedRecord.provenance.chain.map((item) => <span key={item} className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-cyan-300">{item}</span>)}</div></div>
              <div className="space-y-1.5"><span className="text-[11px] text-neutral-400 uppercase">Tags & Indices</span><div className="flex flex-wrap gap-1.5">{selectedRecord.tags.map((t) => <span key={t} className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-purple-300">#{t}</span>)}</div></div>
              {selectedRecord.associatedEventId && <div className="pt-2 border-t border-neutral-800"><button onClick={() => onNavigateToLedger(selectedRecord.associatedEventId!)} className="text-cyan-400 hover:underline font-bold flex items-center gap-1"><Database className="h-3 w-3" /> Open ledger event {selectedRecord.associatedEventId}</button></div>}
              <div className="text-[10px] text-neutral-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Identity and provenance metadata retained with the memory record.</div>
            </div>
          ) : <div className="p-12 text-center text-neutral-500 font-mono text-xs">Select a memory record to inspect provenance.</div>}
        </div>
      </div>
    </div>
  );
};
