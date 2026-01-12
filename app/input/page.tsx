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
import { formatDateInput, getEndOfCurrentWeek, getStartOfCurrentWeek } from '@/lib/date';
import { filterFlowersByDateRange } from '@/lib/flowers';

function InputPageContent() {
  const { suppliers, items } = usePricing();
  const [charges, setCharges] = useState<SupplierCharge[]>([]);
  const [isLoadingCharges, setIsLoadingCharges] = useState(true);
  const [chargesError, setChargesError] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [startDate, setStartDate] = useState(() => formatDateInput(getStartOfCurrentWeek()));
  const [endDate, setEndDate] = useState(() => formatDateInput(getEndOfCurrentWeek()));
  const currentWeekStart = formatDateInput(getStartOfCurrentWeek());
  const currentWeekEnd = formatDateInput(getEndOfCurrentWeek());
  const currentWeekFlowers = useMemo(
    () => filterFlowersByDateRange(items, currentWeekStart, currentWeekEnd),
    [items, currentWeekEnd, currentWeekStart]
  );
  const weeklyWholesaleTotal = useMemo(
    () => currentWeekFlowers.reduce((sum, item) => sum + item.wholesaleCost * item.quantity, 0),
    [currentWeekFlowers]
  );

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
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-sage">Capture wholesale details</p>
        <h1 className="text-4xl font-semibold text-evergreen sm:text-5xl">Plan weekly purchases by supplier</h1>
        <p className="text-base text-sage">
          Work from your invoices: pick a supplier, review freight charges for the chosen week, then log the flowers you expect to receive.
        </p>
      </div>
      {!suppliers.length && (
        <div className="rounded-card border border-dashed border-stone bg-white p-4 text-sm text-sage shadow-card">
          <p>You need at least one supplier before adding flowers.</p>
          <p className="mt-2">
            <Link href="/suppliers" className="font-semibold text-evergreen underline">
              Add suppliers first
            </Link>
          </p>
        </div>
      )}
      <div className="sticky top-0 z-10 -mx-4 border-b border-stone bg-warm-white/95 px-4 py-4 backdrop-blur sm:-mx-6 lg:-mx-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-moss">Step 1 · Select supplier & week</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="flex flex-col gap-2 text-sm text-moss lg:w-1/3">
            Supplier
            <select
              value={selectedSupplierId}
              onChange={(event) => setSelectedSupplierId(event.target.value)}
              disabled={!suppliers.length}
              className="rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60 disabled:cursor-not-allowed disabled:bg-olive-tint/30"
            >
              <option value="">Select a supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name && supplier.location ? `${supplier.name} — ${supplier.location}` : supplier.name || supplier.location || 'Unnamed supplier'}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-1 flex-wrap gap-4 text-sm text-moss">
            <label className="flex flex-col gap-2">
              Week start
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
              />
            </label>
            <label className="flex flex-col gap-2">
              Week end
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
              />
            </label>
            <button
              type="button"
              onClick={handleResetDates}
              className="self-end rounded-md border border-evergreen px-4 py-2 text-sm font-semibold text-evergreen transition hover:bg-sage/20"
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
              <p className="text-xs font-semibold uppercase tracking-wide text-moss">Step 2 · Supplier charges</p>
              <h2 className="text-2xl font-semibold text-evergreen">
                {selectedSupplier.name || selectedSupplier.location || 'Supplier'} charges for this week
              </h2>
              <p className="text-sm text-sage">
                Review handling, freight, and other fees logged for the selected supplier between {startDate || '—'} and {endDate || '—'}.
              </p>
            </div>
            {chargesError ? (
              <div className="rounded-card border border-soft-clay bg-soft-clay/30 p-4 text-sm text-evergreen shadow-card">
                <p>Unable to load supplier charges right now: {chargesError}</p>
                <button
                  type="button"
                  onClick={() => void loadCharges()}
                  className="mt-2 inline-flex items-center rounded-md border border-evergreen px-3 py-1 text-xs font-semibold text-evergreen transition hover:bg-sage/20"
                >
                  Retry
                </button>
              </div>
            ) : isLoadingCharges ? (
              <p className="rounded-card border border-stone bg-white p-4 text-sm text-sage shadow-card">Loading supplier charges…</p>
            ) : (
              <SupplierChargeTable charges={filteredCharges} showFilters={false} />
            )}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-evergreen">Add a supplier charge</h3>
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
              <h2 className="text-2xl font-semibold text-evergreen">
                Capture flowers for {selectedSupplier.name || selectedSupplier.location || 'this supplier'}
              </h2>
              <p className="text-sm text-sage">
                Log each line item from the invoice so downstream pricing stays accurate.
              </p>
            </div>
            <FlowerForm key={selectedSupplier.id} selectedSupplier={selectedSupplier} />
          </section>
        </>
      ) : (
        <div className="rounded-card border border-dashed border-stone bg-white p-6 text-sm text-sage shadow-card">
          Select a supplier above to review their weekly charges and capture flower line items.
        </div>
      )}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-evergreen">Current Flowers</h2>
        <FlowerList items={currentWeekFlowers} />
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
