import React from 'react';
import { ArrowRight, CheckCircle2, FileCheck2, LockKeyhole, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { ExecutionContext } from '../types';

interface ExecutionInspectorProps {
  execution: ExecutionContext | null;
  onNavigate: (tabId: string) => void;
}

const statusTone = (status: ExecutionContext['status']) => {
  if (status === 'COMPLETED') return 'text-emerald-300 border-emerald-400/15 bg-emerald-400/[0.05]';
  if (status === 'FAILED' || status === 'DENIED') return 'text-rose-300 border-rose-400/15 bg-rose-400/[0.05]';
  if (status === 'ESCALATED') return 'text-amber-300 border-amber-400/15 bg-amber-400/[0.05]';
  return 'text-cyan-300 border-cyan-400/15 bg-cyan-400/[0.05]';
};

export const ExecutionInspector: React.FC<ExecutionInspectorProps> = ({ execution, onNavigate }) => {
  if (!execution) return null;

  const evidenceVerified = execution.evidence.filter((item) => item.verified).length;
  const evidenceTotal = execution.evidence.length;
  const policy = execution.policyDecision;
  const auth = execution.authorization;
  const proposal = execution.proposal;

  return (
    <section className="factory-panel mt-4 overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[8px] tracking-[0.2em] text-cyan-400">TRACE INSPECTOR</span>
            <span className="text-neutral-700">/</span>
            <span className="truncate font-mono text-[9px] text-neutral-500">{execution.executionId}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-md border px-2 py-1 font-mono text-[8px] tracking-wider ${statusTone(execution.status)}`}>{execution.status}</span>
            <span className="font-mono text-[8px] text-neutral-600">TRACE {execution.traceId}</span>
          </div>
        </div>
        <button onClick={() => onNavigate('executions')} className="flex items-center gap-1.5 self-start rounded-md border border-white/[0.07] bg-white/[0.025] px-2.5 py-2 font-mono text-[8px] text-neutral-500 transition hover:border-white/[0.13] hover:text-neutral-300 sm:self-auto">FULL EXECUTION <ArrowRight className="h-3 w-3" /></button>
      </div>

      <div className="grid grid-cols-1 gap-px bg-white/[0.05] lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
        <div className="bg-[#090b0d] p-4">
          <div className="mb-3 flex items-center gap-2"><FileCheck2 className="h-3.5 w-3.5 text-violet-300" /><span className="font-mono text-[8px] tracking-[0.18em] text-neutral-500">EVIDENCE</span></div>
          <div className="text-xs leading-5 text-neutral-300">{proposal?.summary ?? execution.request.input}</div>
          <div className="mt-3 flex items-center justify-between font-mono text-[8px]"><span className="text-neutral-600">VERIFIED SOURCES</span><span className={evidenceVerified === evidenceTotal ? 'text-emerald-300' : 'text-amber-300'}>{evidenceVerified}/{evidenceTotal}</span></div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full bg-violet-400/70" style={{ width: `${evidenceTotal ? Math.round((evidenceVerified / evidenceTotal) * 100) : 0}%` }} /></div>
          <button onClick={() => onNavigate('evidence-provenance')} className="mt-3 font-mono text-[8px] text-violet-300 hover:text-violet-200">OPEN PROVENANCE →</button>
        </div>

        <div className="bg-[#090b0d] p-4">
          <div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /><span className="font-mono text-[8px] tracking-[0.18em] text-neutral-500">POLICY DECISION</span></div>
          {policy ? <><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${policy.outcome === 'ALLOW' ? 'bg-emerald-400' : policy.outcome === 'DENY' ? 'bg-rose-400' : 'bg-amber-400'}`} /><span className="font-mono text-sm font-semibold text-neutral-200">{policy.outcome}</span></div><p className="mt-2 text-[10px] leading-4 text-neutral-600">{policy.reason}</p><div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[8px]"><div><span className="text-neutral-700">RISK </span><span className="text-amber-300">{policy.riskScore}</span></div><div><span className="text-neutral-700">CONF </span><span className="text-cyan-300">{policy.confidence}%</span></div></div></> : <div className="text-[10px] text-neutral-600">Policy evaluation not recorded.</div>}
          <button onClick={() => onNavigate('policy-gate')} className="mt-3 font-mono text-[8px] text-emerald-300 hover:text-emerald-200">OPEN POLICY GATE →</button>
        </div>

        <div className="bg-[#090b0d] p-4">
          <div className="mb-3 flex items-center gap-2"><LockKeyhole className="h-3.5 w-3.5 text-cyan-300" /><span className="font-mono text-[8px] tracking-[0.18em] text-neutral-500">AUTHORIZATION</span></div>
          {auth ? <><div className="flex items-center gap-2">{auth.authorized ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <ShieldAlert className="h-4 w-4 text-rose-300" />}<span className={auth.authorized ? 'text-emerald-300' : 'text-rose-300'}>{auth.authorized ? 'AUTHORIZED' : 'BLOCKED'}</span></div><div className="mt-2 font-mono text-[8px] text-neutral-600">{auth.method} / {auth.authorizer}</div></> : <><div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-amber-300" /><span className="text-amber-300">AWAITING AUTH</span></div><div className="mt-2 text-[9px] text-neutral-600">No execution authority has been recorded.</div></>}
          <div className="mt-4 border-t border-white/[0.06] pt-3"><div className="font-mono text-[8px] text-neutral-700">CAPABILITY</div><div className="mt-1 truncate font-mono text-[9px] text-neutral-400">{execution.capabilityId}</div></div>
        </div>
      </div>
    </section>
  );
};
