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
