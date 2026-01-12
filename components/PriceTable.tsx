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
    return <p className="text-sm text-sage">No flowers priced yet. Add them on the input tab.</p>;
  }

  const sortedItems = [...items].sort((a, b) => {
    const typeA = (a.flowerType || '').toLowerCase();
    const typeB = (b.flowerType || '').toLowerCase();
    if (typeA < typeB) return -1;
    if (typeA > typeB) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="overflow-x-auto rounded-card border border-stone bg-white shadow-card">
      <table className="min-w-full divide-y divide-stone text-sm text-sage">
        <thead className="bg-warm-white text-left text-xs font-semibold uppercase tracking-wide text-moss">
          <tr>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Flower</th>
            <th className="px-4 py-3">Markup %</th>
            <th className="px-4 py-3">Wholesale / Unit</th>
            <th className="px-4 py-3">Wholesale / Unit + Charge</th>
            <th className="px-4 py-3">Retail / Unit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone bg-white text-sage">
          {sortedItems.map((item) => {
            const override = itemMarkups[item.id];
            const markupValue = override ?? item.appliedMarkup ?? overallMarkup;
            const chargePerUnit = item.quantity > 0 ? (item.allocatedChargeTotal ?? 0) / item.quantity : 0;
            const wholesaleWithChargePerUnit = item.baseWholesaleCost + chargePerUnit;
            const retailPerUnit = wholesaleWithChargePerUnit * (1 + markupValue / 100);
            return (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-sage/80">{item.flowerType || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-evergreen">{item.name}</p>
                  <p className="text-sage">
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
                    className="w-24 rounded-md border border-stone bg-white px-2 py-1 text-right text-sm text-charcoal focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
                  />
                </td>
                <td className="px-4 py-3">{formatCurrency(item.baseWholesaleCost)}</td>
                <td className="px-4 py-3">{formatCurrency(wholesaleWithChargePerUnit)}</td>
                <td className="px-4 py-3 font-medium text-evergreen">{formatCurrency(retailPerUnit)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
