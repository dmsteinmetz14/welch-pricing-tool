import { StandingOrderLineInput, StandingOrderPayload } from '@/types/standingOrders';

export function normalizeStandingOrderPayload(input: Partial<StandingOrderPayload>):
  | { payload: StandingOrderPayload }
  | { error: string } {
  if (!input.name || typeof input.name !== 'string' || !input.name.trim()) {
    return { error: 'Standing order name is required' };
  }
  if (!input.supplierId || typeof input.supplierId !== 'string' || !input.supplierId.trim()) {
    return { error: 'Supplier is required' };
  }
  if (!Array.isArray(input.lines) || !input.lines.length) {
    return { error: 'At least one flower is required' };
  }

  const sanitizedLines: StandingOrderLineInput[] = [];
  for (const [index, line] of input.lines.entries()) {
    if (!line || typeof line !== 'object') {
      return { error: `Flower at index ${index + 1} is invalid` };
    }
    if (!line.flowerType || typeof line.flowerType !== 'string' || !line.flowerType.trim()) {
      return { error: `Flower type is required for entry ${index + 1}` };
    }
    if (!line.name || typeof line.name !== 'string' || !line.name.trim()) {
      return { error: `Flower name is required for entry ${index + 1}` };
    }
    const boxes = Number(line.boxes);
    if (!Number.isInteger(boxes) || boxes <= 0) {
      return { error: `Boxes must be a positive whole number for entry ${index + 1}` };
    }
    const quantity = Number(line.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { error: `Units must be a positive number for entry ${index + 1}` };
    }
    const wholesaleCost = Number(line.wholesaleCost);
    if (!Number.isFinite(wholesaleCost) || wholesaleCost < 0) {
      return { error: `Cost must be a non-negative number for entry ${index + 1}` };
    }
    sanitizedLines.push({
      flowerType: line.flowerType.trim(),
      name: line.name.trim(),
      boxes,
      quantity,
      wholesaleCost
    });
  }

  return {
    payload: {
      name: input.name.trim(),
      supplierId: input.supplierId.trim(),
      lines: sanitizedLines
    }
  };
}
