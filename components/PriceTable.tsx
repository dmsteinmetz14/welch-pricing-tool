'use client';

import { PricedFlowerItem } from '@/types/pricing';
import { formatCurrency } from '@/lib/pricing';

interface PriceTableProps {
  items: PricedFlowerItem[];
  totals: {
    wholesale: number;
    retail: number;
  };
}

export default function PriceTable({ items, totals }: PriceTableProps) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">No flowers priced yet. Add them on the input tab.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Flower</th>
            <th className="px-4 py-3">Wholesale Cost</th>
            <th className="px-4 py-3">Stem Cost</th>
            <th className="px-4 py-3">Retail / Stem</th>
            <th className="px-4 py-3">Retail Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-slate-500">
                  {item.quantity} {item.unitOfMeasure === 'Per Stem' ? 'stems' : item.unitOfMeasure === 'Per Bunch' ? 'bunches' : 'units'}
                </p>
              </td>
              <td className="px-4 py-3">{formatCurrency(item.wholesaleCost)}</td>
              <td className="px-4 py-3">{formatCurrency(item.stemCost)}</td>
              <td className="px-4 py-3">{formatCurrency(item.retailPerStem)}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(item.totalRetail)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50 text-sm font-semibold text-slate-900">
          <tr>
            <td className="px-4 py-3" colSpan={2}>
              Totals
            </td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3">{formatCurrency(totals.wholesale)}</td>
            <td className="px-4 py-3">{formatCurrency(totals.retail)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
