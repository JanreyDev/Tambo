# BCMP V5 API

Laravel 12 backend for the Barangay Comprehensive Management Platform.

## Products Served

| Product | Domain | Audience |
|---------|--------|----------|
| kapitan.ph | kapitan.ph | Barangay staff (admin/back-office) |
| kabataan.ph | kabataan.ph | SK officers (youth council, age 15-30) |
| barangay.org.ph | barangay.org.ph | Public / residents |

## Stack

- **Framework:** Laravel 12 / PHP 8.2+
- **Database:** PostgreSQL 18 with Row-Level Security (RLS)
- **Auth:** Laravel Sanctum
- **Queue:** Laravel Horizon + Redis
- **Realtime:** Laravel Reverb (WebSockets)
- **Search:** Meilisearch
- **Testing:** Pest
- **Error Tracking:** Sentry
- **Logging:** Structured JSON (per-product channels)
- **API Docs:** Scribe (auto-generated)
- **CI/CD:** GitLab CI

## Architecture

- **Multi-tenant:** Shared database with tenant_id + PostgreSQL RLS
- **Offline sync:** API supports conflict resolution for PWA/mobile sync
- **BIMS integration:** Auto-import BIMS SQLite data for DILG compliance

## Getting Started

```bash
# Prerequisites: Docker Desktop running
cp .env.example .env
docker compose up -d
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

## Environment

- **Staging:** staging-api-bcmp.primex.ventures
- **Production:** api.kapitan.ph (TBD)

## Access

This repository is restricted to Jeager and Claude only. Zero dev team access.
