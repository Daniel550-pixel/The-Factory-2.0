import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, Cpu, Layers3, LockKeyhole, Play, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import type { SystemStatus, RuntimeMode } from '../types';

interface HeaderProps {
  status: SystemStatus | null;
  activeMode: RuntimeMode;
  onModeChange: (mode: RuntimeMode) => void;
  onOpenQuickLaunch: () => void;
  onOpenCommandPalette: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const modeMeta: Record<RuntimeMode, { label: string; tone: string }> = {
  LIVE: { label: 'LIVE', tone: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/25' },
  SIMULATION: { label: 'SIM', tone: 'text-amber-300 bg-amber-400/10 border-amber-400/25' },
  REPLAY: { label: 'REPLAY', tone: 'text-violet-300 bg-violet-400/10 border-violet-400/25' },
  RECOVERY: { label: 'RECOVERY', tone: 'text-rose-300 bg-rose-400/10 border-rose-400/25' },
};

export const Header: React.FC<HeaderProps> = ({ status, activeMode, onModeChange, onOpenQuickLaunch, onOpenCommandPalette, onRefresh, isRefreshing }) => {
  const ledgerVerified = status?.ledgerIntegrity === 'VERIFIED';
  const pendingApprovals = status?.pendingApprovals ?? 0;

  return (
    <header className="sticky top-0 z-50 h-[64px] w-full border-b border-white/[0.07] bg-[#07090b]/95 shadow-[0_8px_30px_rgba(0,0,0,.16)] backdrop-blur-xl">
      <div className="flex h-full items-center gap-2.5 px-3 sm:px-4 lg:px-5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/[0.07] text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.08)] sm:h-9 sm:w-9">
            <Cpu className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]" />
          </div>
          <div className="min-w-0 leading-none">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="truncate text-[11px] font-semibold tracking-[0.16em] text-white sm:text-[13px] sm:tracking-[0.18em]">THE FACTORY</span>
              <span className="hidden rounded border border-white/[0.08] bg-white/[0.035] px-1.5 py-1 font-mono text-[9px] tracking-wider text-neutral-500 sm:inline">K2.4</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[8px] tracking-[0.12em] text-neutral-600 sm:text-[9px] sm:tracking-[0.14em]">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> CONTROL PLANE / RUNTIME
            </div>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 items-center gap-2 xl:flex">
          <div className="factory-command-focus flex min-w-0 items-center gap-2 rounded-md border border-cyan-400/15 bg-cyan-400/[0.035] px-3 py-2">
            <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
            <span className="truncate font-mono text-[10px] font-medium tracking-wide text-cyan-200/80">AI DECIDES <span className="text-cyan-400">≠</span> AI EXECUTES</span>
          </div>
          <div className="hidden 2xl:flex items-center gap-2 font-mono text-[9px] font-medium tracking-wider text-neutral-600"><span>/</span><span>GOVERNED RUNTIME</span></div>
        </div>

        <div className="hidden items-center gap-1.5 2xl:flex">
          <div className={`flex items-center gap-1.5 rounded-md border px-2.5 py-2 font-mono text-[9px] ${ledgerVerified ? 'border-emerald-400/12 bg-emerald-400/[0.025]' : 'border-rose-400/15 bg-rose-400/[0.025]'}`}>
            {ledgerVerified ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />}
            <span className="text-neutral-500">LEDGER</span><span className={ledgerVerified ? 'text-emerald-300' : 'text-rose-300'}>{ledgerVerified ? 'VERIFIED' : 'ALERT'}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.025] px-2.5 py-2 font-mono text-[9px]"><Activity className="h-3.5 w-3.5 text-cyan-300" /><span className="text-neutral-500">AGENTS</span><span className="text-neutral-200">{status?.activeAgents ?? 0}</span></div>
          <button onClick={() => onOpenQuickLaunch()} className={`flex items-center gap-1.5 rounded-md border px-2.5 py-2 font-mono text-[9px] transition ${pendingApprovals > 0 ? 'border-amber-400/20 bg-amber-400/[0.06] text-amber-300 hover:bg-amber-400/[0.1]' : 'border-white/[0.07] bg-white/[0.025] text-neutral-500 hover:bg-white/[0.05] hover:text-neutral-300'}`} title={pendingApprovals > 0 ? `${pendingApprovals} approval(s) pending` : 'No pending approvals'}>
            <ShieldCheck className="h-3.5 w-3.5" /><span>QUEUE</span><span>{pendingApprovals}</span>
          </button>
          <div className="flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.025] px-2.5 py-2 font-mono text-[9px]"><Layers3 className="h-3.5 w-3.5 text-neutral-500" /><span className="text-neutral-500">POLICY</span><span className="text-emerald-300">{status?.policyStats.allow ?? 0}A</span><span className="text-rose-300">{status?.policyStats.deny ?? 0}D</span><span className="text-amber-300">{status?.policyStats.escalate ?? 0}E</span></div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center rounded-md border border-white/[0.07] bg-white/[0.025] p-0.5 md:flex">
            {(['LIVE', 'SIMULATION', 'REPLAY', 'RECOVERY'] as RuntimeMode[]).map((mode) => {
              const active = activeMode === mode; const meta = modeMeta[mode];
              return <button key={mode} onClick={() => onModeChange(mode)} className={`rounded border px-2.5 py-1.5 font-mono text-[9px] font-medium tracking-wider transition-all ${active ? meta.tone : 'border-transparent text-neutral-600 hover:text-neutral-300'}`}>{meta.label}</button>;
            })}
          </div>
          <button onClick={onRefresh} disabled={isRefreshing} className="factory-control flex h-8 w-8 items-center justify-center text-neutral-500 sm:h-9 sm:w-9" title="Refresh system state" aria-label="Refresh system state"><RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-300' : ''}`} /></button>
          <button onClick={onOpenCommandPalette} className="factory-control hidden h-9 items-center gap-2 px-3 font-mono text-[9px] font-medium tracking-wide text-neutral-500 lg:flex" aria-label="Open command palette"><Search className="h-3.5 w-3.5" /><span>COMMAND</span><kbd className="rounded border border-white/[0.08] bg-black/30 px-1.5 py-0.5 text-[8px] text-neutral-600">⌘K</kbd></button>
          <button onClick={onOpenQuickLaunch} className="flex h-8 items-center gap-1.5 rounded-md border border-cyan-300/20 bg-cyan-400 px-2.5 font-mono text-[9px] font-semibold tracking-wide text-[#041014] shadow-[0_0_22px_rgba(34,211,238,0.1)] transition hover:bg-cyan-300 sm:h-9 sm:px-3.5 sm:text-[10px]" aria-label="Launch execution"><Play className="h-3 w-3 fill-current sm:h-3.5 sm:w-3.5" /><span className="hidden sm:inline">LAUNCH</span></button>
        </div>
      </div>
    </header>
  );
};
