'use client';

import { formatCurrency } from '@/lib/pricing';
import { PricedFlowerItem } from '@/types/pricing';

interface PriceTableProps {
  items: PricedFlowerItem[];
  totals: {
    wholesale: number;
    wholesaleWithCharges: number;
    retail: number;
  };
  overallMarkup: number;
  itemMarkups: Record<string, number | undefined>;
  onMarkupChange: (id: string, markup: number | null) => void;
  onResetMarkup: (id: string) => void;
}

export default function PriceTable({ items, totals, overallMarkup, itemMarkups, onMarkupChange, onResetMarkup }: PriceTableProps) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">No flowers priced yet. Add them on the input tab.</p>;
  }

  const sortedItems = [...items].sort((a, b) => {
    const typeA = (a.flowerType || '').toLowerCase();
    const typeB = (b.flowerType || '').toLowerCase();
    if (typeA < typeB) return -1;
    if (typeA > typeB) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Flower</th>
            <th className="px-4 py-3">Markup %</th>
            <th className="px-4 py-3">Wholesale / Unit</th>
            <th className="px-4 py-3">Wholesale / Unit + Charge</th>
            <th className="px-4 py-3">Retail / Unit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
          {sortedItems.map((item) => {
            const override = itemMarkups[item.id];
            const markupValue = override ?? item.appliedMarkup ?? overallMarkup;
            const chargePerUnit = item.quantity > 0 ? (item.allocatedChargeTotal ?? 0) / item.quantity : 0;
            const wholesaleWithChargePerUnit = item.baseWholesaleCost + chargePerUnit;
            const retailPerUnit = wholesaleWithChargePerUnit * (1 + markupValue / 100);
            return (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{item.flowerType || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-slate-500">
                    {item.boxes ? `${item.boxes} boxes · ` : ''}
                    {item.quantity} units
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={markupValue}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (nextValue.trim() === '') {
                        onMarkupChange(item.id, null);
                        return;
                      }
                      const parsed = Number(nextValue);
                      if (Number.isFinite(parsed)) {
                        onMarkupChange(item.id, parsed);
                      }
                    }}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-sm"
                  />
                </td>
                <td className="px-4 py-3">{formatCurrency(item.baseWholesaleCost)}</td>
                <td className="px-4 py-3">{formatCurrency(wholesaleWithChargePerUnit)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(retailPerUnit)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
