import React from 'react';
import { Boxes, CheckCircle2 } from 'lucide-react';
import type { ProductIntegration } from '../types';

interface ProductsViewProps { products: ProductIntegration[]; }

export const ProductsView: React.FC<ProductsViewProps> = ({ products }) => <div className="factory-enter factory-grid factory-vignette min-h-full space-y-6 pb-12">
  <div className="factory-panel factory-scan border-x-0 border-t-0 px-1 pb-5 pt-1">
    <h1 className="flex items-center gap-2 font-mono text-lg font-bold uppercase tracking-wide text-neutral-100"><Boxes className="h-5 w-5 text-emerald-400" /> Product Integrations & Domain Adapters</h1>
    <p className="mt-1 max-w-4xl font-mono text-xs text-neutral-400">Domain adapters consume governed Factory primitives without bypassing the runtime control plane.</p>
  </div>
  <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase text-neutral-500"><span>Registered Adapters</span><span>{products.length} ACTIVE SURFACES</span></div>
  <div className="grid grid-cols-1 gap-4 font-mono text-xs md:grid-cols-2 lg:grid-cols-3">
    {products.map(prod => <div key={prod.id} className="factory-panel-raised flex flex-col justify-between rounded-xl p-4 transition hover:border-neutral-700">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3"><div><span className="font-bold text-neutral-100">{prod.name}</span><div className="mt-1 text-[10px] font-semibold text-cyan-400">{prod.domain}</div></div><span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] text-emerald-400"><CheckCircle2 className="h-3 w-3" /> {prod.status}</span></div>
        <p className="font-sans text-[11px] leading-relaxed text-neutral-400">{prod.description}</p>
      </div>
      <div className="mt-4 space-y-2 border-t border-neutral-800 pt-3"><span className="block text-[10px] uppercase text-neutral-500">Consumed Factory Primitives</span><div className="flex flex-wrap gap-1">{prod.consumedPrimitives.map(prim => <span key={prim} className="rounded border border-neutral-800 bg-neutral-950 px-1.5 py-0.5 text-[10px] text-neutral-300">{prim}</span>)}</div></div>
    </div>)}
  </div>
</div>;
