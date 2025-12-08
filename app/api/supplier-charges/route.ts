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

  const { chargeType, description, amount, supplierId, date } = body as {
    chargeType?: unknown;
    description?: unknown;
    amount?: unknown;
    supplierId?: unknown;
    date?: unknown;
  };

  if (typeof chargeType !== 'string' || !chargeType.trim()) {
    return NextResponse.json({ error: 'Charge type is required' }, { status: 400 });
  }
  if (typeof description !== 'string') {
    return NextResponse.json({ error: 'Charge description is required' }, { status: 400 });
  }
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

  try {
    const charge = await createSupplierCharge({
      chargeType: chargeType.trim(),
      description: description.trim(),
      amount: parsedAmount,
      supplierId: supplierId.trim(),
      date: date.trim()
    });
    return NextResponse.json({ charge }, { status: 201 });
  } catch (error) {
    console.error('Failed to create supplier charge in Baserow', error);
    return NextResponse.json({ error: 'Unable to create supplier charge' }, { status: 500 });
  }
}
