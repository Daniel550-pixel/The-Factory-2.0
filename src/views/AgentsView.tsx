import React, { useState } from 'react';
import {
  Users,
  Cpu,
  Shield,
  Zap,
  Play,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { Agent } from '../types';

interface AgentsViewProps {
  agents: Agent[];
  onDispatchAgent: (agentId: string, task: string, domain: string) => void;
}

export const AgentsView: React.FC<AgentsViewProps> = ({ agents, onDispatchAgent }) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent>(agents[0] || null);
  const [customTask, setCustomTask] = useState('');

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTask.trim() || !selectedAgent) return;
    onDispatchAgent(selectedAgent.id, customTask, selectedAgent.type);
    setCustomTask('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="text-lg font-bold font-mono text-neutral-100 uppercase tracking-wide flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan-400" />
          <span>Specialist Agent Registry & Worker Runtime</span>
        </h1>
        <p className="text-xs text-neutral-400 font-mono mt-0.5">
          Domain-specialized AI reasoning workers. Operates under the strict invariant that AI proposals must pass the deterministic Policy Gate before execution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Agent Cards Grid */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-mono font-bold text-neutral-300 uppercase">
            Registered Specialist Agents ({agents.length})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agents.map((ag) => {
              const isSelected = selectedAgent?.id === ag.id;

              return (
                <div
                  key={ag.id}
                  onClick={() => setSelectedAgent(ag)}
                  className={`p-4 rounded-xl border transition cursor-pointer font-mono text-xs space-y-2.5 ${
                    isSelected
                      ? 'border-cyan-500/60 bg-neutral-900/90 ring-1 ring-cyan-500/30'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-100">{ag.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {ag.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-cyan-400">{ag.type}</div>
                  <p className="text-neutral-400 text-[11px] line-clamp-2">{ag.description}</p>

                  <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-400">
                    <span>Performance: <strong className="text-emerald-400">{ag.performanceScore}%</strong></span>
                    <span>Confidence: <strong className="text-neutral-200">{ag.confidence}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Agent Inspector & Dispatcher */}
        <div className="lg:col-span-5 space-y-4">
          {selectedAgent ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div>
                  <span className="text-[10px] text-neutral-400 block">{selectedAgent.id}</span>
                  <h2 className="text-sm font-bold text-neutral-100">{selectedAgent.name}</h2>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-cyan-300">
                  {selectedAgent.type}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-neutral-400 uppercase">Capabilities & Tools:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedAgent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-cyan-400"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dispatch Task to this Agent */}
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <span className="text-[11px] font-bold text-neutral-200 uppercase flex items-center gap-1.5">
                  <Play className="h-3.5 w-3.5 text-cyan-400" />
                  Dispatch Direct Task to {selectedAgent.name}
                </span>

                <form onSubmit={handleDispatch} className="space-y-3">
                  <textarea
                    rows={3}
                    value={customTask}
                    onChange={(e) => setCustomTask(e.target.value)}
                    placeholder={`Enter instruction for ${selectedAgent.name}...`}
                    className="w-full rounded bg-neutral-950 border border-neutral-700 p-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 resize-none font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!customTask.trim()}
                    className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 font-bold text-neutral-950 transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Dispatch to Pipeline</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-neutral-500 font-mono text-xs">
              Select an agent to inspect details or dispatch a direct prompt.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
