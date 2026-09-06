import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
  Filter,
} from 'lucide-react';
import type { PolicyRule, PolicyDecision } from '../types';

interface PolicyGateViewProps {
  policies: PolicyRule[];
  onTestProposal: (proposal: {
    type: string;
    requestedAction: string;
    riskScore: number;
    amount?: number;
    evidenceConfidence?: number;
  }) => Promise<PolicyDecision>;
}

export const PolicyGateView: React.FC<PolicyGateViewProps> = ({
  policies,
  onTestProposal,
}) => {
  const [testType, setTestType] = useState('DISBURSEMENT');
  const [testAction, setTestAction] = useState('DISBURSE_FUNDS');
  const [testRiskScore, setTestRiskScore] = useState(45);
  const [testAmount, setTestAmount] = useState(25000);
  const [testConfidence, setTestConfidence] = useState(90);
  const [testResult, setTestResult] = useState<PolicyDecision | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEvaluating(true);
    try {
      const res = await onTestProposal({
        type: testType,
        requestedAction: testAction,
        riskScore: testRiskScore,
        amount: testAmount,
        evidenceConfidence: testConfidence,
      });
      setTestResult(res);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="text-lg font-bold font-mono text-neutral-100 uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <span>Deterministic Policy Gate & Invariant Engine</span>
        </h1>
        <p className="text-xs text-neutral-400 font-mono mt-0.5">
          Authoritative firewall that evaluates agent proposals before any execution. Never allows AI to bypass deterministic rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Deterministic Policy Rules */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase">
              Active Deterministic Rules ({policies.length})
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              Evaluated sequentially by Kernel
            </span>
          </div>

          <div className="space-y-3">
            {policies.map((pol) => {
              const isAllow = pol.effect === 'ALLOW';
              const isDeny = pol.effect === 'DENY';
              const isEscalate = pol.effect === 'ESCALATE';

              return (
                <div
                  key={pol.id}
                  className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-2 font-mono text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-100">{pol.name}</span>
                      <span className="text-[10px] text-neutral-400">({pol.id})</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isAllow
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : isDeny
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {pol.effect}
                    </span>
                  </div>

                  <p className="text-neutral-300 text-[11px]">{pol.description}</p>

                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400">
                    <span className="text-cyan-400 block font-bold">Rule Logic:</span>
                    <code>{pol.condition}</code>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Policy Simulator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <h2 className="font-bold text-neutral-100 uppercase">Policy Gate Tester</h2>
              </div>
              <span className="text-[10px] text-neutral-400">Real-Time Evaluation</span>
            </div>

            <form onSubmit={handleTest} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Proposal Category:</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-full rounded bg-neutral-950 border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="DISBURSEMENT">DISBURSEMENT (Financial)</option>
                  <option value="INFRASTRUCTURE_CONTROL">INFRASTRUCTURE_CONTROL (Cooling/Grid)</option>
                  <option value="SECURITY_POLICY_UPDATE">SECURITY_POLICY_UPDATE (Root Access)</option>
                  <option value="DATA_MODIFICATION">DATA_MODIFICATION</option>
                  <option value="QUERY">READ_ONLY QUERY</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Requested Action Name:</label>
                <input
                  type="text"
                  value={testAction}
                  onChange={(e) => setTestAction(e.target.value)}
                  className="w-full rounded bg-neutral-950 border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Amount ($ USD):</label>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(Number(e.target.value))}
                    className="w-full rounded bg-neutral-950 border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Risk Score (0-100):</label>
                  <input
                    type="number"
                    value={testRiskScore}
                    onChange={(e) => setTestRiskScore(Number(e.target.value))}
                    className="w-full rounded bg-neutral-950 border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Evidence Confidence ({testConfidence}%):
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={testConfidence}
                  onChange={(e) => setTestConfidence(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={isEvaluating}
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold text-neutral-950 transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{isEvaluating ? 'Evaluating Rules...' : 'Test Proposal Gate Outcome'}</span>
              </button>
            </form>

            {/* Test Result Display */}
            {testResult && (
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">EVALUATION OUTCOME:</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      testResult.outcome === 'ALLOW'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : testResult.outcome === 'DENY'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {testResult.outcome}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300">
                  {testResult.reason}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase">Triggered Rules:</span>
                  {testResult.appliedPolicies.map((p) => (
                    <div
                      key={p.policyId}
                      className="p-1.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] flex items-center justify-between"
                    >
                      <span className="text-neutral-300">{p.policyName}</span>
                      <span className="text-cyan-400 font-bold">{p.effect}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
