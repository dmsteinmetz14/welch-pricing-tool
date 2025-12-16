import { NextResponse } from 'next/server';
import { createSupplierCharge, listSupplierCharges } from '@/lib/supplierCharges';

export async function GET() {
  try {
    const charges = await listSupplierCharges();
    return NextResponse.json({ charges });
  } catch (error) {
    console.error('Failed to fetch supplier charges from Baserow', error);
    return NextResponse.json({ error: 'Unable to load supplier charges' }, { status: 500 });
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

  const { chargeType, description, amount, supplierId, date, unitOfCharge, boxCount } = body as {
    chargeType?: unknown;
    description?: unknown;
    amount?: unknown;
    supplierId?: unknown;
    date?: unknown;
    unitOfCharge?: unknown;
    boxCount?: unknown;
  };

  if (typeof chargeType !== 'string' || !chargeType.trim()) {
    return NextResponse.json({ error: 'Charge type is required' }, { status: 400 });
  }
  const safeDescription = typeof description === 'string' ? description.trim() : '';
  const parsedAmount = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
    return NextResponse.json({ error: 'Charge amount must be a non-negative number' }, { status: 400 });
  }
  if (typeof supplierId !== 'string' || !supplierId.trim()) {
    return NextResponse.json({ error: 'Supplier is required' }, { status: 400 });
  }
  if (typeof date !== 'string' || !date.trim()) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }
  if (unitOfCharge !== 'Per Box' && unitOfCharge !== 'Per Shipment') {
    return NextResponse.json({ error: 'Unit of charge is invalid' }, { status: 400 });
  }
  let parsedBoxCount: number | null = null;
  if (unitOfCharge === 'Per Box') {
    if (boxCount === null || boxCount === undefined || boxCount === '') {
      parsedBoxCount = null;
    } else {
      const maybeNumber = typeof boxCount === 'number' ? boxCount : Number(boxCount);
      if (!Number.isInteger(maybeNumber) || maybeNumber <= 0) {
        return NextResponse.json({ error: 'Number of boxes must be a positive whole number' }, { status: 400 });
      }
      parsedBoxCount = maybeNumber;
    }
  }

  try {
    const charge = await createSupplierCharge({
      chargeType: chargeType.trim(),
      description: safeDescription,
      amount: parsedAmount,
      supplierId: supplierId.trim(),
      date: date.trim(),
      unitOfCharge,
      boxCount: parsedBoxCount
    });
    return NextResponse.json({ charge }, { status: 201 });
  } catch (error) {
    console.error('Failed to create supplier charge in Baserow', error);
    return NextResponse.json({ error: 'Unable to create supplier charge' }, { status: 500 });
  }
}
