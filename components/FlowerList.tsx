'use client';

import { useMemo } from 'react';
import { usePricing } from '@/contexts/PricingContext';
import { formatCurrency } from '@/lib/pricing';
import { FlowerItem } from '@/types/pricing';
import { filterFlowersToCurrentWeek } from '@/lib/flowers';
import { formatDateInput, getEndOfCurrentWeek, getStartOfCurrentWeek } from '@/lib/date';

interface FlowerListProps {
  items?: FlowerItem[];
}

export default function FlowerList({ items: providedItems }: FlowerListProps = {}) {
  const { items: contextItems, suppliers } = usePricing();
  const currentWeekStart = formatDateInput(getStartOfCurrentWeek());
  const currentWeekEnd = formatDateInput(getEndOfCurrentWeek());

  const flowersThisWeek = useMemo(() => {
    if (providedItems) {
      return providedItems;
    }
    return filterFlowersToCurrentWeek(contextItems, currentWeekStart, currentWeekEnd);
  }, [providedItems, contextItems, currentWeekEnd, currentWeekStart]);

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

  if (!flowersThisWeek.length) {
    return <p className="text-sm text-slate-500">No flowers added for this week yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {flowersThisWeek.map((item) => (
        <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-slate-900">{item.name}</p>
            <p className="text-slate-500">
              {item.flowerType ? `${item.flowerType} · ` : ''}
              {item.boxes ? `${item.boxes} boxes · ` : ''}
              {item.quantity} units · {supplierLookup.get(item.supplierId ?? '') ?? 'Unassigned supplier'}
            </p>
            {item.date && <p className="text-xs text-slate-400">Date: {item.date}</p>}
          </div>
          <p className="font-medium text-slate-900">{formatCurrency(item.wholesaleCost * item.quantity)}</p>
        </li>
      ))}
    </ul>
  );
}
