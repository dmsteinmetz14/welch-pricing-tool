import { baserowFetch } from './baserow';
import { FlowerInputPayload, FlowerItem } from '@/types/pricing';

interface BaserowListResponse<Row> {
  count: number;
  results: Row[];
}

interface LinkRowValue {
  id: number;
  value?: string;
}

interface FlowerRow {
  id: number;
  'Flower type'?: string;
  'Flower Name'?: string;
  Suppliers?: LinkRowValue[];
  Date?: string;
  Cost?: number | string;
  Quantity?: number | string;
}

const flowersTableId = process.env.BASEROW_FLOWERS_TABLE_ID;

if (!flowersTableId) {
  throw new Error('Missing BASEROW_FLOWERS_TABLE_ID environment variable');
}

const basePath = `/api/database/rows/table/${flowersTableId}/?user_field_names=true`;

export async function listFlowers(): Promise<FlowerItem[]> {
  const data = await baserowFetch<BaserowListResponse<FlowerRow>>(basePath);
  return data.results.map(mapRowToFlower);
}

export async function createFlowers(flowers: FlowerInputPayload[]): Promise<FlowerItem[]> {
  const created: FlowerItem[] = [];
  for (const flower of flowers) {
    const supplierId = Number(flower.supplierId);
    const row = await baserowFetch<FlowerRow>(basePath, {
      method: 'POST',
      body: JSON.stringify({
        'Flower type': flower.flowerType,
        'Flower Name': flower.name,
        Suppliers: Number.isFinite(supplierId) ? [supplierId] : [],
        Date: flower.date,
        Cost: flower.wholesaleCost,
        Quantity: flower.quantity
      })
    });
    created.push(mapRowToFlower(row));
  }
  return created;
}

function mapRowToFlower(row: FlowerRow): FlowerItem {
  const supplier = Array.isArray(row.Suppliers) ? row.Suppliers[0] : undefined;
  const rawCost = row.Cost;
  const cost = typeof rawCost === 'number' ? rawCost : Number(rawCost);
  const rawQuantity = row.Quantity;
  const quantity = typeof rawQuantity === 'number' ? rawQuantity : Number(rawQuantity);
  return {
    id: String(row.id),
    flowerType: row['Flower type']?.trim() ?? '',
    name: row['Flower Name']?.trim() ?? '',
    quantity: Number.isFinite(quantity) ? quantity : 0,
    wholesaleCost: Number.isFinite(cost) ? cost : 0,
    supplierId: supplier ? String(supplier.id) : undefined,
    date: row.Date ?? undefined
  };
}
