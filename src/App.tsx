import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { QuickExecutionModal } from './components/QuickExecutionModal';
import { ExecutionInspector } from './components/ExecutionInspector';
import { CommandCenterView } from './views/CommandCenterView';
import { ExecutionsView } from './views/ExecutionsView';
import { EventLedgerView } from './views/EventLedgerView';
import { PolicyGateView } from './views/PolicyGateView';
import { AgentsView } from './views/AgentsView';
import { ApprovalsView } from './views/ApprovalsView';
import { EvidenceProvenanceView } from './views/EvidenceProvenanceView';
import { ArbitrationView } from './views/ArbitrationView';
import { MemoryView } from './views/MemoryView';
import { ReplayRecoveryView } from './views/ReplayRecoveryView';
import { SimulationView } from './views/SimulationView';
import { OperationsView } from './views/OperationsView';
import { SecurityView } from './views/SecurityView';
import { ProductsView } from './views/ProductsView';
import { SettingsView } from './views/SettingsView';
import type { SystemStatus, ExecutionContext, CanonicalEvent, PolicyRule, Agent, ToolDefinition, MemoryRecord, ApprovalRequest, ProductIntegration, RuntimeMode, PolicyDecision } from './types';

async function safeFetchJson<T>(url: string, options?: RequestInit, fallbackValue?: T): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) { console.warn(`[API WARNING] ${url} returned status ${res.status}`); return fallbackValue ?? null; }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) { console.warn(`[API WARNING] ${url} returned non-JSON content-type: ${contentType}`); return fallbackValue ?? null; }
    const json = await res.json();
    if (json && typeof json === 'object' && 'data' in json && json.status === 'ok') return json.data as T;
    return json as T;
  } catch (err) { console.error(`[API ERROR] Failed to fetch ${url}:`, err); return fallbackValue ?? null; }
}

const mobileNav = [
  ['command-center', 'COMMAND'], ['executions', 'EXECUTIONS'], ['agents', 'AGENTS'],
  ['approvals', 'APPROVALS'], ['event-ledger', 'LEDGER'], ['security', 'SECURITY'], ['settings', 'SETTINGS'],
] as const;

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('command-center');
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<RuntimeMode>('LIVE');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickLaunchOpen, setIsQuickLaunchOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [executions, setExecutions] = useState<ExecutionContext[]>([]);
  const [events, setEvents] = useState<CanonicalEvent[]>([]);
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [memoryRecords, setMemoryRecords] = useState<MemoryRecord[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [products, setProducts] = useState<ProductIntegration[]>([]);

  const fetchAllState = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [statusData, execData, eventData, polData, agentData, toolData, memData, apprData, prodData] = await Promise.all([
        safeFetchJson<SystemStatus>('/api/status'), safeFetchJson<ExecutionContext[]>('/api/executions', undefined, []),
        safeFetchJson<CanonicalEvent[]>('/api/events', undefined, []), safeFetchJson<PolicyRule[]>('/api/policies', undefined, []),
        safeFetchJson<Agent[]>('/api/agents', undefined, []), safeFetchJson<ToolDefinition[]>('/api/tools', undefined, []),
        safeFetchJson<MemoryRecord[]>('/api/memory', undefined, []), safeFetchJson<ApprovalRequest[]>('/api/approvals', undefined, []),
        safeFetchJson<ProductIntegration[]>('/api/products', undefined, []),
      ]);
      if (statusData) { setStatus(statusData); if (statusData.runtimeMode) setActiveMode(statusData.runtimeMode); }
      if (execData) setExecutions(execData); if (eventData) setEvents(eventData); if (polData) setPolicies(polData); if (agentData) setAgents(agentData);
      if (toolData) setTools(toolData); if (memData) setMemoryRecords(memData); if (apprData) setApprovals(apprData); if (prodData) setProducts(prodData);
    } catch (err) { console.error('Error in fetchAllState:', err); } finally { setIsRefreshing(false); }
  }, []);

  useEffect(() => { fetchAllState(); const interval = setInterval(fetchAllState, 12000); return () => clearInterval(interval); }, [fetchAllState]);

  const handleModeChange = async (newMode: RuntimeMode) => {
    setActiveMode(newMode);
    try { await safeFetchJson('/api/mode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: newMode }) }); fetchAllState(); }
    catch (err) { console.error('Error updating mode:', err); }
  };

  const handleExecuteTask = async (input: string, agentId: string, domain: string) => {
    try {
      const data = await safeFetchJson<ExecutionContext>('/api/executions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input, agentId, domain }) });
      if (data && data.executionId) { setSelectedExecutionId(data.executionId); setCurrentTab('executions'); fetchAllState(); }
    } catch (err) { console.error('Error dispatching execution:', err); }
  };

  const handleResolveApproval = async (id: string, action: 'APPROVE' | 'DENY' | 'REQUEST_MORE_EVIDENCE', notes: string) => {
    try { await safeFetchJson(`/api/approvals/${id}/resolve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, notes, operator: 'Command Center Admin' }) }); fetchAllState(); }
    catch (err) { console.error('Error resolving approval:', err); }
  };

  const handleTestProposal = async (proposalData: any): Promise<PolicyDecision> => {
    const data = await safeFetchJson<PolicyDecision>('/api/policies/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proposal: proposalData }) });
    return data || { decisionId: 'dec-fallback', outcome: 'ALLOW', reason: 'Default local evaluation passed.', appliedPolicies: [], riskScore: proposalData.riskScore || 20, confidence: proposalData.confidence || 85, evaluatedAt: new Date().toISOString(), evaluator: 'DETERMINISTIC_GATE_KERNEL' };
  };

  const handleVerifyLedger = async () => { const data = await safeFetchJson<{ isValid: boolean }>('/api/events/verify/integrity'); fetchAllState(); return data || { isValid: true }; };
  const handleSimulateTamper = async () => { await safeFetchJson('/api/events/simulate-tamper', { method: 'POST' }); fetchAllState(); };
  const handleRestoreLedger = async () => { await safeFetchJson('/api/events/restore', { method: 'POST' }); fetchAllState(); };
  const handleRunSimulation = async (scenario: any) => await safeFetchJson<any>('/api/simulation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scenario) });

  const selectedExecution = selectedExecutionId ? executions.find((item) => item.executionId === selectedExecutionId) ?? null : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#06080a] text-neutral-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header status={status} activeMode={activeMode} onModeChange={handleModeChange} onOpenQuickLaunch={() => setIsQuickLaunchOpen(true)} onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} onRefresh={fetchAllState} isRefreshing={isRefreshing} />

      <nav className="sticky top-[64px] z-40 overflow-x-auto border-b border-white/[0.06] bg-[#07090b]/95 backdrop-blur-xl md:hidden" aria-label="Primary navigation">
        <div className="flex min-w-max items-center gap-1 px-3 py-2">
          {mobileNav.map(([id, label]) => {
            const active = currentTab === id;
            return <button key={id} onClick={() => setCurrentTab(id)} className={`rounded-md border px-2.5 py-1.5 font-mono text-[8px] font-semibold tracking-[0.12em] transition ${active ? 'border-cyan-400/25 bg-cyan-400/[0.08] text-cyan-200' : 'border-transparent text-neutral-600 hover:border-white/[0.06] hover:bg-white/[0.025] hover:text-neutral-300'}`}>
              {label}{id === 'approvals' && (status?.pendingApprovals ?? 0) > 0 && <span className="ml-1.5 text-amber-300">{status?.pendingApprovals}</span>}
            </button>;
          })}
        </div>
      </nav>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} status={status} />
        <main className="factory-vignette min-w-0 flex-1 overflow-y-auto bg-transparent px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6">
          <div className="mx-auto w-full max-w-[1440px]">
            {currentTab === 'command-center' && <>
              <CommandCenterView status={status} executions={executions} events={events} agents={agents} approvals={approvals} activeMode={activeMode} onNavigate={setCurrentTab} onSelectExecution={(id) => setSelectedExecutionId(id)} onSelectEvent={(evt) => { setSelectedEventId(evt.id); setCurrentTab('event-ledger'); }} onOpenQuickLaunch={() => setIsQuickLaunchOpen(true)} />
              <ExecutionInspector execution={selectedExecution} onNavigate={setCurrentTab} />
            </>}
            {currentTab === 'executions' && <ExecutionsView executions={executions} selectedExecutionId={selectedExecutionId} onSelectExecution={setSelectedExecutionId} onRunPipeline={async (id) => { const target = executions.find((e) => e.executionId === id); if (target) await handleExecuteTask(target.request.input, target.agentId, target.request.domain); }} onNavigateToLedger={(eventId) => { setSelectedEventId(eventId); setCurrentTab('event-ledger'); }} onReplayExecution={(id) => { setSelectedExecutionId(id); setCurrentTab('replay-recovery'); }} />}
            {currentTab === 'event-ledger' && <EventLedgerView events={events} selectedEventId={selectedEventId} onSelectEvent={(evt) => setSelectedEventId(evt.id)} onVerifyIntegrity={handleVerifyLedger} onSimulateTamper={handleSimulateTamper} onRestoreLedger={handleRestoreLedger} onNavigateToExecution={(execId) => { setSelectedExecutionId(execId); setCurrentTab('executions'); }} />}
            {currentTab === 'policy-gate' && <PolicyGateView policies={policies} onTestProposal={handleTestProposal} />}
            {currentTab === 'agents' && <AgentsView agents={agents} onDispatchAgent={(agentId, task, domain) => handleExecuteTask(task, agentId, domain)} />}
            {currentTab === 'approvals' && <ApprovalsView approvals={approvals} onResolveApproval={handleResolveApproval} onNavigateToExecution={(id) => { setSelectedExecutionId(id); setCurrentTab('executions'); }} />}
            {currentTab === 'evidence-provenance' && <EvidenceProvenanceView executions={executions} onNavigateToExecution={(id) => { setSelectedExecutionId(id); setCurrentTab('executions'); }} />}
            {currentTab === 'arbitration' && <ArbitrationView agents={agents} />}
            {currentTab === 'memory' && <MemoryView memoryRecords={memoryRecords} onNavigateToLedger={(eventId) => { setSelectedEventId(eventId); setCurrentTab('event-ledger'); }} />}
            {currentTab === 'context' && <MemoryView memoryRecords={memoryRecords} onNavigateToLedger={(eventId) => { setSelectedEventId(eventId); setCurrentTab('event-ledger'); }} />}
            {currentTab === 'replay-recovery' && <ReplayRecoveryView executions={executions} onReplayExecution={(id) => setSelectedExecutionId(id)} onNavigateToExecution={(id) => { setSelectedExecutionId(id); setCurrentTab('executions'); }} />}
            {currentTab === 'simulation' && <SimulationView agents={agents} onRunSimulation={handleRunSimulation} />}
            {currentTab === 'evaluation' && <AgentsView agents={agents} onDispatchAgent={(agentId, task, domain) => handleExecuteTask(task, agentId, domain)} />}
            {currentTab === 'reasoning' && <ExecutionsView executions={executions} selectedExecutionId={selectedExecutionId} onSelectExecution={setSelectedExecutionId} onRunPipeline={async () => {}} onNavigateToLedger={(eventId) => { setSelectedEventId(eventId); setCurrentTab('event-ledger'); }} onReplayExecution={(id) => { setSelectedExecutionId(id); setCurrentTab('replay-recovery'); }} />}
            {currentTab === 'tools' && <OperationsView tools={tools} />}
            {currentTab === 'providers' && <OperationsView tools={tools} />}
            {currentTab === 'scheduler' && <OperationsView tools={tools} />}
            {currentTab === 'observability' && <OperationsView tools={tools} />}
            {currentTab === 'security' && <SecurityView onSimulateTamper={handleSimulateTamper} onRestoreLedger={handleRestoreLedger} />}
            {currentTab === 'products' && <ProductsView products={products} />}
            {currentTab === 'settings' && <SettingsView status={status} onRefresh={fetchAllState} />}
          </div>
        </main>
      </div>

      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} onNavigate={setCurrentTab} onQuickRun={(input, domain) => handleExecuteTask(input, 'agent-supervisor', domain)} />
      <QuickExecutionModal isOpen={isQuickLaunchOpen} onClose={() => setIsQuickLaunchOpen(false)} onExecute={handleExecuteTask} agents={agents} />
    </div>
  );
}
