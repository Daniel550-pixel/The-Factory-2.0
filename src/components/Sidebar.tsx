import React from 'react';
import {
  LayoutDashboard,
  Users,
  GitCommit,
  Scale,
  GitPullRequest,
  ShieldCheck,
  Lock,
  CheckSquare,
  Database,
  Brain,
  Layers,
  RotateCcw,
  Wrench,
  Server,
  Clock,
  LineChart,
  FlaskConical,
  Gauge,
  Workflow,
  Boxes,
  Settings,
  ChevronRight,
} from 'lucide-react';
import type { SystemStatus } from '../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tabId: string) => void;
  status: SystemStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, status }) => {
  const sections = [
    {
      title: 'CORE',
      items: [
        { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
      ],
    },
    {
      title: 'RUNTIME',
      items: [
        { id: 'agents', label: 'Agents Registry', icon: Users, badge: status?.activeAgents },
        { id: 'executions', label: 'Executions', icon: GitCommit, badge: status?.activeExecutions },
        { id: 'arbitration', label: 'Arbitration', icon: Scale },
      ],
    },
    {
      title: 'TRUST & GOVERNANCE',
      items: [
        { id: 'evidence-provenance', label: 'Evidence & Provenance', icon: GitPullRequest },
        { id: 'policy-gate', label: 'Policy Gate', icon: ShieldCheck },
        { id: 'approvals', label: 'Approval Queue', icon: CheckSquare, badge: status?.pendingApprovals, badgeColor: 'bg-amber-500 text-neutral-950 font-bold' },
        { id: 'security', label: 'Security & Identities', icon: Lock },
      ],
    },
    {
      title: 'STATE & LEDGER',
      items: [
        { id: 'event-ledger', label: 'Event Ledger', icon: Database, badge: status?.totalEvents },
        { id: 'memory', label: 'Memory Explorer', icon: Brain, badge: status?.totalMemoryRecords },
        { id: 'context', label: 'Context Assembly', icon: Layers },
        { id: 'replay-recovery', label: 'Replay & Recovery', icon: RotateCcw },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'tools', label: 'Tool Registry', icon: Wrench },
        { id: 'providers', label: 'Provider Registry', icon: Server },
        { id: 'scheduler', label: 'Scheduler', icon: Clock },
        { id: 'observability', label: 'Observability & Traces', icon: LineChart },
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
    {
      title: 'PRODUCTS & DOMAINS',
      items: [
        { id: 'products', label: 'Product Integrations', icon: Boxes },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings & Health', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-neutral-800 bg-neutral-950/80 flex flex-col h-[calc(100vh-57px)] overflow-y-auto select-none">
      <div className="p-3 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-2.5 text-[10px] font-mono font-semibold tracking-wider text-neutral-400 uppercase">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-neutral-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          item.badgeColor || (isActive ? 'bg-cyan-500/20 text-cyan-200' : 'bg-neutral-800 text-neutral-400')
                        }`}
                      >
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

      <div className="mt-auto p-3 border-t border-neutral-800 bg-neutral-900/50">
        <div className="rounded border border-neutral-800 bg-neutral-950 p-2.5 text-[11px] font-mono text-neutral-400">
          <div className="flex items-center justify-between text-neutral-300 font-medium mb-1">
            <span>KERNEL DAEMON</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              ONLINE
            </span>
          </div>
          <div className="text-[10px] text-neutral-400 truncate">
            Source: Daniel550-pixel/The-Factory
          </div>
        </div>
      </div>
    </aside>
  );
};
