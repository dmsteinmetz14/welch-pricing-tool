# Welch Pricing Tool

Wholesale flower pricing helper built with Next.js App Router, TailwindCSS, and TypeScript.

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to use the tool.

## Authentication Setup

Google sign-in is handled via Firebase Authentication. Create a Firebase project, enable Google as a provider, and copy the client-side config values into `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
# Optional extras if your Firebase project provides them:
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

Restricted areas (Flower Input, Supplier Input, Pricing) also read `NEXT_PUBLIC_ALLOWED_GOOGLE_EMAILS`, a comma-separated list of Gmail addresses that can access those pages:

```
NEXT_PUBLIC_ALLOWED_GOOGLE_EMAILS=user1@example.com,user2@example.com
```

If the list is empty, any authenticated Google user can open the restricted pages. The `/price-sheet` route always stays public.

## Baserow Configuration

The app reads and writes data via Baserow. Set these environment variables in `.env.local` so each table can be addressed:

```
BASEROW_TOKEN=...
BASEROW_API_URL=https://api.baserow.io # or your self-hosted base
BASEROW_FLOWERS_TABLE_ID=...
BASEROW_SUPPLIERS_TABLE_ID=...
BASEROW_CHARGES_TABLE_ID=...
BASEROW_STANDING_ORDERS_TABLE_ID=...
BASEROW_STANDING_ORDER_LINES_TABLE_ID=...
# Optional overrides if you renamed fields in Baserow:
# BASEROW_STANDING_ORDER_NAME_FIELD=Standing Order Name
# BASEROW_STANDING_ORDER_LINES_LINK_FIELD=Standing Orders
```

Standing orders rely on two tables: one row per standing order plus a linked table that stores the individual flower lines.

## Available Scripts

- `npm run dev` – start Next.js dev server.
- `npm run build` – create production build (outputs to `.next/`).
- `npm run start` – serve the production build.
- `npm run lint` – run ESLint via `next lint`.
- `npm run type-check` – type-check with `tsc --noEmit`.
- `npm run test` – run Vitest unit tests (see `lib/pricing.test.ts`).

## Documentation

- `docs/plan/flower-pricing.md` – project overview and state plan.
- `docs/documentation/pricing-tool.md` – architecture and helper details.
- `agent.md` – quick reference for collaborators.
