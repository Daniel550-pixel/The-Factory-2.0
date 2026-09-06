import React, { useState, useEffect } from 'react';
import { Search, X, Play, ArrowRight, ShieldCheck, Database, Brain, Users, GitCommit } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
  onQuickRun: (input: string, domain: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onQuickRun,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent will toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    {
      id: 'cmd-nav-cc',
      title: 'Go to Command Center',
      category: 'Navigation',
      icon: Users,
      action: () => {
        onNavigate('command-center');
        onClose();
      },
    },
    {
      id: 'cmd-nav-ledger',
      title: 'Inspect Cryptographic Event Ledger',
      category: 'Navigation',
      icon: Database,
      action: () => {
        onNavigate('event-ledger');
        onClose();
      },
    },
    {
      id: 'cmd-nav-policy',
      title: 'Inspect Policy Gate & Invariant Rules',
      category: 'Trust',
      icon: ShieldCheck,
      action: () => {
        onNavigate('policy-gate');
        onClose();
      },
    },
    {
      id: 'cmd-nav-exec',
      title: 'Inspect Live Execution Graph',
      category: 'Runtime',
      icon: GitCommit,
      action: () => {
        onNavigate('executions');
        onClose();
      },
    },
    {
      id: 'cmd-nav-memory',
      title: 'Inspect Memory & Provenance Records',
      category: 'State',
      icon: Brain,
      action: () => {
        onNavigate('memory');
        onClose();
      },
    },
    {
      id: 'cmd-run-grid',
      title: 'Run: Optimize UAE Grid Thermal Telemetry',
      category: 'Execute Task',
      icon: Play,
      action: () => {
        onQuickRun('Evaluate chiller telemetry at Dubai South DC-2 and optimize pre-cooling load', 'INFRASTRUCTURE_OPS');
        onClose();
      },
    },
    {
      id: 'cmd-run-escrow',
      title: 'Run: Propose EPC Phase 3 Escrow Release ($240k)',
      category: 'Execute Task',
      icon: Play,
      action: () => {
        onQuickRun('Disburse milestone payment of $240,000 USD to Abu Dhabi Clean Energy contractor for Phase 3', 'FINANCIAL_RISK');
        onClose();
      },
    },
    {
      id: 'cmd-run-security',
      title: 'Run: Audit SHA-256 Ledger Block Integrity',
      category: 'Execute Task',
      icon: Play,
      action: () => {
        onQuickRun('Perform exhaustive cryptographic verification of all event hashes on canonical ledger', 'SECURITY_OFFICER');
        onClose();
      },
    },
  ];

  const filtered = quickActions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-neutral-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center px-4 py-3 border-b border-neutral-800 gap-3">
          <Search className="h-4 w-4 text-cyan-400" />
          <input
            type="text"
            placeholder="Type a command, task, or navigate to a view..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none font-mono"
          />
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-200 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs font-mono text-neutral-500">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-neutral-800/80 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-neutral-950 border border-neutral-800 text-cyan-400 group-hover:border-cyan-500/40">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-neutral-200 group-hover:text-cyan-300">
                        {item.title}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500">
                        {item.category}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-cyan-400" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <span>AI DECIDES ≠ AI EXECUTES</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
