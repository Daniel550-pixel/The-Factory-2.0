import React, { useState } from 'react';
import { Play, X, ShieldAlert, Cpu, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import type { Agent } from '../types';

interface QuickExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  onExecute: (input: string, agentId: string, domain: string) => Promise<void>;
}

export const QuickExecutionModal: React.FC<QuickExecutionModalProps> = ({
  isOpen,
  onClose,
  agents,
  onExecute,
}) => {
  const [input, setInput] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || 'agent-supervisor');
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const presets = [
    {
      title: 'Infrastructure Cooling Optimization',
      agent: 'agent-infra-ops',
      domain: 'INFRASTRUCTURE_OPS',
      prompt: 'Analyze ambient temperature surge at Dubai South DC-2 and propose 420 kW pre-cooling load ramp before peak hours.',
    },
    {
      title: 'High-Value Escrow Disbursement ($240k)',
      agent: 'agent-financial-risk',
      domain: 'FINANCIAL_RISK',
      prompt: 'Disburse $240,000 USD milestone payment to contractor upon completion of Abu Dhabi Clean Energy Phase 3.',
    },
    {
      title: 'Ledger Cryptographic Audit',
      agent: 'agent-security-officer',
      domain: 'SECURITY_OFFICER',
      prompt: 'Execute full SHA-256 block hash verification on canonical event ledger and audit for tampering.',
    },
    {
      title: 'Unauthorized Root Security Probe',
      agent: 'agent-security-officer',
      domain: 'SECURITY_OFFICER',
      prompt: 'Attempt unauthorized modification of root policy table to grant unrestricted write access.',
    },
    {
      title: 'Port Dwell Time Optimization',
      agent: 'agent-logistics-geo',
      domain: 'LOGISTICS_GEO',
      prompt: 'Reroute 450 TEU container backlog from Jebel Ali Berth 7 to Khalifa Port Container Terminal 2.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isRunning) return;

    setIsRunning(true);
    try {
      const selectedAgent = agents.find((a) => a.id === selectedAgentId);
      await onExecute(input, selectedAgentId, selectedAgent?.type || 'SUPERVISOR');
      onClose();
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-800 text-cyan-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wide">
                Dispatch Task to Factory Runtime
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Pipeline: Observation → Reasoning → Proposal → Verification → Policy Gate → Execution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-200 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Agent Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 font-mono uppercase">
              Target Specialist Agent
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-200 focus:border-cyan-500 focus:outline-none"
            >
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} ({ag.type}) — Confidence: {ag.confidence}%
                </option>
              ))}
            </select>
          </div>

          {/* Prompt / Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 font-mono uppercase">
              Intent / Request / Claim Input
            </label>
            <textarea
              rows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the operational task or scenario to evaluate..."
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:border-cyan-500 focus:outline-none resize-none"
              required
            />
          </div>

          {/* Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-neutral-400 uppercase">
              Quick Scenarios:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  type="button"
                  key={preset.title}
                  onClick={() => {
                    setInput(preset.prompt);
                    setSelectedAgentId(preset.agent);
                  }}
                  className="text-left p-2.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:border-cyan-500/40 hover:bg-neutral-800/50 transition group"
                >
                  <div className="text-xs font-semibold text-neutral-200 group-hover:text-cyan-300">
                    {preset.title}
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate font-mono">
                    {preset.prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Policy Invariant Reminder */}
          <div className="rounded-lg border border-cyan-950 bg-cyan-950/20 p-3 text-xs font-mono text-cyan-300 flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-cyan-200">Execution Invariant Enforced:</span>
              <p className="text-[11px] text-cyan-400/80 mt-0.5">
                The agent will generate an actionable proposal, but execution is deterministically governed by the Policy Gate. High-risk actions will trigger human escalation.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRunning || !input.trim()}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-4 py-2 text-xs font-bold text-neutral-950 transition"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isRunning ? 'Running Pipeline...' : 'Execute Pipeline'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
