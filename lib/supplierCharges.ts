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

interface SelectValue {
  id: number;
  value?: string;
  color?: string;
}

interface ChargeRow {
  id: number;
  'Charge Type'?: string | SelectValue | null;
  'Charge Description'?: string | null;
  Supplier?: LinkRowValue[];
  'Charge Amount'?: number | string;
  Date?: string;
}

function getChargesTablePath() {
  const tableId = process.env.BASEROW_CHARGES_TABLE_ID;
  if (!tableId) {
    throw new Error('Missing BASEROW_CHARGES_TABLE_ID environment variable');
  }
  return `/api/database/rows/table/${tableId}/?user_field_names=true`;
}

export async function listSupplierCharges(): Promise<SupplierCharge[]> {
  const data = await baserowFetch<BaserowListResponse<ChargeRow>>(getChargesTablePath());
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
  const row = await baserowFetch<ChargeRow>(getChargesTablePath(), {
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
    chargeType: normalizeBaserowString(row['Charge Type']),
    description: normalizeBaserowString(row['Charge Description']),
    amount,
    date: row.Date ?? undefined,
    supplierId: supplier ? String(supplier.id) : undefined,
    supplierName: supplier?.value?.trim()
  };
}

function normalizeBaserowString(value?: string | SelectValue | null): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value && typeof value === 'object') {
    return value.value?.trim() ?? '';
  }
  return '';
}
