import React from 'react';
import {
  Lock,
  ShieldCheck,
  ShieldAlert,
  Key,
  Users,
  CheckCircle2,
  AlertTriangle,
  Database,
  FileCheck,
} from 'lucide-react';

interface SecurityViewProps {
  onSimulateTamper: () => Promise<void>;
  onRestoreLedger: () => Promise<void>;
}

export const SecurityView: React.FC<SecurityViewProps> = ({
  onSimulateTamper,
  onRestoreLedger,
}) => {
  const identities = [
    {
      id: 'actor-system-supervisor',
      name: 'Factory Supervisor Agent',
      type: 'AGENT',
      privilege: 'ORCHESTRATOR',
      authMethod: 'Cryptographic Token + Internal Kernel Secret',
      status: 'AUTHENTICATED',
    },
    {
      id: 'actor-human-operator',
      name: 'Operations Command Center Admin',
      type: 'HUMAN',
      privilege: 'DUAL_CUSTODY_SIGNER',
      authMethod: 'Hardware Token / WebAuthn MFA',
      status: 'AUTHENTICATED',
    },
    {
      id: 'actor-scada-service',
      name: 'Dubai South SCADA Telemetry Gateway',
      type: 'SERVICE',
      privilege: 'TELEMETRY_INGEST_READ_ONLY',
      authMethod: 'Mutual TLS (mTLS) + HMAC Signature',
      status: 'AUTHENTICATED',
    },
  ];

  const permissions = [
    { resource: 'LEDGER_COMMITS', allowed: 'Kernel Daemon Only (Signed SHA-256)' },
    { resource: 'POLICY_GATE_MODIFICATION', allowed: 'Human Dual-Custody Admin Only' },
    { resource: 'FINANCIAL_DISBURSEMENTS_OVER_50K', allowed: 'Escalated to Human Queue (Mandatory)' },
    { resource: 'INFRASTRUCTURE_CONTROL_WRITES', allowed: 'Verified Agent Proposal + Policy Gate' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="text-lg font-bold font-mono text-neutral-100 uppercase tracking-wide flex items-center gap-2">
          <Lock className="h-5 w-5 text-cyan-400" />
          <span>Zero-Trust Security & Identity Infrastructure</span>
        </h1>
        <p className="text-xs text-neutral-400 font-mono mt-0.5">
          Zero-trust architecture where every actor, agent, service, and proposal must be cryptographically authenticated and deterministically authorized.
        </p>
      </div>

      {/* Security Invariant Guarantee */}
      <div className="p-4 rounded-xl border border-cyan-800/60 bg-cyan-950/20 font-mono text-xs space-y-2">
        <div className="flex items-center gap-2 text-cyan-300 font-bold">
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
          <span>INVARIANT GUARANTEE: NO PROMPT INJECTION OR AGENT HALLUCINATION CAN BYPASS THE KERNEL</span>
        </div>
        <p className="text-neutral-300 font-sans leading-relaxed">
          The Factory architecture decouples AI reasoning from deterministic execution. Even if an adversarial prompt causes an AI model to attempt a malicious command, the deterministic Policy Gate intercepts the proposal and applies strict mathematical rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Identities */}
        <div className="lg:col-span-6 space-y-3 font-mono text-xs">
          <span className="font-bold text-neutral-200 uppercase">
            Zero-Trust Identity Registry ({identities.length})
          </span>

          <div className="space-y-2.5">
            {identities.map((id) => (
              <div
                key={id.id}
                className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-100">{id.name}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {id.status}
                  </span>
                </div>

                <div className="text-[11px] text-cyan-400">{id.privilege}</div>

                <div className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-900">
                  Auth Method: <span className="text-neutral-300">{id.authMethod}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Deterministic Permissions Matrix */}
        <div className="lg:col-span-6 space-y-3 font-mono text-xs">
          <span className="font-bold text-neutral-200 uppercase">
            Deterministic Capabilities Matrix
          </span>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-3">
            {permissions.map((p, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1"
              >
                <div className="flex items-center justify-between text-neutral-200 font-bold">
                  <span>{p.resource}</span>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="text-[11px] text-neutral-400 font-sans">
                  Enforcement: {p.allowed}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
