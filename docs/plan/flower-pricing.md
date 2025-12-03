# Flower Pricing Tool Plan

## Pages
- **Input (`/input`)**: supplier selector + multi-row flower form + current flower list summary.
- **Price Sheet (`/price-sheet`)**: markup controls + retail pricing table summarizing calculations.
- **Suppliers (`/suppliers`)**: optional management page for supplier data and additional charges.

## State & Data Flow
- Central `PricingContext` stores flowers, markup, and suppliers.
- Derived data:
  - `pricedItems` from `lib/pricing.buildPricedItem`.
  - `totals` computed from priced items.
- Context exposed via `usePricing` hook for component consumption.

## Utilities & Types
- `lib/pricing.ts`: math helpers + currency formatting.
- `types/pricing.ts` and `types/suppliers.ts`: shared interfaces.
- Tests (`lib/pricing.test.ts`) cover pricing helper correctness.
