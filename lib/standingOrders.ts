import { baserowFetch } from './baserow';
import { StandingOrder, StandingOrderLine, StandingOrderLineInput, StandingOrderPayload } from '@/types/standingOrders';

interface BaserowListResponse<Row> {
  count: number;
  results: Row[];
}

interface LinkRowValue {
  id: number;
  value?: string;
}

interface StandingOrderRow {
  id: number;
  Name?: string;
  Supplier?: LinkRowValue[];
  'Standing Order Lines'?: LinkRowValue[];
  'Last modified'?: string;
  'Created on'?: string;
}

interface StandingOrderLineRow {
  id: number;
  'Standing Order'?: LinkRowValue[];
  'Flower Type'?: string;
  'Flower Name'?: string;
  Units?: number | string;
  Boxes?: number | string | null;
  Cost?: number | string | null;
}

function getStandingOrdersTableId() {
  const tableId = process.env.BASEROW_STANDING_ORDERS_TABLE_ID;
  if (!tableId) {
    throw new Error('Missing BASEROW_STANDING_ORDERS_TABLE_ID environment variable');
  }
  return tableId;
}

function getStandingOrderLinesTableId() {
  const tableId = process.env.BASEROW_STANDING_ORDER_LINES_TABLE_ID;
  if (!tableId) {
    throw new Error('Missing BASEROW_STANDING_ORDER_LINES_TABLE_ID environment variable');
  }
  return tableId;
}

function getStandingOrdersCollectionPath() {
  return `/api/database/rows/table/${getStandingOrdersTableId()}/?user_field_names=true`;
}

function getStandingOrderRowPath(rowId: number | string) {
  return `/api/database/rows/table/${getStandingOrdersTableId()}/${rowId}/?user_field_names=true`;
}

function getStandingOrderLinesCollectionPath() {
  return `/api/database/rows/table/${getStandingOrderLinesTableId()}/?user_field_names=true`;
}

function getStandingOrderLineRowPath(rowId: number | string) {
  return `/api/database/rows/table/${getStandingOrderLinesTableId()}/${rowId}/?user_field_names=true`;
}

export async function listStandingOrders(): Promise<StandingOrder[]> {
  const [ordersData, linesData] = await Promise.all([
    baserowFetch<BaserowListResponse<StandingOrderRow>>(getStandingOrdersCollectionPath()),
    baserowFetch<BaserowListResponse<StandingOrderLineRow>>(getStandingOrderLinesCollectionPath())
  ]);

  const linesByOrder = new Map<string, StandingOrderLine[]>();
  linesData.results.forEach((row) => {
    const mapped = mapLineRow(row);
    if (!mapped) {
      return;
    }
    const key = mapped.standingOrderId;
    const existing = linesByOrder.get(key) ?? [];
    existing.push(mapped);
    linesByOrder.set(key, existing);
  });

  return ordersData.results.map((row) => mapStandingOrderRow(row, linesByOrder));
}

export async function createStandingOrder(payload: StandingOrderPayload): Promise<StandingOrder> {
  const supplierNumeric = Number(payload.supplierId);
  if (!Number.isFinite(supplierNumeric)) {
    throw new Error('Invalid supplier id for standing order');
  }

  const orderRow = await baserowFetch<StandingOrderRow>(getStandingOrdersCollectionPath(), {
    method: 'POST',
    body: JSON.stringify({
      Name: payload.name,
      Supplier: [supplierNumeric]
    })
  });

  const createdLines = await Promise.all(payload.lines.map((line) => createStandingOrderLine(orderRow.id, line)));
  const mapped = mapStandingOrderRow(orderRow, new Map([[String(orderRow.id), createdLines]]));
  return { ...mapped, name: payload.name.trim() };
}

export async function updateStandingOrder(orderId: string, payload: StandingOrderPayload): Promise<StandingOrder> {
  const numericId = Number(orderId);
  if (!Number.isFinite(numericId)) {
    throw new Error('Invalid standing order id');
  }

  const supplierNumeric = Number(payload.supplierId);
  if (!Number.isFinite(supplierNumeric)) {
    throw new Error('Invalid supplier id for standing order');
  }

  const orderRow = await baserowFetch<StandingOrderRow>(getStandingOrderRowPath(numericId), {
    method: 'PATCH',
    body: JSON.stringify({
      Name: payload.name,
      Supplier: [supplierNumeric]
    })
  });

  const existingLines = await listStandingOrderLines();
  const linesForOrder = existingLines.filter((line) => line.standingOrderId === String(orderRow.id));
  if (linesForOrder.length) {
    await Promise.all(linesForOrder.map((line) => deleteStandingOrderLine(line.id)));
  }

  const createdLines = await Promise.all(payload.lines.map((line) => createStandingOrderLine(orderRow.id, line)));
  const mapped = mapStandingOrderRow(orderRow, new Map([[String(orderRow.id), createdLines]]));
  return { ...mapped, name: payload.name.trim() };
}

export async function deleteStandingOrder(orderId: string): Promise<void> {
  const numericId = Number(orderId);
  if (!Number.isFinite(numericId)) {
    throw new Error('Invalid standing order id');
  }
  const existingLines = await listStandingOrderLines();
  const linesForOrder = existingLines.filter((line) => line.standingOrderId === String(numericId));
  if (linesForOrder.length) {
    await Promise.all(linesForOrder.map((line) => deleteStandingOrderLine(line.id)));
  }
  await baserowFetch<void>(getStandingOrderRowPath(numericId), { method: 'DELETE' });
}

export async function listStandingOrderLines(): Promise<StandingOrderLine[]> {
  const data = await baserowFetch<BaserowListResponse<StandingOrderLineRow>>(getStandingOrderLinesCollectionPath());
  return data.results
    .map((row) => mapLineRow(row))
    .filter((line): line is StandingOrderLine => Boolean(line));
}

async function createStandingOrderLine(standingOrderRowId: number, payload: StandingOrderLineInput): Promise<StandingOrderLine> {
  const row = await baserowFetch<StandingOrderLineRow>(getStandingOrderLinesCollectionPath(), {
    method: 'POST',
    body: JSON.stringify({
      'Standing Order': [standingOrderRowId],
      'Flower Type': payload.flowerType,
      'Flower Name': payload.name,
      Units: payload.quantity,
      Boxes: payload.boxes,
      Cost: payload.wholesaleCost
    })
  });
  const mapped = mapLineRow(row);
  if (mapped) {
    return mapped;
  }
  return {
    id: String(row.id),
    standingOrderId: String(standingOrderRowId),
    flowerType: payload.flowerType,
    name: payload.name,
    quantity: payload.quantity,
    boxes: payload.boxes,
    wholesaleCost: payload.wholesaleCost
  };
}

async function deleteStandingOrderLine(lineId: string) {
  const numericId = Number(lineId);
  if (!Number.isFinite(numericId)) {
    return;
  }
  await baserowFetch<void>(getStandingOrderLineRowPath(numericId), { method: 'DELETE' });
}

function mapStandingOrderRow(row: StandingOrderRow, linesByOrder: Map<string, StandingOrderLine[]>) {
  const supplier = Array.isArray(row.Supplier) ? row.Supplier[0] : undefined;
  const id = String(row.id);
  return {
    id,
    name: row.Name?.trim() ?? '',
    supplierId: supplier ? String(supplier.id) : '',
    supplierName: supplier?.value?.trim(),
    lines: linesByOrder.get(id) ?? [],
    updatedAt: row['Last modified'] ?? undefined,
    createdAt: row['Created on'] ?? undefined
  } as StandingOrder;
}

function mapLineRow(row: StandingOrderLineRow): StandingOrderLine | null {
  const orderLink = Array.isArray(row['Standing Order']) ? row['Standing Order'][0] : undefined;
  if (!orderLink) {
    return null;
  }
  const quantity = normalizeNumber(row.Units);
  const boxes = normalizeNumber(row.Boxes);
  const cost = normalizeNumber(row.Cost);
  return {
    id: String(row.id),
    standingOrderId: String(orderLink.id),
    flowerType: row['Flower Type']?.trim() ?? '',
    name: row['Flower Name']?.trim() ?? '',
    quantity,
    boxes,
    wholesaleCost: cost
  };
}

function normalizeNumber(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
