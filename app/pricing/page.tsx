'use client';

import { useMemo, useState } from 'react';
import PriceTable from '@/components/PriceTable';
import RestrictedContent from '@/components/RestrictedContent';
import { usePricing } from '@/contexts/PricingContext';
import { formatDateInput, getEndOfCurrentWeek, getStartOfCurrentWeek } from '@/lib/date';
import { filterFlowersByDateRange } from '@/lib/flowers';
import { PricedFlowerItem } from '@/types/pricing';

function PricingPageContent() {
  const { pricedItems, markup, setMarkup, setItemMarkup, resetItemMarkup, applyMarkupToAll, itemMarkups } = usePricing();
  const [weekStart, setWeekStart] = useState(() => formatDateInput(getStartOfCurrentWeek()));
  const [weekEnd, setWeekEnd] = useState(() => formatDateInput(getEndOfCurrentWeek()));

  const filteredItems = useMemo<PricedFlowerItem[]>(() => {
    if (!weekStart || !weekEnd) {
      return pricedItems;
    }
    return filterFlowersByDateRange(pricedItems, weekStart, weekEnd);
  }, [pricedItems, weekEnd, weekStart]);

  const filteredTotals = useMemo(() => {
    const wholesale = filteredItems.reduce((acc, item) => acc + item.baseWholesaleCost * item.quantity, 0);
    const wholesaleWithCharges = filteredItems.reduce(
      (acc, item) => acc + item.baseWholesaleCost * item.quantity + item.allocatedChargeTotal,
      0
    );
    const retail = filteredItems.reduce((acc, item) => acc + item.totalRetail, 0);
    return {
      wholesale,
      wholesaleWithCharges,
      retail
    };
  }, [filteredItems]);

  const handleResetDates = () => {
    setWeekStart(formatDateInput(getStartOfCurrentWeek()));
    setWeekEnd(formatDateInput(getEndOfCurrentWeek()));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Pricing</h1>
        <p className="text-base text-slate-600">Adjust markups to see how retail totals change before sharing with customers.</p>
      </div>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Select date</p>
            <h2 className="text-lg font-semibold text-slate-900">Filter pricing by week</h2>
            <p className="text-sm text-slate-600">Choose the week you want to review. Defaults to the current week.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <label className="flex flex-col gap-1">
              Week start
              <input
                type="date"
                value={weekStart}
                onChange={(event) => setWeekStart(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="flex flex-col gap-1">
              Week end
              <input
                type="date"
                value={weekEnd}
                onChange={(event) => setWeekEnd(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <button
              type="button"
              onClick={handleResetDates}
              className="self-end rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Reset to this week
            </button>
          </div>
        </div>
      </section>

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
        items={filteredItems}
        totals={filteredTotals}
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
