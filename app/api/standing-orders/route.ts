import { NextResponse } from 'next/server';
import { createStandingOrder, listStandingOrders } from '@/lib/standingOrders';
import { normalizeStandingOrderPayload } from './validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    const standingOrders = await listStandingOrders();
    const filtered = supplierId ? standingOrders.filter((order) => order.supplierId === supplierId) : standingOrders;
    return NextResponse.json({ standingOrders: filtered });
  } catch (error) {
    console.error('Failed to fetch standing orders from Baserow', error);
    return NextResponse.json({ error: 'Unable to load standing orders' }, { status: 500 });
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

  const validation = normalizeStandingOrderPayload(body as Record<string, unknown>);
  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const standingOrder = await createStandingOrder(validation.payload);
    return NextResponse.json({ standingOrder }, { status: 201 });
  } catch (error) {
    console.error('Failed to create standing order in Baserow', error);
    return NextResponse.json({ error: 'Unable to create standing order' }, { status: 500 });
  }
}
