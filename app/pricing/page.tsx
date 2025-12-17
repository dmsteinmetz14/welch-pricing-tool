'use client';

import PriceTable from '@/components/PriceTable';
import RestrictedContent from '@/components/RestrictedContent';
import { usePricing } from '@/contexts/PricingContext';

function PricingPageContent() {
  const { pricedItems, totals, markup, setMarkup, setItemMarkup, resetItemMarkup, applyMarkupToAll, itemMarkups } = usePricing();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">Step 3</p>
        <h1 className="text-3xl font-semibold text-slate-900">Pricing</h1>
        <p className="text-base text-slate-600">Adjust markups to see how retail totals change before sharing with customers.</p>
      </div>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Overall markup</h2>
            <p className="text-sm text-slate-500">Enter a percentage and optionally cascade it to every flower.</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm">
            <label className="flex items-center gap-2">
              <span className="text-slate-600">Markup %</span>
              <input
                type="number"
                className="w-28 rounded-md border border-slate-300 px-3 py-2 text-right text-sm"
                value={markup}
                min={0}
                step={1}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (Number.isFinite(next) && next >= 0) {
                    setMarkup(next);
                  } else if (!event.target.value.trim()) {
                    setMarkup(0);
                  }
                }}
              />
            </label>
            <button
              type="button"
              onClick={applyMarkupToAll}
              disabled={!pricedItems.length}
              className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Apply
            </button>
          </div>
        </div>
      </section>

      <PriceTable
        items={pricedItems}
        totals={totals}
        overallMarkup={markup}
        itemMarkups={itemMarkups}
        onMarkupChange={(id, value) => setItemMarkup(id, value)}
        onResetMarkup={resetItemMarkup}
      />
    </div>
  );
}

export default function PricingPage() {
  return (
    <RestrictedContent featureLabel="Pricing">
      <PricingPageContent />
    </RestrictedContent>
  );
}
