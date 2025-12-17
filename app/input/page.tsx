'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import FlowerForm from '@/components/FlowerForm';
import FlowerList from '@/components/FlowerList';
import SupplierChargeTable from '@/components/SupplierChargeTable';
import SupplierChargeForm from '@/components/SupplierChargeForm';
import RestrictedContent from '@/components/RestrictedContent';
import { usePricing } from '@/contexts/PricingContext';
import { formatCurrency } from '@/lib/pricing';
import { SupplierCharge } from '@/types/suppliers';

function InputPageContent() {
  const { totals, suppliers } = usePricing();
  const [charges, setCharges] = useState<SupplierCharge[]>([]);
  const [isLoadingCharges, setIsLoadingCharges] = useState(true);
  const [chargesError, setChargesError] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [startDate, setStartDate] = useState(() => formatDateInput(getStartOfCurrentWeek()));
  const [endDate, setEndDate] = useState(() => formatDateInput(getEndOfCurrentWeek()));

  const loadCharges = useCallback(async () => {
    setIsLoadingCharges(true);
    setChargesError(null);
    try {
      const response = await fetch('/api/supplier-charges', { cache: 'no-store' });
      const payload = (await response.json()) as { charges?: SupplierCharge[]; error?: string };
      if (!response.ok || !Array.isArray(payload.charges)) {
        throw new Error(payload.error || 'Unable to load supplier charges');
      }
      setCharges(payload.charges);
    } catch (error) {
      console.error('Failed to load supplier charges', error);
      setCharges([]);
      setChargesError(error instanceof Error ? error.message : 'Unable to load supplier charges right now');
    } finally {
      setIsLoadingCharges(false);
    }
  }, []);

  useEffect(() => {
    void loadCharges();
  }, [loadCharges]);

  useEffect(() => {
    if (selectedSupplierId && !suppliers.find((supplier) => supplier.id === selectedSupplierId)) {
      setSelectedSupplierId('');
    }
  }, [selectedSupplierId, suppliers]);

  const handleChargeSaved = useCallback(() => {
    void loadCharges();
  }, [loadCharges]);

  const selectedSupplier = useMemo(() => suppliers.find((supplier) => supplier.id === selectedSupplierId), [selectedSupplierId, suppliers]);

  const filteredCharges = useMemo(() => {
    if (!selectedSupplierId) {
      return [];
    }
    const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : null;
    return charges.filter((charge) => {
      const chargeDate = parseChargeDate(charge.date);
      if (!chargeDate) {
        return false;
      }
      if (start && chargeDate < start) {
        return false;
      }
      if (end && chargeDate > end) {
        return false;
      }
      if (charge.supplierId !== selectedSupplierId) {
        return false;
      }
      return true;
    });
  }, [charges, endDate, selectedSupplierId, startDate]);

  const handleResetDates = () => {
    setStartDate(formatDateInput(getStartOfCurrentWeek()));
    setEndDate(formatDateInput(getEndOfCurrentWeek()));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">Capture wholesale details</p>
        <h1 className="text-3xl font-semibold text-slate-900">Plan weekly purchases by supplier</h1>
        <p className="text-base text-slate-600">
          Work from your invoices: pick a supplier, review freight charges for the chosen week, then log the flowers you expect to receive.
        </p>
      </div>
      {!suppliers.length && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
          <p>You need at least one supplier before adding flowers.</p>
          <p className="mt-2">
            <Link href="/suppliers" className="font-semibold text-slate-900 underline">
              Add suppliers first
            </Link>
          </p>
        </div>
      )}
      <div className="sticky top-0 z-10 -mx-4 border-b border-slate-200 bg-slate-50/95 px-4 py-4 backdrop-blur sm:-mx-6 lg:-mx-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 1 · Select supplier & week</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="flex flex-col gap-1 text-sm text-slate-700 lg:w-1/3">
            Supplier
            <select
              value={selectedSupplierId}
              onChange={(event) => setSelectedSupplierId(event.target.value)}
              disabled={!suppliers.length}
              className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">Select a supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name && supplier.location ? `${supplier.name} — ${supplier.location}` : supplier.name || supplier.location || 'Unnamed supplier'}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-1 flex-wrap gap-4 text-sm text-slate-700">
            <label className="flex flex-col gap-1">
              Week start
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="flex flex-col gap-1">
              Week end
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
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
      </div>
      {selectedSupplier ? (
        <>
          <section id="supplier-charges" className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 2 · Supplier charges</p>
              <h2 className="text-xl font-semibold text-slate-900">
                {selectedSupplier.name || selectedSupplier.location || 'Supplier'} charges for this week
              </h2>
              <p className="text-sm text-slate-600">
                Review handling, freight, and other fees logged for the selected supplier between {startDate || '—'} and {endDate || '—'}.
              </p>
            </div>
            {chargesError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>Unable to load supplier charges right now: {chargesError}</p>
                <button
                  type="button"
                  onClick={() => void loadCharges()}
                  className="mt-2 inline-flex items-center rounded-md border border-red-300 px-3 py-1 text-xs font-semibold"
                >
                  Retry
                </button>
              </div>
            ) : isLoadingCharges ? (
              <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading supplier charges…</p>
            ) : (
              <SupplierChargeTable charges={filteredCharges} showFilters={false} />
            )}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">Add a supplier charge</h3>
              <SupplierChargeForm
                key={selectedSupplier.id}
                suppliers={suppliers}
                lockedSupplier={selectedSupplier}
                onSaved={handleChargeSaved}
              />
            </div>
          </section>
          <section className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 3 · Flower input</p>
              <h2 className="text-xl font-semibold text-slate-900">Capture flowers for {selectedSupplier.name || selectedSupplier.location || 'this supplier'}</h2>
              <p className="text-sm text-slate-600">
                Log each line item from the invoice so downstream pricing stays accurate.
              </p>
            </div>
            <FlowerForm key={selectedSupplier.id} selectedSupplier={selectedSupplier} />
          </section>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          Select a supplier above to review their weekly charges and capture flower line items.
        </div>
      )}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Current Flowers</h2>
          <p className="text-sm text-slate-500">
            Wholesale total: <span className="font-semibold text-slate-900">{formatCurrency(totals.wholesale)}</span>
          </p>
        </div>
        <FlowerList />
      </section>
    </div>
  );
}

export default function InputPage() {
  return (
    <RestrictedContent featureLabel="Flower Input">
      <InputPageContent />
    </RestrictedContent>
  );
}

function formatDateInput(date: Date) {
  return date.toISOString().split('T')[0];
}

function getStartOfCurrentWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
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

function parseChargeDate(value?: string) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}
