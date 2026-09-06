import React, { useState } from 'react';
import {
  Wrench,
  Server,
  Clock,
  LineChart,
  ShieldAlert,
  CheckCircle2,
  Activity,
  Layers,
  Cpu,
  Lock,
} from 'lucide-react';
import type { ToolDefinition } from '../types';

interface OperationsViewProps {
  tools: ToolDefinition[];
}

export const OperationsView: React.FC<OperationsViewProps> = ({ tools }) => {
  const [activeTab, setActiveTab] = useState<'TOOLS' | 'PROVIDERS' | 'SCHEDULER' | 'TRACES'>('TOOLS');

  const providers = [
    {
      id: 'provider-gemini',
      name: 'Google Gemini 2.5 Flash',
      type: 'SERVER_SIDE_REASONING',
      status: 'ONLINE',
      latencyMs: 380,
      availability: 99.98,
      activeContext: 'Gemini Antigravity Core',
    },
    {
      id: 'provider-kernel',
      name: 'Factory Local Deterministic Kernel',
      type: 'POLICY_EVALUATION',
      status: 'ONLINE',
      latencyMs: 12,
      availability: 100.0,
      activeContext: 'Node/Express Core',
    },
    {
      id: 'provider-crypto',
      name: 'SHA-256 Ledger Cryptographic Engine',
      type: 'LEDGER_VERIFICATION',
      status: 'ONLINE',
      latencyMs: 4,
      availability: 100.0,
      activeContext: 'SubtleCrypto / Node Crypto',
    },
  ];

  const scheduledJobs = [
    {
      id: 'job-ledger-audit',
      name: 'Continuous SHA-256 Ledger Integrity Audit',
      cron: '*/5 * * * *',
      lastRun: '2 mins ago',
      status: 'HEALTHY',
      policy: 'READ_ONLY_AUDIT (Auto-Allow)',
    },
    {
      id: 'job-grid-telemetry',
      name: 'Dubai South & Abu Dhabi SCADA Telemetry Ingest',
      cron: '*/1 * * * *',
      lastRun: '20 secs ago',
      status: 'HEALTHY',
      policy: 'DATA_INGEST (Verified Source)',
    },
    {
      id: 'job-escrow-reconciliation',
      name: 'Daily Escrow Milestone Bank Reconciliation',
      cron: '0 0 * * *',
      lastRun: '11 hours ago',
      status: 'HEALTHY',
      policy: 'ESCALATION_GATED (Dual-Sign-Off)',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-lg font-bold font-mono text-neutral-100 uppercase tracking-wide flex items-center gap-2">
            <Wrench className="h-5 w-5 text-cyan-400" />
            <span>Operations, Tools & Provider Infrastructure</span>
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Tool registries with deterministic capability permissions, provider abstraction, automated cron schedulers, and distributed tracing.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center rounded-lg bg-neutral-900 p-1 border border-neutral-800 text-xs font-mono">
          {(['TOOLS', 'PROVIDERS', 'SCHEDULER', 'TRACES'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === t
                  ? 'bg-neutral-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'TOOLS' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-neutral-200 uppercase">
              Registered System Tools ({tools.length})
            </span>
            <span className="text-[11px] text-neutral-400">
              Deterministic Capability-Based Permissions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tools.map((tool) => {
              const isHigh = tool.riskLevel === 'HIGH';
              const isCrit = tool.riskLevel === 'CRITICAL';

              return (
                <div
                  key={tool.id}
                  className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-100">{tool.name}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full border ${
                        isCrit
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : isHigh
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {tool.riskLevel} RISK
                    </span>
                  </div>

                  <p className="text-neutral-400 text-[11px] font-sans line-clamp-2">
                    {tool.description}
                  </p>

                  <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-400">
                    <span>Category: {tool.category}</span>
                    <span className="text-cyan-400">Cap: {tool.requiredCapability}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'PROVIDERS' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-neutral-200 uppercase">
              Provider Layer & Model Abstraction ({providers.length})
            </span>
            <span className="text-[11px] text-emerald-400">Model-Independent Architecture</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {providers.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-100">{p.name}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {p.status}
                  </span>
                </div>

                <div className="text-[11px] text-cyan-400">{p.type}</div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-neutral-900">
                  <div>
                    <span className="text-neutral-400 block">Avg Latency:</span>
                    <span className="text-neutral-200 font-bold">{p.latencyMs}ms</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Availability:</span>
                    <span className="text-emerald-400 font-bold">{p.availability}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'SCHEDULER' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-neutral-200 uppercase">
              Deterministic Scheduler ({scheduledJobs.length})
            </span>
            <span className="text-[11px] text-neutral-400">
              All Scheduled Jobs Pass Policy Gate
            </span>
          </div>

          <div className="space-y-2.5">
            {scheduledJobs.map((job) => (
              <div
                key={job.id}
                className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-200">{job.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-cyan-300">
                      Cron: {job.cron}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Policy Evaluation: <strong className="text-neutral-300">{job.policy}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-neutral-400">Last Run: {job.lastRun}</span>
                  <span className="text-emerald-400 font-bold">{job.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'TRACES' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 space-y-4">
            <span className="font-bold text-neutral-100 uppercase block border-b border-neutral-800 pb-2">
              Distributed Execution Latency Waterfall Trace
            </span>

            <div className="space-y-3">
              {[
                { stage: '1. Ingest & Observation', latency: '4ms', pct: 2, color: 'bg-blue-500' },
                { stage: '2. Context Snapshot Assembly', latency: '12ms', pct: 6, color: 'bg-cyan-500' },
                { stage: '3. Agent Reasoning & Inference', latency: '210ms', pct: 65, color: 'bg-purple-500' },
                { stage: '4. Evidence Verification', latency: '18ms', pct: 8, color: 'bg-indigo-500' },
                { stage: '5. Deterministic Policy Gate', latency: '6ms', pct: 3, color: 'bg-emerald-500' },
                { stage: '6. Authorized Execution Run', latency: '45ms', pct: 12, color: 'bg-amber-500' },
                { stage: '7. SHA-256 Ledger Block Commit', latency: '8ms', pct: 4, color: 'bg-rose-500' },
              ].map((trace) => (
                <div key={trace.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-300">{trace.stage}</span>
                    <span className="text-neutral-400">{trace.latency} ({trace.pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-950 overflow-hidden">
                    <div
                      className={`h-full ${trace.color}`}
                      style={{ width: `${Math.max(trace.pct, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
