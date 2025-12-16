import { NextResponse } from 'next/server';
import { createFlowers, listFlowers } from '@/lib/flowers';
import { FlowerInputPayload } from '@/types/pricing';

export async function GET() {
  try {
    const flowers = await listFlowers();
    return NextResponse.json({ flowers });
  } catch (error) {
    console.error('Failed to fetch flowers from Baserow', error);
    return NextResponse.json({ error: 'Unable to load flowers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
  }

  const { flowers } = body as { flowers?: FlowerInputPayload[] };
  if (!Array.isArray(flowers) || flowers.length === 0) {
    return NextResponse.json({ error: 'At least one flower is required' }, { status: 400 });
  }

  for (const [index, flower] of flowers.entries()) {
    if (typeof flower !== 'object') {
      return NextResponse.json({ error: `Flower at index ${index} is invalid` }, { status: 400 });
    }
    if (!flower.flowerType?.trim()) {
      return NextResponse.json({ error: `Flower type is required for entry ${index + 1}` }, { status: 400 });
    }
    if (!flower.name?.trim()) {
      return NextResponse.json({ error: `Flower name is required for entry ${index + 1}` }, { status: 400 });
    }
    if (!flower.supplierId?.trim()) {
      return NextResponse.json({ error: `Supplier is required for entry ${index + 1}` }, { status: 400 });
    }
    if (!flower.date?.trim()) {
      return NextResponse.json({ error: `Date is required for entry ${index + 1}` }, { status: 400 });
    }
    const boxes = typeof flower.boxes === 'number' ? flower.boxes : Number(flower.boxes);
    if (!Number.isInteger(boxes) || boxes <= 0) {
      return NextResponse.json({ error: `Boxes must be a positive whole number for entry ${index + 1}` }, { status: 400 });
    }
    if (!Number.isFinite(flower.quantity) || flower.quantity <= 0) {
      return NextResponse.json({ error: `Units must be a positive number for entry ${index + 1}` }, { status: 400 });
    }
    if (!Number.isFinite(flower.wholesaleCost) || flower.wholesaleCost < 0) {
      return NextResponse.json({ error: `Cost must be a non-negative number for entry ${index + 1}` }, { status: 400 });
    }
  }

  try {
    const created = await createFlowers(
      flowers.map((flower) => ({
        ...flower,
        flowerType: flower.flowerType.trim(),
        name: flower.name.trim(),
        supplierId: flower.supplierId.trim(),
        date: flower.date.trim(),
        boxes: typeof flower.boxes === 'number' ? flower.boxes : Number(flower.boxes)
      }))
    );
    return NextResponse.json({ flowers: created }, { status: 201 });
  } catch (error) {
    console.error('Failed to create flowers in Baserow', error);
    return NextResponse.json({ error: 'Unable to create flowers' }, { status: 500 });
  }
}
