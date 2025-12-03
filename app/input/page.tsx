'use client';

import Link from 'next/link';
import FlowerForm from '@/components/FlowerForm';
import FlowerList from '@/components/FlowerList';
import { usePricing } from '@/contexts/PricingContext';
import { formatCurrency } from '@/lib/pricing';

export default function InputPage() {
  const { totals, suppliers } = usePricing();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">Step 1</p>
        <h1 className="text-3xl font-semibold text-slate-900">Capture wholesale details</h1>
        <p className="text-base text-slate-600">
          Choose a supplier, then add every flower you plan to purchase. Use the wholesale totals from invoices to keep downstream pricing accurate.
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
      <FlowerForm />
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
