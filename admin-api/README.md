# PULITIKA.PH Admin API

Laravel control-plane API for the PULITIKA.PH platform — onboarding + operations for BCMP, LGMP, and PDMP. Powers the Founder admin (`admin-web`).

## Stack
- PHP 8.4 + Laravel 12
- PostgreSQL (database: `primex`)
- Redis (cache + queues)
- Laravel Sanctum (auth) · Pest (testing)

## Setup
```bash
docker compose up -d          # local Postgres + Redis
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed     # schema + seed admin user, roles, settings
php artisan serve
```
Seeded admin login comes from `database/seeders/AdminUserSeeder.php`.

## Scope (control plane)
- **Founder:** tenant onboarding (`BcmpTenantController`), PSGC lookup, document templates, marketplace, deployments, infra + product health, revenue, security
- **Platform:** AuditLog, PlatformSetting, ProductConnection, AdminUser
- **Vault:** secrets/config registry

Multi-product — manages BCMP/LGMP/PDMP, separate from any single product's API.

## BCMP integration
The admin provisions BCMP tenants by calling `bcmp-api` over HTTP using `BCMP_API_TOKEN` (no shared database). For full-stack local dev, run `bcmp-api` alongside and set a local token. Core admin features work without it.

---
Built by Claude for PrimeX Ventures Inc.
