import React, { useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  CircleDot,
  Cpu,
  Gauge,
  Layers3,
  LockKeyhole,
  Play,
  Shield,
  Sparkles,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import type { Agent } from '../types';

interface AgentsViewProps {
  agents: Agent[];
  onDispatchAgent: (agentId: string, task: string, domain: string) => void;
}

const statusTone: Record<Agent['status'], string> = {
  ACTIVE: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  IDLE: 'text-neutral-300 border-neutral-700 bg-neutral-900',
  BUSY: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
  PAUSED: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  DEGRADED: 'text-red-300 border-red-500/30 bg-red-500/10',
};

const riskTone: Record<Agent['riskProfile'], string> = {
  LOW: 'text-emerald-300',
  MEDIUM: 'text-amber-300',
  HIGH: 'text-orange-300',
  STRICT: 'text-cyan-300',
};

export const AgentsView: React.FC<AgentsViewProps> = ({ agents, onDispatchAgent }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');
  const [customTask, setCustomTask] = useState('');

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) || agents[0],
    [agents, selectedAgentId],
  );

  const activeCount = agents.filter((agent) => agent.status === 'ACTIVE' || agent.status === 'BUSY').length;
  const degradedCount = agents.filter((agent) => agent.status === 'DEGRADED').length;
  const avgPerformance = agents.length
    ? Math.round(agents.reduce((sum, agent) => sum + agent.performanceScore, 0) / agents.length)
    : 0;

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTask.trim() || !selectedAgent) return;
    onDispatchAgent(selectedAgent.id, customTask.trim(), selectedAgent.type);
    setCustomTask('');
  };

  return (
    <div className="space-y-5 pb-12 font-mono text-xs">
      {/* Registry header */}
      <header className="panel-grid rounded-xl border border-neutral-800 bg-neutral-950/70 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-cyan-400">
              <Users className="h-4 w-4" />
              Runtime / Agent Fabric
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-100">SPECIALIST AGENT REGISTRY</h1>
            <p className="mt-1 max-w-3xl text-[11px] leading-5 text-neutral-400">
              Governed reasoning workers operating beneath the Factory execution boundary. Agents propose; deterministic policy decides; authorized runtime executes.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-emerald-300">
            <CircleDot className="h-3.5 w-3.5 animate-pulse" />
            FABRIC ONLINE
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            ['REGISTERED', agents.length, 'text-neutral-100', Users],
            ['ACTIVE / BUSY', activeCount, 'text-cyan-300', Activity],
            ['AVG PERFORMANCE', `${avgPerformance}%`, 'text-emerald-300', Gauge],
            ['DEGRADED', degradedCount, degradedCount ? 'text-red-300' : 'text-neutral-300', Shield],
          ].map(([label, value, tone, Icon]) => (
            <div key={String(label)} className="rounded-lg border border-neutral-800 bg-neutral-900/55 px-3 py-2.5">
              <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-neutral-500">
                {label as string}
                <Icon className="h-3.5 w-3.5 text-neutral-600" />
              </div>
              <div className={`mt-1 text-lg font-bold ${tone}`}>{value as React.ReactNode}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Agent fabric */}
        <section className="xl:col-span-7 rounded-xl border border-neutral-800 bg-neutral-950/55 p-4">
          <div className="mb-3 flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Agent Fabric</div>
              <div className="mt-0.5 text-sm font-bold text-neutral-100">Registered Specialists</div>
            </div>
            <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-[9px] text-neutral-400">
              {agents.length} NODES
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {agents.map((agent) => {
              const selected = selectedAgent?.id === agent.id;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`panel-grid group rounded-lg border p-3 text-left transition ${
                    selected
                      ? 'border-cyan-500/60 bg-cyan-500/[0.06] ring-1 ring-cyan-500/20'
                      : 'border-neutral-800 bg-neutral-900/35 hover:border-neutral-700 hover:bg-neutral-900/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Cpu className={`h-4 w-4 ${selected ? 'text-cyan-400' : 'text-neutral-600'}`} />
                        <span className="truncate font-bold text-neutral-100">{agent.name}</span>
                      </div>
                      <div className="mt-1 truncate text-[9px] uppercase tracking-wider text-cyan-400">{agent.type}</div>
                    </div>
                    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[8px] ${statusTone[agent.status]}`}>
                      {agent.status}
                    </span>
                  </div>

                  <p className="mt-3 min-h-[32px] line-clamp-2 text-[10px] leading-4 text-neutral-500">{agent.description}</p>

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-neutral-800/80 pt-2 text-[9px]">
                    <div><span className="block text-neutral-600">PERF</span><strong className="text-emerald-300">{agent.performanceScore}%</strong></div>
                    <div><span className="block text-neutral-600">CONF</span><strong className="text-neutral-200">{agent.confidence}%</strong></div>
                    <div><span className="block text-neutral-600">RUNS</span><strong className="text-neutral-200">{agent.executionsCount}</strong></div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Inspector */}
        <aside className="xl:col-span-5 space-y-4">
          {selectedAgent ? (
            <>
              <section className="rounded-xl border border-neutral-800 bg-neutral-950/65 p-4">
                <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <div className="text-[9px] tracking-wider text-neutral-600">AGENT ID / {selectedAgent.id}</div>
                    <h2 className="mt-1 text-base font-bold text-neutral-100">{selectedAgent.name}</h2>
                    <div className="mt-1 text-[9px] uppercase tracking-wider text-cyan-400">{selectedAgent.type}</div>
                  </div>
                  <span className={`rounded border px-2 py-1 text-[8px] ${statusTone[selectedAgent.status]}`}>
                    {selectedAgent.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                    <div className="text-[9px] text-neutral-600">MODEL PROVIDER</div>
                    <div className="mt-1 truncate text-[10px] text-neutral-200">{selectedAgent.modelProvider}</div>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                    <div className="text-[9px] text-neutral-600">RISK PROFILE</div>
                    <div className={`mt-1 text-[10px] font-bold ${riskTone[selectedAgent.riskProfile]}`}>{selectedAgent.riskProfile}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-wider text-neutral-500">
                    <span>Runtime confidence</span><strong className="text-neutral-200">{selectedAgent.confidence}%</strong>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-900">
                    <div className="h-full rounded-full bg-cyan-500" style={{ width: `${selectedAgent.confidence}%` }} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-[9px] uppercase text-neutral-500"><Layers3 className="h-3 w-3" /> Capabilities</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedAgent.capabilities.map((cap) => <span key={cap} className="rounded border border-cyan-500/20 bg-cyan-500/5 px-1.5 py-1 text-[8px] text-cyan-300">{cap}</span>)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-[9px] uppercase text-neutral-500"><Wrench className="h-3 w-3" /> Tools</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedAgent.tools.map((tool) => <span key={tool} className="rounded border border-neutral-800 bg-neutral-900 px-1.5 py-1 text-[8px] text-neutral-300">{tool}</span>)}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-neutral-800 bg-neutral-950/65 p-4">
                <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  <div>
                    <div className="text-[10px] font-bold uppercase text-neutral-200">Direct Dispatch</div>
                    <div className="text-[9px] text-neutral-600">Routes through governed execution pipeline</div>
                  </div>
                </div>
                <form onSubmit={handleDispatch} className="mt-3 space-y-2">
                  <textarea
                    rows={4}
                    value={customTask}
                    onChange={(e) => setCustomTask(e.target.value)}
                    placeholder={`Instruction for ${selectedAgent.name}...`}
                    className="w-full resize-none rounded-lg border border-neutral-800 bg-neutral-900/70 p-3 text-[10px] leading-4 text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-cyan-500/60"
                  />
                  <button
                    type="submit"
                    disabled={!customTask.trim() || selectedAgent.status === 'PAUSED' || selectedAgent.status === 'DEGRADED'}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2.5 text-[10px] font-bold text-neutral-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" /> DISPATCH TO GOVERNED PIPELINE
                  </button>
                </form>
              </section>
            </>
          ) : (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/65 p-12 text-center text-neutral-600">NO AGENTS REGISTERED</div>
          )}
        </aside>
      </div>

      <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-neutral-800 bg-neutral-950/50 px-4 py-3 text-[9px] text-neutral-600">
        <span className="flex items-center gap-1.5"><LockKeyhole className="h-3 w-3" /> PERMISSIONS ENFORCED</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> POLICY GATE REQUIRED</span>
        <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-cyan-500" /> AI PROPOSALS ARE NON-AUTHORITATIVE</span>
      </footer>
    </div>
  );
};
