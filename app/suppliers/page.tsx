import SupplierForm from '@/components/SupplierForm';
import SupplierList from '@/components/SupplierList';
import RestrictedContent from '@/components/RestrictedContent';
import { listSuppliers } from '@/lib/suppliers';
import { Supplier } from '@/types/suppliers';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  let initialSuppliers: Supplier[] = [];
  try {
    initialSuppliers = await listSuppliers();
  } catch (error) {
    console.error('Failed to prefetch suppliers', error);
  }

  return (
    <RestrictedContent featureLabel="Supplier Input">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold text-evergreen sm:text-5xl">Capture supplier logistics</h1>
          <p className="text-base text-sage">Track locations and any additional charges or fees tied to each supplier.</p>
        </div>
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-evergreen">Suppliers</h2>
          <SupplierList initialSuppliers={initialSuppliers} />
        </section>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-evergreen">Add a supplier</h2>
          <SupplierForm />
        </div>
      </div>
    </RestrictedContent>
  );
}
