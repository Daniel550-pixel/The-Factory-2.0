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
    <div className="factory-enter factory-grid space-y-6 pb-12 font-mono text-xs">
      <header className="factory-panel factory-scan rounded-xl p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-cyan-400">
              <ShieldCheck className="h-4 w-4" /> Runtime / Governance
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-100 uppercase">Deterministic Policy Gate</h1>
            <p className="mt-1 max-w-3xl text-[11px] leading-5 text-neutral-400">
              Authoritative firewall that evaluates agent proposals before any execution. Never allows AI to bypass deterministic rules.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-emerald-300">
            <Lock className="h-3.5 w-3.5" /> KERNEL ENFORCED
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3">
          <div className="factory-panel-raised rounded-lg px-3 py-2.5"><div className="text-[9px] uppercase tracking-wider text-neutral-500">ACTIVE RULES</div><div className="mt-1 text-lg font-bold text-cyan-300">{policies.length}</div></div>
          <div className="factory-panel-raised rounded-lg px-3 py-2.5"><div className="text-[9px] uppercase tracking-wider text-neutral-500">EVALUATION MODE</div><div className="mt-1 text-lg font-bold text-emerald-300">SEQUENTIAL</div></div>
          <div className="factory-panel-raised rounded-lg px-3 py-2.5"><div className="text-[9px] uppercase tracking-wider text-neutral-500">AI BYPASS</div><div className="mt-1 text-lg font-bold text-red-300">BLOCKED</div></div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="factory-panel lg:col-span-7 rounded-xl p-4">
          <div className="mb-4 flex items-center justify-between border-b border-neutral-800 pb-3">
            <div><div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Policy Registry</div><div className="mt-0.5 text-sm font-bold text-neutral-100">Active Deterministic Rules</div></div>
            <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-[9px] text-emerald-300">KERNEL ORDER</span>
          </div>
          <div className="space-y-3">
            {policies.map((pol) => {
              const isAllow = pol.effect === 'ALLOW';
              const isDeny = pol.effect === 'DENY';
              return (
                <div key={pol.id} className="factory-panel-raised rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-400" /><span className="font-bold text-neutral-100">{pol.name}</span><span className="text-[10px] text-neutral-500">({pol.id})</span></div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isAllow ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : isDeny ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>{pol.effect}</span>
                  </div>
                  <p className="text-neutral-300 text-[11px] leading-5">{pol.description}</p>
                  <div className="rounded-lg border border-cyan-500/10 bg-black/30 p-3 text-[10px] text-neutral-400"><span className="text-cyan-400 block font-bold uppercase tracking-wider mb-1">Rule Logic</span><code>{pol.condition}</code></div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="factory-panel-raised lg:col-span-5 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div><div className="flex items-center gap-2"><Sliders className="h-4 w-4 text-cyan-400" /><h2 className="font-bold text-neutral-100 uppercase">Policy Gate Tester</h2></div><div className="mt-1 text-[9px] text-neutral-600">Live deterministic evaluation path</div></div>
            <span className="text-[9px] text-cyan-400">SIMULATION</span>
          </div>
          <form onSubmit={handleTest} className="space-y-3">
            <div><label className="text-[11px] text-neutral-400 block mb-1">Proposal Category</label><select value={testType} onChange={(e) => setTestType(e.target.value)} className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-2.5 py-2 text-xs text-neutral-200 focus:border-cyan-500/60 focus:outline-none"><option value="DISBURSEMENT">DISBURSEMENT (Financial)</option><option value="INFRASTRUCTURE_CONTROL">INFRASTRUCTURE_CONTROL (Cooling/Grid)</option><option value="SECURITY_POLICY_UPDATE">SECURITY_POLICY_UPDATE (Root Access)</option><option value="DATA_MODIFICATION">DATA_MODIFICATION</option><option value="QUERY">READ_ONLY QUERY</option></select></div>
            <div><label className="text-[11px] text-neutral-400 block mb-1">Requested Action Name</label><input type="text" value={testAction} onChange={(e) => setTestAction(e.target.value)} className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-2.5 py-2 text-xs text-neutral-200 focus:border-cyan-500/60 focus:outline-none font-mono" /></div>
            <div className="grid grid-cols-2 gap-2"><div><label className="text-[11px] text-neutral-400 block mb-1">Amount ($ USD)</label><input type="number" value={testAmount} onChange={(e) => setTestAmount(Number(e.target.value))} className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-2.5 py-2 text-xs text-neutral-200 focus:border-cyan-500/60 focus:outline-none font-mono" /></div><div><label className="text-[11px] text-neutral-400 block mb-1">Risk Score (0-100)</label><input type="number" value={testRiskScore} onChange={(e) => setTestRiskScore(Number(e.target.value))} className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-2.5 py-2 text-xs text-neutral-200 focus:border-cyan-500/60 focus:outline-none font-mono" /></div></div>
            <div><label className="text-[11px] text-neutral-400 block mb-1">Evidence Confidence ({testConfidence}%)</label><input type="range" min={0} max={100} value={testConfidence} onChange={(e) => setTestConfidence(Number(e.target.value))} className="w-full accent-cyan-400" /></div>
            <button type="submit" disabled={isEvaluating} className="factory-node-active w-full rounded-lg bg-cyan-500 py-2.5 font-bold text-neutral-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center gap-1.5"><Play className="h-3.5 w-3.5 fill-current" /><span>{isEvaluating ? 'Evaluating Rules...' : 'Test Proposal Gate Outcome'}</span></button>
          </form>
          {testResult && <div className="factory-panel mt-3 rounded-xl p-4 space-y-2"><div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider text-neutral-500">Evaluation Outcome</span><span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${testResult.outcome === 'ALLOW' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : testResult.outcome === 'DENY' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>{testResult.outcome}</span></div><div className="rounded-lg bg-black/30 border border-neutral-800 p-3 text-[11px] text-neutral-300">{testResult.reason}</div><div className="space-y-1"><span className="text-[10px] text-neutral-500 uppercase">Triggered Rules</span>{testResult.appliedPolicies.map((p) => <div key={p.policyId} className="rounded border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-[10px] flex items-center justify-between"><span className="text-neutral-300">{p.policyName}</span><span className="text-cyan-400 font-bold">{p.effect}</span></div>)}</div></div>}
        </section>
      </div>
    </div>
  );
};
