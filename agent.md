# Welch Pricing Tool Repo Guide

## Purpose
Lightweight wholesale flower pricing assistant built with Next.js App Router, TailwindCSS, and TypeScript. Captures supplier details, wholesale inputs, and previews retail pricing.

## Structure Highlights
- `app/` – routed pages (input, price sheet, suppliers) plus shared layout/providers.
- `components/` – UI building blocks (forms, lists, tables, nav).
- `contexts/` – `PricingContext` managing flowers, markup, and suppliers.
- `lib/` – pricing helpers + currency utilities.
- `types/` – shared interfaces for flowers & suppliers.
- `docs/` – plan + detailed documentation.

## Commands
- `npm run dev` – start dev server.
- `npm run build` – production build.
- `npm run start` – serve built app.
- `npm run lint` – run ESLint.
- `npm run type-check` – tsc with no emit.
- `npm run test` / `test:watch` – Vitest suites.
