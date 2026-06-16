<?php

/*
|--------------------------------------------------------------------------
| INSTALLATION INSTRUCTIONS
|--------------------------------------------------------------------------
|
| Scribe is NOT in composer.json. Install it first:
|
|   composer require knuckleswtf/scribe --dev
|
| Then publish this config file:
|
|   php artisan vendor:publish --provider="Knuckles\Scribe\ScribeServiceProvider" --tag=scribe-config
|
| Generate the documentation:
|
|   php artisan scribe:generate
|
| The output will be in:
|   - public/docs/           (static HTML, served at /docs)
|   - resources/docs/        (OpenAPI spec)
|
| View at: https://api.kapitan.ph/docs
|
| OpenAPI spec: https://api.kapitan.ph/docs/openapi.yaml
|
|--------------------------------------------------------------------------
*/

use Knuckles\Scribe\Extractors\ApiDetails;

return [

    /*
    |--------------------------------------------------------------------------
    | API Name and Description
    |--------------------------------------------------------------------------
    */
    'title' => 'BCMP API Documentation - kapitan.ph',

    'description' => 'The official REST API for kapitan.ph — the Barangay Comprehensive Management Platform (BCMP). Used by barangay staff across the Philippines to manage residents, households, documents, certificates, cases, and more.',

    'logo' => false,

    /*
    |--------------------------------------------------------------------------
    | Base URL
    |--------------------------------------------------------------------------
    |
    | Production API base URL. Used in generated examples and the OpenAPI spec.
    |
    */
    'base_url' => env('APP_ENV') === 'production' ? 'https://api.kapitan.ph' : env('APP_URL', 'http://localhost:8000'),

    /*
    |--------------------------------------------------------------------------
    | Output Type
    |--------------------------------------------------------------------------
    |
    | 'static'  — Output to public/docs/ (simple file-based, no Laravel routing needed)
    | 'laravel' — Served via Laravel routes (more dynamic, supports Try It Out)
    | 'external_static' — Combine with a separate static site generator
    |
    | Using 'static' for production compatibility (no additional routes exposed).
    |
    */
    'type' => 'laravel',

    'static' => [
        'output_path' => 'public/docs',
    ],

    'laravel' => [
        'add_routes' => true,
        'docs_url' => '/docs',
        'oauth2_callback_url' => '/docs/oauth2-callback',
        'middleware' => [],
        'assets_directory' => null,
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    |
    | BCMP uses Laravel Sanctum Bearer tokens.
    | All protected endpoints require: Authorization: Bearer {token}
    |
    */
    'auth' => [
        'enabled' => true,
        'default' => true, // All endpoints authenticated by default unless overridden
        'in' => 'bearer',
        'name' => 'Authorization',
        'use_value' => env('SCRIBE_AUTH_KEY', ''),
        'placeholder' => '{YOUR_SANCTUM_TOKEN}',
        'extra_info' => 'Obtain a token by authenticating via `POST /api/v1/auth/login`. Include it in the `Authorization` header as `Bearer {token}`. Tokens expire after 30 days.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Route Matching
    |--------------------------------------------------------------------------
    |
    | Which routes to document. Admin routes are excluded — they are internal-only.
    |
    */
    'routes' => [
        [
            'match' => [
                'prefixes' => ['api/v1/*'],
                'domains' => ['*'],
                'versions' => ['v1'],
            ],
            'include' => [],
            'exclude' => [
                // Admin routes — internal use only, not exposed in public API docs
                'api/v1/admin/*',
                // Sanctum CSRF (not relevant to API consumers)
                'sanctum/*',
                // Health check (internal ops)
                'up',
                '_ignition/*',
            ],
            'apply' => [
                'headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ],
                'response_calls' => [
                    'methods' => ['GET'],
                    'config' => [
                        'app.env' => 'documentation',
                        'app.debug' => false,
                    ],
                    'queryParams' => [],
                    'bodyParams' => [],
                    'fileParams' => [],
                    'cookies' => [],
                ],
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Grouping
    |--------------------------------------------------------------------------
    |
    | Group endpoints by controller. Each controller maps to one group.
    | Ungrouped endpoints land in "Endpoints".
    |
    */
    'groups' => [
        'default' => 'Endpoints',
        'order' => [
            'Authentication',
            'Residents',
            'Households',
            'Certificates',
            'Documents',
            'Blotter',
            'Cases (KP)',
            'VAWC',
            'Tanod',
            'Finance',
            'Inventory',
            'Marketplace',
            'Drive',
            'GAD',
            'DRRM',
            'HRIS',
            'Officials',
            'Users',
            'Activity Log',
            'Settings',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Example Values and Responses
    |--------------------------------------------------------------------------
    */
    'examples' => [
        'faker_seed' => 1234,
        'models_source' => ['factoryCreate', 'factoryMake', 'databaseFirst'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Tags / Metadata
    |--------------------------------------------------------------------------
    */
    'tags' => [
        'default' => '',
        'order' => [],
    ],

    /*
    |--------------------------------------------------------------------------
    | Extractors
    |--------------------------------------------------------------------------
    |
    | Scribe uses extractors to pull metadata from your routes.
    | DingoAPI not used — standard Laravel routing only.
    |
    */
    'strategies' => [
        'metadata' => [
            ...Knuckles\Scribe\Config\Defaults::METADATA_STRATEGIES,
        ],
        'headers' => [
            ...Knuckles\Scribe\Config\Defaults::HEADERS_STRATEGIES,
            Knuckles\Scribe\Extracting\Strategies\StaticData::withSettings(data: [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ]),
        ],
        'urlParameters' => [
            ...Knuckles\Scribe\Config\Defaults::URL_PARAMETERS_STRATEGIES,
        ],
        'queryParameters' => [
            ...Knuckles\Scribe\Config\Defaults::QUERY_PARAMETERS_STRATEGIES,
        ],
        'bodyParameters' => [
            ...Knuckles\Scribe\Config\Defaults::BODY_PARAMETERS_STRATEGIES,
        ],
        'responses' => Knuckles\Scribe\Config\configureStrategy(
            Knuckles\Scribe\Config\Defaults::RESPONSES_STRATEGIES,
            Knuckles\Scribe\Extracting\Strategies\Responses\ResponseCalls::withSettings(
                only: ['GET *'],
                config: [
                    'app.env' => 'documentation',
                    'app.debug' => false,
                ]
            )
        ),
        'responseFields' => [
            ...Knuckles\Scribe\Config\Defaults::RESPONSE_FIELDS_STRATEGIES,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | OpenAPI (Swagger) Output
    |--------------------------------------------------------------------------
    */
    'openapi' => [
        'enabled' => true,
        'servers' => [
            [
                'url' => 'https://api.kapitan.ph',
                'description' => 'Production',
            ],
            [
                'url' => env('APP_URL', 'http://localhost:8000'),
                'description' => 'Local Development',
            ],
        ],
        'info' => [
            'x-logo' => [
                'url' => 'https://kapitan.ph/logo.png',
                'backgroundColor' => '#1e293b',
                'altText' => 'kapitan.ph',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Postman Collection
    |--------------------------------------------------------------------------
    */
    'postman' => [
        'enabled' => false,
        'overrides' => [],
    ],

    /*
    |--------------------------------------------------------------------------
    | UI Configuration (Stoplight Elements)
    |--------------------------------------------------------------------------
    */
    'themes' => [
        'scalar' => [
            'theme' => 'default',
            'hide_download_button' => false,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Introductory Text
    |--------------------------------------------------------------------------
    */
    'intro_text' => <<<'INTRO'
## BCMP API — kapitan.ph

The Barangay Comprehensive Management Platform (BCMP) API powers kapitan.ph — the digital management system used by barangay staff across the Philippines.

### Base URL

```
https://api.kapitan.ph
```

### Authentication

All endpoints require a valid Sanctum Bearer token.

**Login to obtain a token:**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password",
  "barangay_slug": "brgy-tambo"
}
```

The response will include an `access_token`. Include it in all subsequent requests:

```http
Authorization: Bearer {access_token}
```

### Multi-Tenant Architecture

BCMP is a multi-tenant system. Each barangay is an isolated tenant. Your token is scoped to your barangay — you cannot access data from other barangays.

The active tenant is determined by the authenticated user's assigned barangay.

### Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Auth endpoints | 5 requests/min per IP |
| Read (GET) | 60 requests/min per user |
| Write (POST/PUT/PATCH) | 30 requests/min per user |
| File uploads | 10 requests/min per user |
| Exports | 5 requests/min per user |

### Response Format

All responses follow a consistent JSON structure:

```json
{
  "data": { ... },
  "message": "Success",
  "meta": { ... }
}
```

Errors return:

```json
{
  "message": "Validation failed",
  "errors": {
    "field": ["Error message"]
  }
}
```

### Versioning

Current API version: `v1`. All endpoints are prefixed with `/api/v1/`.

### Compliance

BCMP handles sensitive personal data governed by RA 10173 (Data Privacy Act of 2012). All API access is fully audited. Data is scoped to your barangay only.
INTRO,

    /*
    |--------------------------------------------------------------------------
    | External Documentation Links
    |--------------------------------------------------------------------------
    */
    'last_updated' => 'automatically',

    /*
    |--------------------------------------------------------------------------
    | Middleware to Exclude
    |--------------------------------------------------------------------------
    |
    | Routes behind these middleware will be excluded from documentation.
    | super_admin routes are internal-only and not part of the public API.
    |
    */
    'middleware_to_exclude' => [
        'super_admin',
    ],

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    |
    | Database connection used when making response calls for example generation.
    | Uses the default connection to avoid touching other tenant databases.
    |
    */
    'database_connections_to_transact' => [config('database.default')],

    /*
    |--------------------------------------------------------------------------
    | Fractal (not used — BCMP uses Laravel API Resources)
    |--------------------------------------------------------------------------
    */
    'fractal' => [
        'serializer' => null,
    ],

    /*
    |--------------------------------------------------------------------------
    | Routefilter (additional filtering beyond exclude list)
    |--------------------------------------------------------------------------
    |
    | Custom callable to filter routes. Return false to exclude a route.
    |
    */
    'routeFilter' => null,

];
