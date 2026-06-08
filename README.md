# BCMP V5 API

Laravel 12 API backend for the Barangay Comprehensive Management Platform.

## Stack

- PHP 8.4 + Laravel 12
- PostgreSQL with Row Level Security
- Laravel Sanctum (auth)
- Laravel Horizon + Redis (queues)
- Laravel Reverb (WebSockets)
- Pest (testing)
- Scribe (API docs)

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

## Structure

- 50 migration files covering 60+ tables
- Multi-tenant architecture (shared DB, tenant_id + RLS)
- Modules: Residents, Households, Establishments, Officials, Documents, Judicial/KP, VAWC, Tanod, Finance, Inventory, Disaster/DRRM, GAD, HRIS, Public Portal, AI, Blockchain, Audit Logs

---

Built by Claude for PrimeX Ventures Inc.
