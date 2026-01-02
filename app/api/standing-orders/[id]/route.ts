import { NextResponse } from 'next/server';
import { deleteStandingOrder, updateStandingOrder } from '@/lib/standingOrders';
import { normalizeStandingOrderPayload } from '../validation';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: RouteParams) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const validation = normalizeStandingOrderPayload(body as Record<string, unknown>);
  if ('error' in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  try {
    const standingOrder = await updateStandingOrder(params.id, validation.payload);
    return NextResponse.json({ standingOrder });
  } catch (error) {
    console.error(`Failed to update standing order ${params.id}`, error);
    return NextResponse.json({ error: 'Unable to update standing order' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await deleteStandingOrder(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`Failed to delete standing order ${params.id}`, error);
    return NextResponse.json({ error: 'Unable to delete standing order' }, { status: 500 });
  }
}
