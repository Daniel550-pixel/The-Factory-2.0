import React from 'react';
import {
  Shield,
  Activity,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  Terminal,
  Search,
  Lock,
  RefreshCw,
} from 'lucide-react';
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

export const Header: React.FC<HeaderProps> = ({
  status,
  activeMode,
  onModeChange,
  onOpenQuickLaunch,
  onOpenCommandPalette,
  onRefresh,
  isRefreshing,
}) => {
  const getModeColor = (mode: RuntimeMode) => {
    switch (mode) {
      case 'LIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'SIMULATION':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'REPLAY':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'RECOVERY':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/95 backdrop-blur px-4 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand Identity & Kernel Invariant */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-700 text-cyan-400 shadow-sm">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-wider text-neutral-100 uppercase">THE FACTORY</span>
                <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-400 border border-neutral-800">
                  KERNEL v2.4
                </span>
              </div>
              <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                CONTROL PLANE & RUNTIME
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-neutral-800">
            <div className="rounded-md border border-cyan-950 bg-cyan-950/30 px-2.5 py-1 text-xs font-mono text-cyan-300 flex items-center gap-2">
              <Lock className="h-3 w-3 text-cyan-400" />
              <span>INVARIANT: <strong className="font-semibold text-cyan-200">AI DECIDES ≠ AI EXECUTES</strong></span>
            </div>
          </div>
        </div>

        {/* Center: System Status Metrics */}
        <div className="hidden xl:flex items-center gap-3 text-xs font-mono">
          {/* Ledger Integrity */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
            {status?.ledgerIntegrity === 'VERIFIED' ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>LEDGER: <span className="text-emerald-400 font-semibold">VERIFIED SHA-256</span></span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400 animate-bounce" />
                <span>LEDGER: <span className="text-rose-400 font-semibold">TAMPER ALERT</span></span>
              </>
            )}
          </div>

          {/* Active Agents */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span>AGENTS: <span className="text-neutral-100 font-semibold">{status?.activeAgents ?? 6} ACTIVE</span></span>
          </div>

          {/* Pending Approvals */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
            <Shield className="h-3.5 w-3.5 text-amber-400" />
            <span>ESCALATED: <span className={`${(status?.pendingApprovals ?? 0) > 0 ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}>{status?.pendingApprovals ?? 0} PENDING</span></span>
          </div>

          {/* Policy Decision Counts */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
            <Layers className="h-3.5 w-3.5 text-neutral-400" />
            <span>POLICY:</span>
            <span className="text-emerald-400 font-semibold">{status?.policyStats.allow ?? 0}A</span>
            <span className="text-rose-400 font-semibold">{status?.policyStats.deny ?? 0}D</span>
            <span className="text-amber-400 font-semibold">{status?.policyStats.escalate ?? 0}E</span>
          </div>
        </div>

        {/* Right: Runtime Mode, Actions, and Launcher */}
        <div className="flex items-center gap-2.5">
          {/* Mode Selector */}
          <div className="flex items-center rounded-lg bg-neutral-900 p-0.5 border border-neutral-800">
            {(['LIVE', 'SIMULATION', 'REPLAY', 'RECOVERY'] as RuntimeMode[]).map((mode) => {
              const isActive = activeMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                    isActive
                      ? `${getModeColor(mode)} font-bold shadow-sm border`
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title={`Switch to ${mode} mode`}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
            title="Refresh System State"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Command Palette Button */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center gap-2 rounded-md bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="font-mono text-[11px]">Search & Cmds</span>
            <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-[10px] font-mono text-neutral-400 border border-neutral-700">
              ⌘K
            </kbd>
          </button>

          {/* Quick Execution Launcher */}
          <button
            onClick={onOpenQuickLaunch}
            className="flex items-center gap-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-neutral-950 transition shadow-sm"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Launch Task</span>
          </button>
        </div>
      </div>
    </header>
  );
};
