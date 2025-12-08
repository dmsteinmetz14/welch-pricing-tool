import { baserowFetch } from './baserow';
import { Supplier } from '@/types/suppliers';

interface BaserowListResponse<Row> {
  count: number;
  results: Row[];
}

interface SupplierRow {
  id: number;
  Supplier?: string;
  Location?: string;
}

const suppliersTableId = process.env.BASEROW_SUPPLIERS_TABLE_ID;

if (!suppliersTableId) {
  throw new Error('Missing BASEROW_SUPPLIERS_TABLE_ID environment variable');
}

const basePath = `/api/database/rows/table/${suppliersTableId}/?user_field_names=true`;

export async function listSuppliers(): Promise<Supplier[]> {
  const data = await baserowFetch<BaserowListResponse<SupplierRow>>(basePath);
  return data.results.map(mapRowToSupplier);
}

export async function createSupplier(payload: { name: string; location: string }): Promise<Supplier> {
  const row = await baserowFetch<SupplierRow>(`/api/database/rows/table/${suppliersTableId}/?user_field_names=true`, {
    method: 'POST',
    body: JSON.stringify({
      Supplier: payload.name,
      Location: payload.location
    })
  });
  return mapRowToSupplier(row);
}

function mapRowToSupplier(row: SupplierRow): Supplier {
  return {
    id: String(row.id),
    name: row.Supplier?.trim() ?? '',
    location: row.Location?.trim() ?? '',
    additionalCharges: []
  };
}
