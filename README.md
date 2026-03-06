# BCMP V5 Web

Next.js Turborepo monorepo for the Barangay Comprehensive Management Platform frontend.

## Apps

| App | Domain | Audience | Description |
|-----|--------|----------|-------------|
| kapitan | kapitan.ph | Barangay staff | Core management - residents, records, services, reports |
| kabataan | kabataan.ph | SK officers | SK operations, youth constituent management (age 15-30) |
| barangay | barangay.org.ph | Public / residents | Public portal - transparency, services, information |

## Packages

| Package | Purpose |
|---------|---------|
| @bcmp/ui | Shared UI components (data tables, forms, charts, cards) |
| @bcmp/api-client | Typed API client for bcmp-api (shared fetch logic, types) |
| @bcmp/shared | TypeScript types, utilities, constants |

## Stack

- **Framework:** Next.js 15 (React 19, App Router, SSR)
- **Monorepo:** Turborepo + pnpm workspaces
- **Styling:** Tailwind CSS 4
- **Testing:** Vitest + React Testing Library
- **Error Tracking:** Sentry
- **CI/CD:** GitLab CI

## Structure

```
apps/
  kapitan/          # kapitan.ph - staff/admin portal
  kabataan/         # kabataan.ph - SK officers portal
  barangay/         # barangay.org.ph - public portal
packages/
  ui/               # Shared UI component library
  api-client/       # Typed API client
  shared/           # Types, utils, constants
```

## Getting Started

```bash
pnpm install
pnpm dev           # Run all apps
pnpm dev:kapitan   # Run kapitan only
pnpm dev:kabataan  # Run kabataan only
pnpm dev:barangay  # Run barangay only
```

## Environment

- **Staging:** staging-bcmp.primex.ventures / staging-kabataan.primex.ventures / staging-barangay.primex.ventures
- **Production:** kapitan.ph / kabataan.ph / barangay.org.ph

## Access

This repository is restricted to Jeager and Claude only. Zero dev team access.
