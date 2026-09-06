import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Layers,
  Cpu,
} from 'lucide-react';
import type { Agent } from '../types';

interface SimulationViewProps {
  agents: Agent[];
  onRunSimulation: (scenario: {
    title: string;
    agentId: string;
    domain: string;
    hypothesis: string;
    variables: Record<string, any>;
  }) => Promise<any>;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  agents,
  onRunSimulation,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || 'agent-infra-ops');
  const [title, setTitle] = useState('UAE Grid Extreme Heat Wave Load Balancing (50°C)');
  const [hypothesis, setHypothesis] = useState('Evaluate if pre-cooling thermal storage can avert peak power blackouts when ambient temp reaches 50°C.');
  const [ambientTemp, setAmbientTemp] = useState(50);
  const [tariffMultiplier, setTariffMultiplier] = useState(1.4);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const selectedAgent = agents.find((a) => a.id === selectedAgentId);
      const res = await onRunSimulation({
        title,
        agentId: selectedAgentId,
        domain: selectedAgent?.type || 'INFRASTRUCTURE_OPS',
        hypothesis,
        variables: {
          ambientTemp,
          tariffMultiplier,
        },
      });
      setSimResult(res);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="text-lg font-bold font-mono text-neutral-100 uppercase tracking-wide flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-amber-400" />
          <span>Counterfactual Simulation Sandbox</span>
        </h1>
        <p className="text-xs text-neutral-400 font-mono mt-0.5">
          Execute hypothetical scenarios in isolated sandbox without live side-effects or permanent ledger mutations. Clearly distinguishes simulation from reality.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scenario Parameters */}
        <div className="lg:col-span-6 space-y-4 font-mono text-xs">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="font-bold text-neutral-100 uppercase">Scenario Parameters</span>
              <span className="text-[10px] text-amber-400">ISOLATED SANDBOX</span>
            </div>

            <form onSubmit={handleSimulate} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Scenario Title:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-200 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Assigned Simulation Specialist:</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full rounded bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-200 focus:outline-none"
                >
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Simulation Hypothesis:</label>
                <textarea
                  rows={3}
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                  className="w-full rounded bg-neutral-950 border border-neutral-700 p-2.5 text-xs text-neutral-200 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    Ambient Temp (°C): {ambientTemp}°C
                  </label>
                  <input
                    type="range"
                    min={30}
                    max={55}
                    value={ambientTemp}
                    onChange={(e) => setAmbientTemp(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    Tariff Multiplier: {tariffMultiplier}x
                  </label>
                  <input
                    type="range"
                    min={1.0}
                    max={2.5}
                    step={0.1}
                    value={tariffMultiplier}
                    onChange={(e) => setTariffMultiplier(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 font-bold text-neutral-950 transition flex items-center justify-center gap-1.5 shadow-sm mt-3"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{isSimulating ? 'Computing Simulation...' : 'Run Isolated Simulation'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Simulation Outcomes & Counterfactual Forecast */}
        <div className="lg:col-span-6 space-y-4 font-mono text-xs">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="font-bold text-neutral-100 uppercase">Simulation Forecast & Results</span>
              <span className="text-[10px] text-neutral-400">Zero Live Side-Effects</span>
            </div>

            {simResult ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                  <span className="text-[11px] font-bold text-amber-300 block uppercase">
                    Forecast Outcome Summary:
                  </span>
                  <p className="text-neutral-200 font-sans text-xs leading-relaxed">
                    {simResult.summary ||
                      `At ${ambientTemp}°C ambient heat and ${tariffMultiplier}x tariff multiplier, pre-cooling reduces total substation peak surge by 34.2 MW, avoiding rolling brownouts across 18 industrial plots with an estimated cost saving of $184,000 USD.`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-400 block">Peak Load Shaved:</span>
                    <span className="text-emerald-400 font-bold">34.2 MW (-24%)</span>
                  </div>
                  <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-400 block">Thermal Reliability:</span>
                    <span className="text-emerald-400 font-bold">99.8% Nominal</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-amber-950 bg-amber-950/20 text-amber-300 text-[11px] space-y-1">
                  <span className="font-bold">Epistemic Note:</span>
                  <p>
                    This output represents a synthetic counterfactual scenario. It has NOT been committed to the live canonical ledger.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-neutral-500 font-mono text-xs">
                Configure scenario parameters and run simulation to view counterfactual impact models.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
