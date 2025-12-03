'use client';

import PriceTable from '@/components/PriceTable';
import { usePricing } from '@/contexts/PricingContext';

export default function PriceSheetPage() {
  const { pricedItems, totals, markup, setMarkup } = usePricing();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">Step 2</p>
        <h1 className="text-3xl font-semibold text-slate-900">Review your retail price sheet</h1>
        <p className="text-base text-slate-600">Adjust markups to see how retail totals change before sharing with customers.</p>
      </div>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Markup</h2>
            <p className="text-sm text-slate-500">Applies to every stem in the sheet.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="range"
              min={0}
              max={150}
              step={5}
              value={markup}
              onChange={(event) => setMarkup(Number(event.target.value))}
              className="h-2 w-48 rounded-full accent-slate-900"
            />
            <input
              type="number"
              className="w-20 rounded-md border border-slate-300 px-3 py-2 text-right text-sm"
              value={markup}
              min={0}
              max={200}
              step={1}
              onChange={(event) => setMarkup(Number(event.target.value))}
            />
            <span className="text-slate-600">%</span>
          </div>
        </div>
      </section>

      <PriceTable items={pricedItems} totals={totals} />
    </div>
  );
}
