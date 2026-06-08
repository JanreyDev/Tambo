# BCMP Web — kapitan.ph V5 Frontend

Next.js 16 + React 19 + Tailwind 4 frontend for BCMP V5 (kapitan.ph). Talks to `bcmp-api`.

## Setup
```bash
pnpm install
cp .env.example .env.local      # set NEXT_PUBLIC_API_URL to your local bcmp-api
pnpm dev                        # http://localhost:3001
```
Requires `bcmp-api` running locally (see its README).

## Env
- `NEXT_PUBLIC_API_URL` — base URL of bcmp-api (e.g. http://localhost:8000)
- `NEXT_PUBLIC_SENTRY_DSN` — optional, leave empty for local

## Scripts
- `pnpm dev` — dev server (port 3001)
- `pnpm build` / `pnpm start` — production build
- `pnpm test` — vitest
- `pnpm generate-types` — regenerate API types from the bcmp-api OpenAPI spec

---
Built by Claude for PrimeX Ventures Inc.
