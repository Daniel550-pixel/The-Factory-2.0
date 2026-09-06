import React, { useState } from 'react';
import { Scale, Gavel } from 'lucide-react';
import type { Agent } from '../types';

interface ArbitrationViewProps { agents: Agent[]; }

export const ArbitrationView: React.FC<ArbitrationViewProps> = ({ agents }) => {
  const [activeTopic, setActiveTopic] = useState('grid-cooling-arbitration');
  const disputes = [
    { id:'grid-cooling-arbitration', title:'Dubai South DC-2: Pre-Cooling Ramp vs. Peak Tariff Cost', domain:'INFRASTRUCTURE_OPS vs FINANCIAL_RISK', status:'RESOLVED_BY_ARBITRATOR', timestamp:'2026-09-05T10:35:00.000Z', agentA:{name:'Infrastructure Specialist',position:'Ramp chillers at 420 kW immediately to avert server thermal throttling above 36.5°C.',confidence:94}, agentB:{name:'Financial Risk Officer',position:'Peak tariff in 45 minutes increases energy cost by 28%. Delay ramp by 20 minutes.',confidence:88}, arbitratorVerdict:{arbitrator:'Kernel Chief Arbitrator',consensusScore:91,verdict:'PARTIAL COMPROMISE ALLOWED: Ramp cooling at staggered 250 kW starting 15 minutes prior to peak window. Reduces thermal risk while shaving 62% of peak demand surcharge.',policyOutcome:'ALLOW_WITH_CONSTRAINTS'} },
    { id:'escrow-milestone-arbitration', title:'Abu Dhabi Clean Energy EPC: Milestone 3 Acceptance Verification', domain:'FINANCIAL_RISK vs SECURITY_OFFICER', status:'ESCALATED_TO_HUMAN', timestamp:'2026-09-05T09:12:00.000Z', agentA:{name:'Financial Risk Officer',position:'Disburse $240,000 USD escrow payment as sensor telemetry confirms 100% turbine uptime.',confidence:86}, agentB:{name:'Security Officer',position:'SCADA telemetry source lacks second-party dual-key signature. Flag as unverified.',confidence:95}, arbitratorVerdict:{arbitrator:'Kernel Chief Arbitrator',consensusScore:42,verdict:'DISPUTE UNRESOLVED: Security confidence supersedes financial proposal. Invariant triggered: Escalated to Human Dual-Custody Queue for manual physical sign-off.',policyOutcome:'ESCALATE'} }
  ];
  const current = disputes.find(d => d.id === activeTopic) || disputes[0];
  return <div className="factory-enter factory-grid factory-vignette min-h-full space-y-6 pb-12">
    <div className="factory-panel factory-scan border-x-0 border-t-0 px-1 pb-5 pt-1">
      <h1 className="flex items-center gap-2 font-mono text-lg font-bold uppercase tracking-wide text-neutral-100"><Scale className="h-5 w-5 text-cyan-400" /> Multi-Agent Arbitration & Consensus Engine</h1>
      <p className="mt-1 max-w-4xl font-mono text-xs text-neutral-400">Competing specialist proposals are reconciled against confidence, evidence, constraints, and policy impact before a decision is admitted to the execution plane.</p>
    </div>
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="space-y-3 font-mono text-xs lg:col-span-5">
        <div className="flex items-center justify-between"><span className="font-bold uppercase text-neutral-300">Arbitration Sessions ({disputes.length})</span><span className="text-[10px] text-neutral-500">AGENT FABRIC: {agents.length}</span></div>
        <div className="space-y-2">{disputes.map(d => { const selected=d.id===activeTopic; return <button key={d.id} onClick={()=>setActiveTopic(d.id)} className={`factory-panel-raised w-full rounded-xl p-3.5 text-left transition ${selected?'border-cyan-500/60 ring-1 ring-cyan-500/25':'hover:border-neutral-700'}`}>
          <div className="flex items-center justify-between gap-3"><span className="font-bold text-neutral-200">{d.title}</span><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${d.status.includes('ESCALATED')?'bg-amber-400':'bg-cyan-400'}`} /></div>
          <div className="mt-1 text-[10px] text-neutral-500">{d.domain}</div>
          <div className="mt-2 flex items-center justify-between border-t border-neutral-800 pt-2 text-[10px]"><span className={d.status.includes('ESCALATED')?'text-amber-300':'text-cyan-300'}>{d.status}</span><span className="text-neutral-500">{new Date(d.timestamp).toLocaleTimeString()}</span></div>
        </button>})}</div>
      </div>
      <div className="space-y-4 font-mono text-xs lg:col-span-7">
        <div className="factory-panel-raised factory-scan rounded-xl p-5">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-3"><div><span className="block text-[10px] text-neutral-500">{current.id}</span><h2 className="mt-1 text-sm font-bold text-neutral-100">{current.title}</h2></div><span className="shrink-0 rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-[10px] font-bold text-cyan-300">{current.status}</span></div>
          <div className="my-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {[current.agentA,current.agentB].map((agent,i)=><div key={agent.name} className={`factory-panel rounded-lg p-3.5 ${i===0?'border-cyan-900/60':'border-purple-900/60'}`}><div className="flex items-center justify-between gap-2"><span className={i===0?'text-cyan-300':'text-purple-300'}>{agent.name}</span><span className="text-[10px] text-emerald-400">{agent.confidence}% CONF</span></div><p className="mt-2 font-sans text-xs leading-relaxed text-neutral-300">{agent.position}</p><div className="mt-3 h-1 overflow-hidden rounded-full bg-neutral-900"><div className="h-full bg-current opacity-70" style={{width:`${agent.confidence}%`}} /></div></div>)}
          </div>
          <div className="rounded-xl border border-cyan-800/60 bg-cyan-950/20 p-4">
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 font-bold text-cyan-300"><Gavel className="h-4 w-4" /> ARBITRATOR VERDICT</span><span className="rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-[10px] text-cyan-200">CONSENSUS {current.arbitratorVerdict.consensusScore}%</span></div>
            <p className="mt-3 font-sans text-xs leading-relaxed text-neutral-200">{current.arbitratorVerdict.verdict}</p>
            <div className="mt-3 flex items-center justify-between border-t border-cyan-900/60 pt-2"><span className="text-neutral-500">POLICY IMPACT</span><span className={current.arbitratorVerdict.policyOutcome==='ESCALATE'?'text-amber-300':'text-emerald-400'}>{current.arbitratorVerdict.policyOutcome}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>;
};
