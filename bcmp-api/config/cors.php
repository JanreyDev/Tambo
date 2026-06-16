<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Restricted CORS policy for BCMP API. Only allows requests from
    | known frontends (kapitan.ph, staging, localhost dev).
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_filter(
        env('CORS_ALLOWED_ORIGINS')
            ? explode(',', env('CORS_ALLOWED_ORIGINS'))
            : [
                'https://kapitan.ph',
                'https://www.kapitan.ph',
                'http://localhost:3000',
                'http://localhost:3001',
            ]
    ),

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Requested-With',
    ],

    'exposed_headers' => [],

    // 1 hour preflight cache — reduces OPTIONS requests from browsers.
    'max_age' => 3600,

    // Required for httpOnly cookie auth — browser must be allowed to attach cookies
    // on cross-origin XHR. Origins above are explicit (no wildcard) — required by spec
    // when supports_credentials is true.
    'supports_credentials' => true,

];
