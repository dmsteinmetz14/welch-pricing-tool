# Welch Pricing Tool Documentation

## Overview
- **Framework**: Next.js App Router + TypeScript + TailwindCSS.
- **Purpose**: Capture wholesale flower data per supplier and preview retail pricing sheets.
- **Key directories**
  - `app/`: routed pages & layout.
  - `components/`: shared UI (forms, lists, tables).
  - `contexts/`: global pricing state via React context.
  - `lib/`: pricing helpers & formatting utilities.
  - `types/`: shared TypeScript definitions.
  - `docs/`: plans + documentation (this file).

## Pricing Helpers
- `DEFAULT_MARKUP_PERCENT`: starting markup assumption (40%).
- `calculateStemCost(totalCost, quantity)`: per-stem wholesale cost rounding to cents.
- `calculateRetailPerStem(stemCost, markupPercent)`: applies markup multiplier.
- `calculateTotalRetail(quantity, retailPerStem)`: total retail at quantity.
- `buildPricedItem(flower, markupPercent)`: returns enriched item with derived fields.
- `formatCurrency(value)`: USD currency formatting for UI.

## Commands
- `npm run dev` – start Next.js dev server.
- `npm run build` / `npm run start` – production build + serve.
- `npm run lint` – ESLint via `next lint`.
- `npm run type-check` – standalone TypeScript check.
- `npm run test` – Vitest unit tests (JS DOM env).
