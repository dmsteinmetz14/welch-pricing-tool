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

function getSuppliersTablePath() {
  const tableId = process.env.BASEROW_SUPPLIERS_TABLE_ID;
  if (!tableId) {
    throw new Error('Missing BASEROW_SUPPLIERS_TABLE_ID environment variable');
  }
  return `/api/database/rows/table/${tableId}/?user_field_names=true`;
}

export async function listSuppliers(): Promise<Supplier[]> {
  const data = await baserowFetch<BaserowListResponse<SupplierRow>>(getSuppliersTablePath());
  return data.results.map(mapRowToSupplier);
}

export async function createSupplier(payload: { name: string; location: string }): Promise<Supplier> {
  const row = await baserowFetch<SupplierRow>(getSuppliersTablePath(), {
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
