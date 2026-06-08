# PULITIKA.PH Admin Web

Next.js admin console for the PULITIKA.PH platform (control plane for BCMP, LGMP, PDMP). Talks to `admin-api`.

## Setup
```bash
pnpm install
cp .env.example .env.local      # set NEXT_PUBLIC_API_URL to your local admin-api
pnpm dev
```
Requires `admin-api` running locally (see its README). Types are generated from the admin-api OpenAPI spec via `pnpm generate-types`.

---
Built by Claude for PrimeX Ventures Inc.
