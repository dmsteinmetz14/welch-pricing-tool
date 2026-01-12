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
    return <p className="text-sm text-sage">No suppliers added yet. Start with the form above.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-card border border-stone bg-white shadow-card">
      <table className="min-w-full divide-y divide-stone text-sm text-charcoal">
        <thead className="bg-warm-white text-left text-xs font-semibold uppercase tracking-wide text-moss">
          <tr>
            <th className="px-4 py-3">Supplier</th>
            <th className="px-4 py-3">Location</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone bg-white text-sage">
          {sortedSuppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td className="px-4 py-3 font-medium text-evergreen">{supplier.name || 'Unnamed'}</td>
              <td className="px-4 py-3 font-medium text-evergreen">{supplier.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
