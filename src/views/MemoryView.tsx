import React, { useEffect, useMemo, useState } from 'react';
import { Brain, Database, Sparkles, CheckCircle2, Upload, FileText, MessageSquare, Hash, Link2, RefreshCw, ShieldCheck } from 'lucide-react';
import type { MemoryRecord, MemoryType } from '../types';

interface MemoryViewProps { memoryRecords: MemoryRecord[]; onNavigateToLedger: (eventId: string) => void; }
type IngestSource = 'OBSIDIAN' | 'CLAUDE';
type AdapterItem = { itemId: string; path: string; name: string; size: number; modifiedAt: string; sourceType: IngestSource };
type Transaction = { transactionId: string; sourceId: string; sourceType: IngestSource; sourceName: string; state: string; manifest: Array<{ itemId: string; path?: string; contentHash: string; version: number }>; manifestHash: string; approvalId?: string };

const api = async <T,>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.status === 'error') throw new Error(body.error || `Request failed (${response.status})`);
  return body.data as T;
};

export const MemoryView: React.FC<MemoryViewProps> = ({ memoryRecords, onNavigateToLedger }) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<MemoryRecord | null>(memoryRecords[0] || null);
  const [showIngest, setShowIngest] = useState(false);
  const [source, setSource] = useState<IngestSource>('OBSIDIAN');
  const [items, setItems] = useState<AdapterItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ item: AdapterItem; content: string } | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const filtered = memoryRecords.filter((m) => selectedType === 'ALL' || m.type === selectedType);
  const knowledgeRecords = useMemo(() => memoryRecords.filter((m) => m.tags.includes('knowledge')), [memoryRecords]);
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

  const loadItems = async (nextSource = source) => {
    setBusy(true); setStatus('Discovering source items…'); setPreview(null); setTransaction(null); setSelectedItems([]);
    try {
      const data = await api<AdapterItem[]>(`/api/knowledge/adapters/${nextSource === 'OBSIDIAN' ? 'obsidian' : 'claude'}/items`);
      setItems(data); setStatus(`Discovered ${data.length} ${nextSource} source item${data.length === 1 ? '' : 's'}.`);
    } catch (error) { setItems([]); setStatus(error instanceof Error ? error.message : 'Source discovery failed.'); }
    finally { setBusy(false); }
  };

  useEffect(() => { if (showIngest) void loadItems(source); }, [showIngest, source]);

  const toggleItem = (itemId: string) => setSelectedItems((current) => current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]);

  const readItem = async (item: AdapterItem) => {
    setBusy(true); setStatus('Reading source item…');
    try {
      const data = await api<{ item: AdapterItem; content: string }>(`/api/knowledge/adapters/${item.sourceType === 'OBSIDIAN' ? 'obsidian' : 'claude'}/item?path=${encodeURIComponent(item.path)}`);
      setPreview(data); setStatus(`Preview loaded: ${item.path}`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Source read failed.'); }
    finally { setBusy(false); }
  };

  const createManifest = async () => {
    if (!selectedItems.length) { setStatus('Select at least one source item.'); return; }
    setBusy(true); setStatus('Building manifest…');
    try {
      const selected = items.filter((item) => selectedItems.includes(item.itemId));
      const contents = await Promise.all(selected.map(async (item) => api<{ item: AdapterItem; content: string }>(`/api/knowledge/adapters/${item.sourceType === 'OBSIDIAN' ? 'obsidian' : 'claude'}/item?path=${encodeURIComponent(item.path)}`)));
      const tx = await api<Transaction>('/api/knowledge/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceId: `${source.toLowerCase()}-adapter`, sourceName: source === 'OBSIDIAN' ? 'Obsidian Vault' : 'Claude Export', sourceType: source, items: contents.map(({ item, content }) => ({ itemId: item.itemId, path: item.path, content })) }) });
      setTransaction(tx); setStatus(`Manifest ${tx.transactionId} created. Review and dry-run next.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Manifest creation failed.'); }
    finally { setBusy(false); }
  };

  const dryRun = async () => {
    if (!transaction) return;
    setBusy(true); setStatus('Running governed dry-run…');
    try { const tx = await api<Transaction>(`/api/knowledge/transactions/${transaction.transactionId}/dry-run`, { method: 'POST' }); setTransaction(tx); setStatus('Dry-run complete. Transaction is ready for human approval.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Dry-run failed.'); }
    finally { setBusy(false); }
  };

  const approve = async () => {
    if (!transaction) return;
    setBusy(true); setStatus('Recording human approval…');
    try { const tx = await api<Transaction>(`/api/knowledge/transactions/${transaction.transactionId}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvalId: `memory-ui-${Date.now()}`, manifestHash: transaction.manifestHash }) }); setTransaction(tx); setStatus('Approved. The source will be re-read before atomic ingestion.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Approval failed.'); }
    finally { setBusy(false); }
  };

  const ingestApproved = async () => {
    if (!transaction) return;
    setBusy(true); setStatus('Re-reading approved source and performing drift check…');
    try {
      const current = await Promise.all(transaction.manifest.map(async (manifestItem) => {
        const item = items.find((candidate) => candidate.itemId === manifestItem.itemId);
        if (!item) throw new Error(`Source item no longer discovered: ${manifestItem.itemId}`);
        const data = await api<{ item: AdapterItem; content: string }>(`/api/knowledge/adapters/${source === 'OBSIDIAN' ? 'obsidian' : 'claude'}/item?path=${encodeURIComponent(item.path)}`);
        return { itemId: data.item.itemId, content: data.content };
      }));
      const result = await api<{ transaction: Transaction; results: unknown[] }>(`/api/knowledge/transactions/${transaction.transactionId}/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: current }) });
      setTransaction(result.transaction); setStatus(`Atomic ingestion complete: ${result.results.length} knowledge item${result.results.length === 1 ? '' : 's'} committed.`);
      setSelectedItems([]); setPreview(null);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Approved ingestion failed.'); }
    finally { setBusy(false); }
  };

  const stateAction = transaction?.state === 'MANIFESTED' ? dryRun : transaction?.state === 'REVIEW_REQUIRED' ? approve : transaction?.state === 'APPROVED' ? ingestApproved : undefined;
  const stateLabel = transaction?.state === 'MANIFESTED' ? 'RUN DRY-RUN' : transaction?.state === 'REVIEW_REQUIRED' ? 'APPROVE MANIFEST' : transaction?.state === 'APPROVED' ? 'INGEST APPROVED' : transaction?.state || '';

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-neutral-800 pb-4 flex items-start justify-between gap-4">
        <div><h1 className="text-lg font-bold font-mono text-neutral-100 uppercase tracking-wide flex items-center gap-2"><Brain className="h-5 w-5 text-purple-400" /><span>Epistemic Memory & Knowledge</span></h1><p className="text-xs text-neutral-400 font-mono mt-1">Governed Obsidian and Claude ingestion with manifest, review, drift detection and atomic commit.</p></div>
        <button onClick={() => setShowIngest((v) => !v)} className="shrink-0 px-3 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-mono font-bold flex items-center gap-2"><Upload className="h-4 w-4" />{showIngest ? 'Close Ingestion' : 'Ingest Knowledge'}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4"><div className="text-[10px] text-neutral-500 font-mono uppercase">Factory Knowledge</div><div className="text-2xl font-bold text-neutral-100 font-mono mt-1">{knowledgeRecords.length}</div><div className="text-[10px] text-neutral-500 font-mono">committed chunks</div></div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4"><div className="text-[10px] text-neutral-500 font-mono uppercase flex items-center gap-1"><FileText className="h-3 w-3" /> Obsidian</div><div className="text-2xl font-bold text-blue-300 font-mono mt-1">{obsidianCount}</div><div className="text-[10px] text-neutral-500 font-mono">vault-derived records</div></div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4"><div className="text-[10px] text-neutral-500 font-mono uppercase flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Claude</div><div className="text-2xl font-bold text-amber-300 font-mono mt-1">{claudeCount}</div><div className="text-[10px] text-neutral-500 font-mono">distilled knowledge records</div></div>
      </div>

      {showIngest && <div className="rounded-xl border border-cyan-500/20 bg-neutral-900/70 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-bold font-mono text-neutral-100"><Sparkles className="h-4 w-4 text-cyan-400" /> Knowledge Source Adapter</div><div className="text-[11px] text-neutral-500 font-mono mt-1">Discovery is read-only. Nothing enters Memory until the governed transaction reaches atomic ingestion.</div></div><button onClick={() => void loadItems()} disabled={busy} className="px-2.5 py-1.5 rounded-lg border border-neutral-700 text-neutral-300 text-[10px] font-mono flex items-center gap-1"><RefreshCw className="h-3 w-3" /> REFRESH</button></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="space-y-2"><label className="text-[10px] font-mono text-neutral-400">SOURCE<select value={source} onChange={(e) => setSource(e.target.value as IngestSource)} className="mt-1 w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200"><option value="OBSIDIAN">OBSIDIAN</option><option value="CLAUDE">CLAUDE</option></select></label><div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-[10px] font-mono text-neutral-500">{items.length} discovered item{items.length === 1 ? '' : 's'}<br />Select items to build a manifest.</div></div>
          <div className="lg:col-span-2 max-h-56 overflow-y-auto space-y-1 pr-1">{items.map((item) => <div key={item.itemId} className={`flex items-center gap-2 p-2 rounded-lg border ${selectedItems.includes(item.itemId) ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-neutral-800 bg-neutral-950/50'}`}><input type="checkbox" checked={selectedItems.includes(item.itemId)} onChange={() => toggleItem(item.itemId)} /><button onClick={() => void readItem(item)} className="min-w-0 flex-1 text-left"><div className="text-xs text-neutral-200 font-mono truncate">{item.path}</div><div className="text-[9px] text-neutral-500 font-mono">{item.size} bytes · {new Date(item.modifiedAt).toLocaleString()}</div></button></div>)}{!items.length && <div className="p-6 text-center text-[10px] text-neutral-600 font-mono">No adapter items discovered. Check the configured source root.</div>}</div>
        </div>
        {preview && <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3"><div className="text-[10px] text-cyan-300 font-mono mb-2">PREVIEW · {preview.item.path}</div><pre className="max-h-52 overflow-y-auto whitespace-pre-wrap text-[11px] text-neutral-300 font-mono">{preview.content}</pre></div>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 pt-3"><span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1"><Hash className="h-3 w-3" /> Server-side SHA-256 manifest identity · human approval required</span><button disabled={busy || !selectedItems.length} onClick={() => void createManifest()} className="px-4 py-2 rounded-lg bg-cyan-500 text-neutral-950 text-xs font-mono font-bold disabled:opacity-50">{busy ? 'WORKING…' : 'CREATE MANIFEST'}</button></div>
        {transaction && <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3"><div className="flex items-center justify-between gap-3"><div className="text-xs font-mono text-neutral-200 font-bold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-300" /> {transaction.transactionId}</div><span className="px-2 py-1 rounded border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold">{transaction.state}</span></div><div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] font-mono"><div className="rounded bg-neutral-950 p-2"><span className="text-neutral-500 block">ITEMS</span><span className="text-neutral-200">{transaction.manifest.length}</span></div><div className="rounded bg-neutral-950 p-2"><span className="text-neutral-500 block">MANIFEST HASH</span><span className="text-cyan-300 break-all">{transaction.manifestHash}</span></div><div className="rounded bg-neutral-950 p-2"><span className="text-neutral-500 block">VERSION</span><span className="text-neutral-200">{transaction.manifest.map((m) => m.version).join(', ')}</span></div></div>{stateAction && <button disabled={busy} onClick={() => void stateAction()} className="w-full px-4 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs font-mono font-bold disabled:opacity-50">{busy ? 'PROCESSING…' : stateLabel}</button>}</div>}
        {status && <div className="text-xs font-mono text-cyan-300 border-t border-neutral-800 pt-3">{status}</div>}
      </div>}

      <div className="flex flex-wrap gap-2 text-xs font-mono">{['ALL', 'RAW_OBSERVATION', 'EVIDENCE', 'MEMORY', 'DISTILLED_KNOWLEDGE', 'MODEL_OUTPUT'].map((cat) => <button key={cat} onClick={() => setSelectedType(cat)} className={`px-3 py-1.5 rounded-lg border transition ${selectedType === cat ? 'bg-neutral-800 text-neutral-100 border-neutral-600 font-bold' : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'}`}>{cat}</button>)}</div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-2 font-mono text-xs"><span className="font-bold text-neutral-400 uppercase">Memory Records ({filtered.length})</span><div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">{filtered.map((rec) => { const isSelected = selectedRecord?.id === rec.id; return <div key={rec.id} onClick={() => setSelectedRecord(rec)} className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${isSelected ? 'border-purple-500/60 bg-neutral-900/90 ring-1 ring-purple-500/30' : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'}`}><div className="flex items-center justify-between gap-2"><span className="font-bold text-neutral-200 truncate">{rec.source}</span><span className={`text-[9px] px-1.5 py-0.2 rounded border ${getTypeBadge(rec.type)}`}>{rec.type}</span></div><p className="text-neutral-300 font-sans text-xs line-clamp-2">{rec.content}</p><div className="pt-1.5 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-400"><span>Confidence: <strong className="text-emerald-400">{rec.confidence}%</strong></span><span>{new Date(rec.timestamp).toLocaleTimeString()}</span></div></div>; })}</div></div>
        <div className="lg:col-span-7 space-y-4 font-mono text-xs">{selectedRecord ? <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4"><div className="flex items-center justify-between border-b border-neutral-800 pb-3 gap-3"><div><span className="text-[10px] text-neutral-500 block">{selectedRecord.id}</span><h2 className="text-sm font-bold text-neutral-100">{selectedRecord.source}</h2></div><span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getTypeBadge(selectedRecord.type)}`}>{selectedRecord.type}</span></div><div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2"><span className="text-[11px] text-neutral-400 font-bold block uppercase">Knowledge Payload</span><p className="text-neutral-200 font-sans text-xs leading-relaxed whitespace-pre-wrap">{selectedRecord.content}</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]"><div className="p-2.5 rounded bg-neutral-950 border border-neutral-800"><span className="text-neutral-500 block">Source Origin</span><span className="text-neutral-200 font-semibold">{selectedRecord.source}</span></div><div className="p-2.5 rounded bg-neutral-950 border border-neutral-800"><span className="text-neutral-500 block">Trace</span><span className="text-cyan-300 font-semibold">{selectedRecord.provenance.traceId}</span></div></div><div className="space-y-1.5"><span className="text-[11px] text-neutral-400 uppercase flex items-center gap-1"><Link2 className="h-3 w-3" /> Provenance Chain</span><div className="flex flex-wrap gap-1.5">{selectedRecord.provenance.chain.map((item) => <span key={item} className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-cyan-300">{item}</span>)}</div></div><div className="space-y-1.5"><span className="text-[11px] text-neutral-400 uppercase">Tags & Indices</span><div className="flex flex-wrap gap-1.5">{selectedRecord.tags.map((t) => <span key={t} className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-purple-300">#{t}</span>)}</div></div>{selectedRecord.associatedEventId && <div className="pt-2 border-t border-neutral-800"><button onClick={() => onNavigateToLedger(selectedRecord.associatedEventId!)} className="text-cyan-400 hover:underline font-bold flex items-center gap-1"><Database className="h-3 w-3" /> Open ledger event {selectedRecord.associatedEventId}</button></div>}<div className="text-[10px] text-neutral-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Identity and provenance metadata retained with the memory record.</div></div> : <div className="p-12 text-center text-neutral-500 font-mono text-xs">Select a memory record.</div>}</div>
      </div>
    </div>
  );
};
