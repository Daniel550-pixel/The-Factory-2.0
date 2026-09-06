import React from 'react';
import {
  Boxes,
  CheckCircle2,
  ExternalLink,
  Layers,
  Shield,
  Activity,
  Cpu,
  Brain,
} from 'lucide-react';
import type { ProductIntegration } from '../types';

interface ProductsViewProps {
  products: ProductIntegration[];
}

export const ProductsView: React.FC<ProductsViewProps> = ({ products }) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="text-lg font-bold font-mono text-neutral-100 uppercase tracking-wide flex items-center gap-2">
          <Boxes className="h-5 w-5 text-emerald-400" />
          <span>Product Integrations & Domain Adapters</span>
        </h1>
        <p className="text-xs text-neutral-400 font-mono mt-0.5">
          Standardized vertical product adapters consuming shared Factory runtime primitives (Ledger, Policy Gate, Agent Reasoning, Epistemic Memory).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-100">{prod.name}</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {prod.status}
                </span>
              </div>

              <div className="text-[11px] text-cyan-400 font-semibold">{prod.domain}</div>

              <p className="text-neutral-400 text-[11px] font-sans">
                {prod.description}
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-900 space-y-2">
              <span className="text-[10px] text-neutral-500 uppercase block">
                Consumed Factory Primitives:
              </span>
              <div className="flex flex-wrap gap-1">
                {prod.consumedPrimitives.map((prim) => (
                  <span
                    key={prim}
                    className="px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300"
                  >
                    {prim}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
