'use client';

import { useMemo, useState } from 'react';
import { usePricing } from '@/contexts/PricingContext';
import { formatCurrency } from '@/lib/pricing';
import { filterFlowersToCurrentWeek } from '@/lib/flowers';
import type { PricedFlowerItem } from '@/types/pricing';

export default function PriceSheetPage() {
  const { pricedItems } = usePricing();
  const [query, setQuery] = useState('');

  const currentWeekItems = useMemo(() => filterFlowersToCurrentWeek(pricedItems), [pricedItems]);

  const grouped = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const rows = currentWeekItems.map(buildRow).filter((row) => {
      if (!normalizedQuery) {
        return true;
      }
      return (
        row.name.toLowerCase().includes(normalizedQuery) ||
        (row.type?.toLowerCase().includes(normalizedQuery) ?? false)
      );
    });
    const map = new Map<string, typeof rows>();
    rows.forEach((row) => {
      const key = row.type || 'Uncategorized';
      const bucket = map.get(key) ?? [];
      bucket.push(row);
      map.set(key, bucket);
    });
    const sortedKeys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
    return sortedKeys.map((key) => ({
      type: key,
      rows: map.get(key)!.sort((a, b) => a.name.localeCompare(b.name))
    }));
  }, [currentWeekItems, query]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold text-evergreen sm:text-5xl">Price Sheet</h1>
          <p className="text-base text-sage">A clean, read-only sheet you can share or export for wholesale partners.</p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center rounded-md border border-evergreen px-4 py-2 text-sm font-semibold text-evergreen transition hover:bg-sage/20"
        >
          Print / Export
        </button>
      </div>

      <section className="rounded-card border border-stone bg-white p-6 shadow-card">
        <label className="flex w-full flex-col gap-2 text-sm text-moss">
          Search by flower or type
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Rose or Greens"
            className="rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
          />
        </label>
      </section>

      {grouped.length === 0 ? (
        <p className="rounded-card border border-dashed border-stone bg-white p-6 text-sm text-sage">No flowers to display yet.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.type} className="rounded-card border border-stone bg-white shadow-card">
              <header className="border-b border-stone px-4 py-3">
                <h2 className="text-2xl font-semibold text-evergreen">{group.type}</h2>
              </header>
              <table className="min-w-full divide-y divide-stone text-sm text-sage">
                <thead className="bg-warm-white text-left text-xs font-semibold uppercase tracking-wide text-moss">
                  <tr>
                    <th className="px-4 py-3">Flower Type</th>
                    <th className="px-4 py-3">Flower</th>
                    <th className="px-4 py-3 text-right">Units This Week</th>
                    <th className="px-4 py-3 text-right">Retail / Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone bg-white text-sage">
                  {group.rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 text-xs uppercase tracking-wide text-sage/80">{row.type || '—'}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-evergreen">{row.name}</p>
                      </td>
                      <td className="px-4 py-3 text-right">{row.quantity}</td>
                      <td className="px-4 py-3 text-right font-semibold text-evergreen">{formatCurrency(row.retailPerUnit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function buildRow(item: PricedFlowerItem) {
  const chargePerUnit = item.quantity > 0 ? (item.allocatedChargeTotal ?? 0) / item.quantity : 0;
  const wholesaleWithChargePerUnit = item.baseWholesaleCost + chargePerUnit;
  const markup = item.appliedMarkup;
  const retailPerUnit = wholesaleWithChargePerUnit * (1 + markup / 100);
  return {
    id: item.id,
    name: item.name,
    type: item.flowerType,
    quantity: item.quantity,
    wholesaleWithChargePerUnit,
    markup,
    retailPerUnit
  };
}
