import { NextResponse } from 'next/server';
import { createSupplier, listSuppliers } from '@/lib/suppliers';

export async function GET() {
  try {
    const suppliers = await listSuppliers();
    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error('Failed to fetch suppliers from Baserow', error);
    return NextResponse.json({ error: 'Unable to load suppliers' }, { status: 500 });
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

  const { name, location } = body as { name?: unknown; location?: unknown };
  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
  }
  if (typeof location !== 'string' || !location.trim()) {
    return NextResponse.json({ error: 'Location is required' }, { status: 400 });
  }

  try {
    const supplier = await createSupplier({ name: name.trim(), location: location.trim() });
    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error('Failed to create supplier in Baserow', error);
    return NextResponse.json({ error: 'Unable to create supplier' }, { status: 500 });
  }
}
