import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function SupplierChargesPage() {
  redirect('/input#supplier-charges');
}
