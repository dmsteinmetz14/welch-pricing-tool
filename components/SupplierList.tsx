'use client';

import { useMemo } from 'react';
import { usePricing } from '@/contexts/PricingContext';
import { Supplier } from '@/types/suppliers';

interface SupplierListProps {
  initialSuppliers?: Supplier[];
}

export default function SupplierList({ initialSuppliers = [] }: SupplierListProps) {
  const { suppliers } = usePricing();
  const displayedSuppliers = suppliers.length ? suppliers : initialSuppliers;

  const sortedSuppliers = useMemo(() => {
    return [...displayedSuppliers].sort((a, b) => {
      const nameA = a.name?.toLowerCase() ?? '';
      const nameB = b.name?.toLowerCase() ?? '';
      if (nameA === nameB) {
        return (a.location ?? '').localeCompare(b.location ?? '');
      }
      return nameA.localeCompare(nameB);
    });
  }, [displayedSuppliers]);

  if (!sortedSuppliers.length) {
    return <p className="text-sm text-slate-500">No suppliers added yet. Start with the form above.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Supplier</th>
            <th className="px-4 py-3">Location</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
          {sortedSuppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{supplier.name || 'Unnamed'}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{supplier.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
