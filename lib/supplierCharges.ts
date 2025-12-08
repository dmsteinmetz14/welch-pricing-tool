import { baserowFetch } from './baserow';
import { SupplierCharge } from '@/types/suppliers';

interface BaserowListResponse<Row> {
  count: number;
  results: Row[];
}

interface LinkRowValue {
  id: number;
  value?: string;
}

interface ChargeRow {
  id: number;
  'Charge Type'?: string;
  'Charge Description'?: string;
  Supplier?: LinkRowValue[];
  'Charge Amount'?: number | string;
  Date?: string;
}

const chargesTableId = process.env.BASEROW_CHARGES_TABLE_ID;

if (!chargesTableId) {
  throw new Error('Missing BASEROW_CHARGES_TABLE_ID environment variable');
}

const basePath = `/api/database/rows/table/${chargesTableId}/?user_field_names=true`;

export async function listSupplierCharges(): Promise<SupplierCharge[]> {
  const data = await baserowFetch<BaserowListResponse<ChargeRow>>(basePath);
  return data.results.map(mapRowToCharge);
}

interface CreateChargeInput {
  chargeType: string;
  description: string;
  amount: number;
  supplierId?: string;
  date: string;
}

export async function createSupplierCharge(payload: CreateChargeInput): Promise<SupplierCharge> {
  const supplier = payload.supplierId ? Number(payload.supplierId) : undefined;
  const row = await baserowFetch<ChargeRow>(basePath, {
    method: 'POST',
    body: JSON.stringify({
      'Charge Type': payload.chargeType,
      'Charge Description': payload.description,
      'Charge Amount': payload.amount,
      Supplier: supplier ? [supplier] : [],
      Date: payload.date
    })
  });
  return mapRowToCharge(row);
}

function mapRowToCharge(row: ChargeRow): SupplierCharge {
  const supplier = Array.isArray(row.Supplier) ? row.Supplier[0] : undefined;
  const rawAmount = row['Charge Amount'];
  const parsedAmount = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount);
  const amount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
  return {
    id: String(row.id),
    chargeType: row['Charge Type']?.trim() ?? '',
    description: row['Charge Description']?.trim() ?? '',
    amount,
    date: row.Date ?? undefined,
    supplierId: supplier ? String(supplier.id) : undefined,
    supplierName: supplier?.value?.trim()
  };
}
