import React, { useState } from 'react';
import {
  CheckSquare,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import type { ApprovalRequest } from '../types';

interface ApprovalsViewProps {
  approvals: ApprovalRequest[];
  onResolveApproval: (id: string, action: 'APPROVE' | 'DENY' | 'REQUEST_MORE_EVIDENCE', notes: string) => Promise<void>;
  onNavigateToExecution: (id: string) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  approvals,
  onResolveApproval,
  onNavigateToExecution,
}) => {
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(
    approvals.find((a) => a.status === 'PENDING')?.id || approvals[0]?.id || null
  );
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const selected = approvals.find((a) => a.id === selectedApprovalId) || approvals[0] || null;

  const handleAction = async (action: 'APPROVE' | 'DENY' | 'REQUEST_MORE_EVIDENCE') => {
    if (!selected || isProcessing) return;
    setIsProcessing(true);
    try {
      await onResolveApproval(selected.id, action, reviewerNotes || `Operator sign-off via Control Plane`);
      setReviewerNotes('');
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingList = approvals.filter((a) => a.status === 'PENDING');
  const resolvedList = approvals.filter((a) => a.status !== 'PENDING');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="text-lg font-bold font-mono text-neutral-100 uppercase tracking-wide flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-amber-400" />
          <span>Human-in-the-Loop Escalation & Approval Queue</span>
        </h1>
        <p className="text-xs text-neutral-400 font-mono mt-0.5">
          Consequential actions flagged by the deterministic Policy Gate (high risk, financial disbursement, root access) require verified human dual-custody approval.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pending & Resolved Approvals List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center justify-between">
              <span>Pending Escalations ({pendingList.length})</span>
              <span className="text-[10px] text-neutral-400">Action Required</span>
            </span>

            {pendingList.length === 0 ? (
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/30 text-center text-xs font-mono text-neutral-500">
                No pending human approvals in queue. All systems nominal.
              </div>
            ) : (
              pendingList.map((appr) => {
                const isSelected = selected?.id === appr.id;
                return (
                  <div
                    key={appr.id}
                    onClick={() => setSelectedApprovalId(appr.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer font-mono text-xs space-y-2 ${
                      isSelected
                        ? 'border-amber-500/60 bg-neutral-900/90 ring-1 ring-amber-500/30'
                        : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">{appr.id}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {appr.status}
                      </span>
                    </div>

                    <p className="text-neutral-200 font-medium line-clamp-2">{appr.proposal.summary}</p>

                    <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-400">
                      <span>Agent: {appr.agentName}</span>
                      <span>Risk: <strong className="text-amber-400">{appr.riskScore}/100</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Resolved History */}
          {resolvedList.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono font-bold text-neutral-400 uppercase">
                Resolved History ({resolvedList.length})
              </span>
              {resolvedList.map((appr) => (
                <div
                  key={appr.id}
                  onClick={() => setSelectedApprovalId(appr.id)}
                  className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 text-xs font-mono space-y-1 cursor-pointer hover:border-neutral-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 font-bold">{appr.id}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded ${
                        appr.status === 'APPROVED'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-rose-400 bg-rose-500/10'
                      }`}
                    >
                      {appr.status}
                    </span>
                  </div>
                  <p className="text-neutral-400 truncate">{appr.proposal.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Selected Escalation Details & Action Controls */}
        <div className="lg:col-span-7 space-y-4">
          {selected ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div>
                  <span className="text-[10px] text-neutral-400 block">{selected.id}</span>
                  <h2 className="text-sm font-bold text-neutral-100">{selected.policyName}</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 block">Risk Calibrated Score</span>
                  <span className="text-sm font-bold text-amber-400">{selected.riskScore} / 100</span>
                </div>
              </div>

              {/* Proposal Summary */}
              <div className="space-y-2">
                <span className="text-[11px] text-neutral-400 uppercase font-bold">Action Proposal Under Review:</span>
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                  <p className="text-neutral-200 leading-relaxed font-sans">{selected.proposal.summary}</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-neutral-900">
                    <div>
                      <span className="text-neutral-400 block">Target Resource:</span>
                      <span className="text-neutral-200">{selected.proposal.targetResource}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Expected Impact:</span>
                      <span className="text-neutral-200">{selected.proposal.expectedImpact}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Escalation Reason */}
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-amber-300 text-[11px] space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                  Policy Trigger Reason:
                </span>
                <p>{selected.reason}</p>
              </div>

              {/* Execution Link */}
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                <span>Associated Execution:</span>
                <button
                  onClick={() => onNavigateToExecution(selected.executionId)}
                  className="text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>{selected.executionId}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Action Controls (if PENDING) */}
              {selected.status === 'PENDING' ? (
                <div className="pt-3 border-t border-neutral-800 space-y-3">
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">
                      Operator Review Notes / Audit Justification:
                    </label>
                    <textarea
                      rows={2}
                      value={reviewerNotes}
                      onChange={(e) => setReviewerNotes(e.target.value)}
                      placeholder="Add sign-off rationale for immutable event ledger..."
                      className="w-full rounded bg-neutral-950 border border-neutral-700 p-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 resize-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleAction('APPROVE')}
                      disabled={isProcessing}
                      className="py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-neutral-950 flex items-center justify-center gap-1.5 transition text-xs shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>APPROVE & EXECUTE</span>
                    </button>

                    <button
                      onClick={() => handleAction('DENY')}
                      disabled={isProcessing}
                      className="py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 font-bold text-neutral-950 flex items-center justify-center gap-1.5 transition text-xs shadow-sm"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>DENY / VETO</span>
                    </button>

                    <button
                      onClick={() => handleAction('REQUEST_MORE_EVIDENCE')}
                      disabled={isProcessing}
                      className="py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold flex items-center justify-center gap-1.5 transition text-xs border border-neutral-700"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
                      <span>REQUEST EVIDENCE</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400">
                  <span>Resolved by {selected.assignedTo || 'Operator'} on {new Date(selected.resolvedAt || selected.timestamp).toLocaleString()}</span>
                  {selected.reviewerNotes && (
                    <p className="mt-1 text-neutral-300 italic">"{selected.reviewerNotes}"</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-neutral-500 font-mono text-xs">
              Select an item from the queue to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
