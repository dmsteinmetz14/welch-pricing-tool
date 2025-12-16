import { FlowerItem, PricedFlowerItem } from '@/types/pricing';

export const DEFAULT_MARKUP_PERCENT = 40;

export function calculateStemCost(totalCost: number, quantity: number): number {
  if (quantity <= 0) {
    return 0;
  }
  return roundCurrency(totalCost / quantity);
}

export function calculateRetailPerStem(stemCost: number, markupPercent: number): number {
  const multiplier = 1 + markupPercent / 100;
  return roundCurrency(stemCost * multiplier);
}

export function calculateTotalRetail(quantity: number, retailPerStem: number): number {
  return roundCurrency(quantity * retailPerStem);
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

export function buildPricedItem(item: FlowerItem, markupPercent: number): PricedFlowerItem {
  const stemCost = calculateStemCost(item.wholesaleCost, item.quantity);
  const retailPerStem = calculateRetailPerStem(stemCost, markupPercent);
  const totalRetail = calculateTotalRetail(item.quantity, retailPerStem);
  return {
    ...item,
    stemCost,
    retailPerStem,
    totalRetail,
    appliedMarkup: markupPercent
  };
}
