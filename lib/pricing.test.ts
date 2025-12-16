import { describe, expect, it } from 'vitest';
import { buildPricedItem, calculateRetailPerStem, calculateStemCost, calculateTotalRetail, roundCurrency } from './pricing';

describe('pricing helpers', () => {
  it('calculates stem cost safely', () => {
    expect(calculateStemCost(100, 50)).toBe(2);
    expect(calculateStemCost(100, 0)).toBe(0);
  });

  it('calculates retail per stem with markup', () => {
    expect(calculateRetailPerStem(2, 50)).toBe(3);
  });

  it('calculates total retail', () => {
    expect(calculateTotalRetail(10, 3.5)).toBe(35);
  });

  it('rounds currency to cents', () => {
    expect(roundCurrency(1.239)).toBe(1.24);
  });

  it('builds priced item', () => {
    const priced = buildPricedItem({ id: '1', name: 'Rose', quantity: 10, wholesaleCost: 50 }, 50);
    expect(priced.stemCost).toBe(5);
    expect(priced.retailPerStem).toBe(7.5);
    expect(priced.totalRetail).toBe(75);
    expect(priced.baseWholesaleCost).toBe(50);
    expect(priced.allocatedChargeTotal).toBe(0);
    expect(priced.effectiveWholesaleCost).toBe(50);
  });

  it('honors overrides when building priced item', () => {
    const priced = buildPricedItem(
      { id: '1', name: 'Rose', quantity: 10, wholesaleCost: 55 },
      40,
      { baseWholesaleCost: 50, allocatedChargeTotal: 20, effectiveWholesaleCost: 55 }
    );
    expect(priced.baseWholesaleCost).toBe(50);
    expect(priced.allocatedChargeTotal).toBe(20);
    expect(priced.effectiveWholesaleCost).toBe(55);
  });
});
