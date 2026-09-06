import React, { useState } from 'react';
import {
  Scale,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Brain,
  ArrowRight,
  Gavel,
} from 'lucide-react';
import type { Agent } from '../types';

interface ArbitrationViewProps {
  agents: Agent[];
}

export const ArbitrationView: React.FC<ArbitrationViewProps> = ({ agents }) => {
  const [activeTopic, setActiveTopic] = useState('grid-cooling-arbitration');

  const disputes = [
    {
      id: 'grid-cooling-arbitration',
      title: 'Dubai South DC-2: Pre-Cooling Ramp vs. Peak Tariff Cost',
      domain: 'INFRASTRUCTURE_OPS vs FINANCIAL_RISK',
      status: 'RESOLVED_BY_ARBITRATOR',
      timestamp: '2026-09-05T10:35:00.000Z',
      agentA: {
        name: 'Infrastructure Specialist',
        position: 'Ramp chillers at 420 kW immediately to avert server thermal throttling above 36.5°C.',
        confidence: 94,
      },
      agentB: {
        name: 'Financial Risk Officer',
        position: 'Peak tariff in 45 minutes increases energy cost by 28%. Delay ramp by 20 minutes.',
        confidence: 88,
      },
      arbitratorVerdict: {
        arbitrator: 'Kernel Chief Arbitrator',
        consensusScore: 91,
        verdict: 'PARTIAL COMPROMISE ALLOWED: Ramp cooling at staggered 250 kW starting 15 minutes prior to peak window. Reduces thermal risk while shaving 62% of peak demand surcharge.',
        policyOutcome: 'ALLOW_WITH_CONSTRAINTS',
      },
    },
    {
      id: 'escrow-milestone-arbitration',
      title: 'Abu Dhabi Clean Energy EPC: Milestone 3 Acceptance Verification',
      domain: 'FINANCIAL_RISK vs SECURITY_OFFICER',
      status: 'ESCALATED_TO_HUMAN',
      timestamp: '2026-09-05T09:12:00.000Z',
      agentA: {
        name: 'Financial Risk Officer',
        position: 'Disburse $240,000 USD escrow payment as sensor telemetry confirms 100% turbine uptime.',
        confidence: 86,
      },
      agentB: {
        name: 'Security Officer',
        position: 'SCADA telemetry source lacks second-party dual-key signature. Flag as unverified.',
        confidence: 95,
      },
      arbitratorVerdict: {
        arbitrator: 'Kernel Chief Arbitrator',
        consensusScore: 42,
        verdict: 'DISPUTE UNRESOLVED: Security confidence supersedes financial proposal. Invariant triggered: Escalated to Human Dual-Custody Queue for manual physical sign-off.',
        policyOutcome: 'ESCALATE',
      },
    },
  ];

  const current = disputes.find((d) => d.id === activeTopic) || disputes[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="text-lg font-bold font-mono text-neutral-100 uppercase tracking-wide flex items-center gap-2">
          <Scale className="h-5 w-5 text-cyan-400" />
          <span>Multi-Agent Arbitration & Consensus Engine</span>
        </h1>
        <p className="text-xs text-neutral-400 font-mono mt-0.5">
          When multiple specialist agents submit competing proposals, the Factory arbitrator reconciles trade-offs, evaluates evidence confidence, and establishes consensus before policy gating.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Disputes List */}
        <div className="lg:col-span-5 space-y-3 font-mono text-xs">
          <span className="font-bold text-neutral-300 uppercase">
            Arbitration Sessions ({disputes.length})
          </span>

          <div className="space-y-2">
            {disputes.map((d) => {
              const isSelected = d.id === activeTopic;
              return (
                <div
                  key={d.id}
                  onClick={() => setActiveTopic(d.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'border-cyan-500/60 bg-neutral-900/90 ring-1 ring-cyan-500/30'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-200">{d.title}</span>
                  </div>
                  <div className="text-[10px] text-neutral-400">{d.domain}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-900 text-[10px]">
                    <span className="text-cyan-400 font-semibold">{d.status}</span>
                    <span className="text-neutral-500">{new Date(d.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dispute Reconciliation Details */}
        <div className="lg:col-span-7 space-y-4 font-mono text-xs">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] text-neutral-400 block">{current.id}</span>
                <h2 className="text-sm font-bold text-neutral-100">{current.title}</h2>
              </div>
              <span className="text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                {current.status}
              </span>
            </div>

            {/* Competing Agents Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Agent A */}
              <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-cyan-300 font-bold">
                  <span>{current.agentA.name}</span>
                  <span className="text-[10px] text-emerald-400">{current.agentA.confidence}% Conf</span>
                </div>
                <p className="text-neutral-300 font-sans text-xs">{current.agentA.position}</p>
              </div>

              {/* Agent B */}
              <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-purple-300 font-bold">
                  <span>{current.agentB.name}</span>
                  <span className="text-[10px] text-emerald-400">{current.agentB.confidence}% Conf</span>
                </div>
                <p className="text-neutral-300 font-sans text-xs">{current.agentB.position}</p>
              </div>
            </div>

            {/* Arbitrator Verdict Card */}
            <div className="p-4 rounded-xl border border-cyan-800/60 bg-cyan-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 flex items-center gap-2">
                  <Gavel className="h-4 w-4" />
                  Arbitrator Verdict & Reconciliation:
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 text-cyan-200 border border-neutral-800">
                  Consensus: {current.arbitratorVerdict.consensusScore}%
                </span>
              </div>

              <p className="text-neutral-200 font-sans text-xs leading-relaxed">
                {current.arbitratorVerdict.verdict}
              </p>

              <div className="pt-2 border-t border-cyan-900/60 flex items-center justify-between text-[11px]">
                <span className="text-neutral-400">Policy Impact:</span>
                <span className="text-emerald-400 font-bold">{current.arbitratorVerdict.policyOutcome}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
