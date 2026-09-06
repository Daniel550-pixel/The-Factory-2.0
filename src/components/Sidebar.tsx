import React from 'react';
import {
  Activity,
  Boxes,
  Brain,
  CheckSquare,
  Clock3,
  Database,
  FlaskConical,
  Gauge,
  GitCommit,
  GitPullRequest,
  Layers3,
  LayoutDashboard,
  LineChart,
  LockKeyhole,
  RotateCcw,
  Scale,
  Server,
  Settings,
  ShieldCheck,
  Users,
  Workflow,
  Wrench,
} from 'lucide-react';
import type { SystemStatus } from '../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tabId: string) => void;
  status: SystemStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, status }) => {
  const sections = [
    { title: 'CONTROL', items: [{ id: 'command-center', label: 'Command Center', icon: LayoutDashboard }] },
    {
      title: 'RUNTIME',
      items: [
        { id: 'agents', label: 'Agents', icon: Users, badge: status?.activeAgents },
        { id: 'executions', label: 'Executions', icon: GitCommit, badge: status?.activeExecutions },
        { id: 'arbitration', label: 'Arbitration', icon: Scale },
      ],
    },
    {
      title: 'TRUST',
      items: [
        { id: 'evidence-provenance', label: 'Evidence & Provenance', icon: GitPullRequest },
        { id: 'policy-gate', label: 'Policy Gate', icon: ShieldCheck },
        { id: 'approvals', label: 'Approval Queue', icon: CheckSquare, badge: status?.pendingApprovals, badgeTone: 'amber' },
        { id: 'security', label: 'Security & Identities', icon: LockKeyhole },
      ],
    },
    {
      title: 'STATE',
      items: [
        { id: 'event-ledger', label: 'Event Ledger', icon: Database, badge: status?.totalEvents },
        { id: 'memory', label: 'Memory Explorer', icon: Brain, badge: status?.totalMemoryRecords },
        { id: 'context', label: 'Context Assembly', icon: Layers3 },
        { id: 'replay-recovery', label: 'Replay & Recovery', icon: RotateCcw },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'tools', label: 'Tool Registry', icon: Wrench },
        { id: 'providers', label: 'Provider Registry', icon: Server },
        { id: 'scheduler', label: 'Scheduler', icon: Clock3 },
        { id: 'observability', label: 'Observability', icon: LineChart },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'simulation', label: 'Simulation Sandbox', icon: FlaskConical },
        { id: 'evaluation', label: 'Agent Evaluation', icon: Gauge },
        { id: 'reasoning', label: 'Reasoning Inspector', icon: Workflow },
      ],
    },
    { title: 'DOMAINS', items: [{ id: 'products', label: 'Product Integrations', icon: Boxes }] },
    { title: 'SYSTEM', items: [{ id: 'settings', label: 'Settings & Health', icon: Settings }] },
  ];

  return (
    <aside className="flex h-[calc(100vh-62px)] w-[248px] shrink-0 flex-col border-r border-white/[0.06] bg-[#080a0c]/95 select-none">
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-4 [scrollbar-width:thin]">
        {sections.map((section) => (
          <div key={section.title} className="mb-5 last:mb-0">
            <div className="mb-1.5 px-2.5 font-mono text-[8px] font-semibold tracking-[0.22em] text-neutral-600">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`group relative flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-all ${
                      active
                        ? 'border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-200 shadow-[inset_2px_0_0_rgba(103,232,249,0.8)]'
                        : 'border-transparent text-neutral-500 hover:border-white/[0.05] hover:bg-white/[0.025] hover:text-neutral-200'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Icon className={`h-[15px] w-[15px] shrink-0 ${active ? 'text-cyan-300' : 'text-neutral-600 group-hover:text-neutral-400'}`} />
                      <span className="truncate text-[11px] font-medium tracking-wide">{item.label}</span>
                    </span>
                    {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                      <span className={`ml-2 rounded-full px-1.5 py-0.5 font-mono text-[8px] leading-none ${item.badgeTone === 'amber' ? 'bg-amber-400/15 text-amber-300' : active ? 'bg-cyan-400/15 text-cyan-200' : 'bg-white/[0.06] text-neutral-600'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.06] p-2.5">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[8px] font-semibold tracking-[0.18em] text-neutral-500">KERNEL DAEMON</span>
            <span className="flex items-center gap-1.5 font-mono text-[8px] tracking-wider text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.8)]" />
              ONLINE
            </span>
          </div>
          <div className="flex items-center justify-between font-mono text-[8px] text-neutral-600">
            <span>GOVERNED RUNTIME</span>
            <Activity className="h-3 w-3 text-neutral-700" />
          </div>
        </div>
      </div>
    </aside>
  );
};