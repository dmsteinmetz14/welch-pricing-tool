'use client';

import { useMemo } from 'react';
import { usePricing } from '@/contexts/PricingContext';
import { formatCurrency } from '@/lib/pricing';

export default function FlowerList() {
  const { items, suppliers } = usePricing();

  const supplierLookup = useMemo(() => {
    const map = new Map<string, string>();
    suppliers.forEach((supplier) => {
      const label =
        supplier.name && supplier.location
          ? `${supplier.name} — ${supplier.location}`
          : supplier.name || supplier.location || 'Unassigned supplier';
      map.set(supplier.id, label);
    });
    return map;
  }, [suppliers]);

  if (!items.length) {
    return <p className="text-sm text-slate-500">No flowers added yet. Start with the form above.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-slate-900">{item.name}</p>
            <p className="text-slate-500">
              {item.flowerType ? `${item.flowerType} · ` : ''}
              {item.quantity} stems · {supplierLookup.get(item.supplierId ?? '') ?? 'Unassigned supplier'}
            </p>
            {item.date && <p className="text-xs text-slate-400">Date: {item.date}</p>}
          </div>
          <p className="font-medium text-slate-900">{formatCurrency(item.wholesaleCost)}</p>
        </li>
      ))}
    </ul>
  );
}
