'use client';

import { usePricing } from '@/contexts/PricingContext';
import { formatCurrency } from '@/lib/pricing';

export default function SupplierList() {
  const { suppliers } = usePricing();
  if (!suppliers.length) {
    return <p className="text-sm text-slate-500">No suppliers added yet. Start with the form above.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Additional Charges</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
          {suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{supplier.location}</td>
              <td className="px-4 py-3">
                {supplier.additionalCharges?.length ? (
                  <ul className="space-y-1 text-slate-700">
                    {supplier.additionalCharges.map((charge, index) => (
                      <li key={`${supplier.id}-${index}`}>
                        <span className="font-medium">{charge.reason}</span>
                        <span className="text-slate-500"> — {formatCurrency(charge.amount)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-slate-500">None</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
