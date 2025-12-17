'use client';

import SupplierForm from '@/components/SupplierForm';
import SupplierList from '@/components/SupplierList';
import RestrictedContent from '@/components/RestrictedContent';

function SuppliersPageContent() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">Step 3</p>
        <h1 className="text-3xl font-semibold text-slate-900">Capture supplier logistics</h1>
        <p className="text-base text-slate-600">Track locations and any additional charges or fees tied to each supplier.</p>
      </div>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Suppliers</h2>
        <SupplierList />
      </section>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">Add a supplier</h2>
        <SupplierForm />
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <RestrictedContent featureLabel="Supplier Input">
      <SuppliersPageContent />
    </RestrictedContent>
  );
}
