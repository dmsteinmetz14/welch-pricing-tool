'use client';

import { useMemo, useState } from 'react';
import { usePricing } from '@/contexts/PricingContext';
import { formatCurrency } from '@/lib/pricing';
import type { PricedFlowerItem } from '@/types/pricing';

export default function PriceSheetPage() {
  const { pricedItems } = usePricing();
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const rows = pricedItems.map(buildRow).filter((row) => {
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
  }, [pricedItems, query]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-slate-500">Step 4</p>
          <h1 className="text-3xl font-semibold text-slate-900">Price Sheet</h1>
          <p className="text-base text-slate-600">A clean, read-only sheet you can share or export for wholesale partners.</p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
        >
          Print / Export
        </button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <label className="flex w-full flex-col gap-2 text-sm text-slate-600">
          Search by flower or type
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Rose or Greens"
            className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </section>

      {grouped.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">No flowers to display yet.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.type} className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-lg font-semibold text-slate-900">{group.type}</h2>
              </header>
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Flower Type</th>
                    <th className="px-4 py-3">Flower</th>
                    <th className="px-4 py-3 text-right">Units This Week</th>
                    <th className="px-4 py-3 text-right">Retail / Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                  {group.rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 text-xs uppercase tracking-wide text-slate-500">{row.type || '—'}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{row.name}</p>
                      </td>
                      <td className="px-4 py-3 text-right">{row.quantity}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(row.retailPerUnit)}</td>
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
