'use client';

import { useMemo, useState } from 'react';
import { SupplierCharge } from '@/types/suppliers';
import { formatCurrency } from '@/lib/pricing';

interface SupplierChargeTableProps {
  charges: SupplierCharge[];
}

function formatDateInput(date: Date) {
  return date.toISOString().split('T')[0];
}

function getStartOfCurrentWeek() {
  const now = new Date();
  const day = now.getDay(); // 0 (Sunday) - 6 (Saturday)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Start Monday
  const start = new Date(now.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndOfCurrentWeek() {
  const start = getStartOfCurrentWeek();
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
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

export default function SupplierChargeTable({ charges }: SupplierChargeTableProps) {
  const defaultStart = useMemo(() => formatDateInput(getStartOfCurrentWeek()), []);
  const defaultEnd = useMemo(() => formatDateInput(getEndOfCurrentWeek()), []);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const filteredCharges = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;
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
      return true;
    });
  }, [charges, startDate, endDate]);

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
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col text-sm text-slate-600">
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <label className="flex flex-col text-sm text-slate-600">
          End date
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <button
          type="button"
          onClick={resetToThisWeek}
          className="inline-flex h-10 items-center rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Reset to this week
        </button>
        <p className="text-sm text-slate-500">
          Showing {filteredCharges.length} of {charges.length} charges
        </p>
      </div>
      {filteredCharges.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">No charges match the selected date range.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Charge Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
              {filteredCharges.map((charge) => (
                <tr key={charge.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{charge.chargeType || '—'}</td>
                  <td className="px-4 py-3">{charge.description || '—'}</td>
                  <td className="px-4 py-3">{charge.supplierName || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(charge.amount ?? 0)}</td>
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
