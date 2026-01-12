'use client';

import { useMemo, useState } from 'react';
import { SupplierCharge } from '@/types/suppliers';
import { formatCurrency } from '@/lib/pricing';
import { formatDateInput, getEndOfCurrentWeek, getStartOfCurrentWeek } from '@/lib/date';

const NO_SUPPLIER_VALUE = '__UNASSIGNED__';

interface SupplierChargeTableProps {
  charges: SupplierCharge[];
  showFilters?: boolean;
}

function parseDate(value?: string) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export default function SupplierChargeTable({ charges, showFilters = true }: SupplierChargeTableProps) {
  const defaultStart = useMemo(() => formatDateInput(getStartOfCurrentWeek()), []);
  const defaultEnd = useMemo(() => formatDateInput(getEndOfCurrentWeek()), []);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [supplierFilter, setSupplierFilter] = useState('');

  const supplierOptions = useMemo(() => {
    const unique = new Map<string, string>();
    charges.forEach((charge) => {
      const value = charge.supplierId ?? NO_SUPPLIER_VALUE;
      const label = charge.supplierName?.trim() || 'Unassigned';
      if (!unique.has(value)) {
        unique.set(value, label);
      }
    });
    return Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
  }, [charges]);

  const filteredCharges = useMemo(() => {
    if (!showFilters) {
      return charges;
    }
    const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : null;
    const filterValue = supplierFilter || null;
    return charges.filter((charge) => {
      const chargeDate = parseDate(charge.date);
      if (!chargeDate) {
        return false;
      }
      if (start && chargeDate < start) {
        return false;
      }
      if (end && chargeDate > end) {
        return false;
      }
      if (filterValue) {
        const value = charge.supplierId ?? NO_SUPPLIER_VALUE;
        if (value !== filterValue) {
          return false;
        }
      }
      return true;
    });
  }, [charges, endDate, showFilters, startDate, supplierFilter]);

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), []);
  const formatChargeDate = (value?: string) => {
    const date = parseDate(value);
    if (!date) {
      return '—';
    }
    return dateFormatter.format(date);
  };

  const resetToThisWeek = () => {
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
  };

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col text-sm text-sage">
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-1 rounded-md border border-stone bg-white px-3 py-2 text-sm text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
            />
          </label>
          <label className="flex flex-col text-sm text-sage">
            End date
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-1 rounded-md border border-stone bg-white px-3 py-2 text-sm text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
            />
          </label>
          <button
            type="button"
            onClick={resetToThisWeek}
            className="inline-flex h-10 items-center rounded-md border border-evergreen px-4 text-sm font-semibold text-evergreen transition hover:bg-sage/20"
          >
            Reset to this week
          </button>
          <p className="text-sm text-sage">
            Showing {filteredCharges.length} of {charges.length} charges
          </p>
          <label className="flex flex-col text-sm text-sage">
            Supplier
            <select
              value={supplierFilter}
              onChange={(event) => setSupplierFilter(event.target.value)}
              className="mt-1 rounded-md border border-stone bg-white px-3 py-2 text-sm text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
            >
              <option value="">All suppliers</option>
              {supplierOptions.map((supplier) => (
                <option key={supplier.value} value={supplier.value}>
                  {supplier.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {filteredCharges.length === 0 ? (
        <p className="rounded-card border border-dashed border-stone bg-white p-6 text-sm text-sage">No charges match the selected date range.</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-stone bg-white shadow-card">
          <table className="min-w-full divide-y divide-stone text-sm text-sage">
            <thead className="bg-warm-white text-left text-xs font-semibold uppercase tracking-wide text-moss">
              <tr>
                <th className="px-4 py-3">Charge Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone bg-white text-sage">
              {filteredCharges.map((charge) => (
                <tr key={charge.id}>
                  <td className="px-4 py-3 font-medium text-evergreen">{charge.chargeType || '—'}</td>
                  <td className="px-4 py-3">{charge.description || '—'}</td>
                  <td className="px-4 py-3">{charge.supplierName || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-right font-medium text-evergreen">{formatCurrency(charge.amount ?? 0)}</td>
                  <td className="px-4 py-3">
                    {charge.unitOfCharge || 'Per Box'}
                    {(charge.unitOfCharge || 'Per Box') === 'Per Box' && (
                      <span className="text-sage">{` — ${
                        charge.boxCount ? `${charge.boxCount} box${charge.boxCount === 1 ? '' : 'es'}` : 'All boxes'
                      }`}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatChargeDate(charge.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
