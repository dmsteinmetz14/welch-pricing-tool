import { listSupplierCharges } from '@/lib/supplierCharges';
import SupplierChargeTable from '@/components/SupplierChargeTable';
import SupplierChargeForm from '@/components/SupplierChargeForm';
import { listSuppliers } from '@/lib/suppliers';

export default async function SupplierChargesPage() {
  const [charges, suppliers] = await Promise.all([listSupplierCharges(), listSuppliers()]);

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900">Supplier charges</h1>
        <p className="text-base text-slate-600">Track freight, handling, and other fees you associate with each supplier.</p>
      </header>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Charges</h2>
          <p className="text-sm text-slate-500">Listing all rows from Baserow table 765389.</p>
        </div>
        <SupplierChargeTable charges={charges} />
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Add a supplier charge</h2>
          <p className="text-sm text-slate-500">New entries sync straight to Baserow table 765389.</p>
        </div>
        <SupplierChargeForm suppliers={suppliers} />
      </section>
    </section>
  );
}
