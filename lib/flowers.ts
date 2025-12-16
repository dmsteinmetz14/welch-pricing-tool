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
  'Flower Type'?: string;
  'Flower Name'?: string;
  Units?: number | string;
  Suppliers?: LinkRowValue[];
  Date?: string;
  Cost?: number | string;
  Boxes?: number | string | null;
}

function getFlowersTablePath() {
  const tableId = process.env.BASEROW_FLOWERS_TABLE_ID;
  if (!tableId) {
    throw new Error('Missing BASEROW_FLOWERS_TABLE_ID environment variable');
  }
  return `/api/database/rows/table/${tableId}/?user_field_names=true`;
}

export async function listFlowers(): Promise<FlowerItem[]> {
  const data = await baserowFetch<BaserowListResponse<FlowerRow>>(getFlowersTablePath());
  return data.results.map(mapRowToFlower);
}

export async function createFlowers(flowers: FlowerInputPayload[]): Promise<FlowerItem[]> {
  const created: FlowerItem[] = [];
  for (const flower of flowers) {
    const supplierId = Number(flower.supplierId);
    const payload: Record<string, unknown> = {
      'Flower Type': flower.flowerType,
      'Flower Name': flower.name,
      Suppliers: Number.isFinite(supplierId) ? [supplierId] : [],
      Date: flower.date,
      Cost: flower.wholesaleCost,
      Units: flower.quantity,
      Boxes: Number.isFinite(flower.boxes) ? flower.boxes : null
    };
    const row = await baserowFetch<FlowerRow>(getFlowersTablePath(), {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    created.push(mapRowToFlower(row));
  }
  return created;
}

function mapRowToFlower(row: FlowerRow): FlowerItem {
  const supplier = Array.isArray(row.Suppliers) ? row.Suppliers[0] : undefined;
  const rawCost = row.Cost;
  const cost = typeof rawCost === 'number' ? rawCost : Number(rawCost);
  const flowerTypeValue = row['Flower Type'];
  const rawQuantity = row.Units;
  const quantity = typeof rawQuantity === 'number' ? rawQuantity : Number(rawQuantity);
  const rawBoxes = row.Boxes;
  const parsedBoxes = typeof rawBoxes === 'number' ? rawBoxes : Number(rawBoxes);
  return {
    id: String(row.id),
    flowerType: flowerTypeValue?.trim() ?? '',
    name: row['Flower Name']?.trim() ?? '',
    quantity: Number.isFinite(quantity) ? quantity : 0,
    wholesaleCost: Number.isFinite(cost) ? cost : 0,
    supplierId: supplier ? String(supplier.id) : undefined,
    date: row.Date ?? undefined,
    boxes: Number.isFinite(parsedBoxes) ? parsedBoxes : null
  };
}
