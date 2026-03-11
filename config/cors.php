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

    'allowed_origins' => [
        'https://kapitan.ph',
        'https://www.kapitan.ph',
        'http://localhost:3000',
        'http://localhost:3001',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Requested-With',
        // X-XSRF-TOKEN removed — token-based auth only, no CSRF cookies
    ],

    'exposed_headers' => [],

    // 1 hour preflight cache — reduces OPTIONS requests from browsers.
    // 86400 (24h) was too aggressive; some browsers cap at 2h anyway.
    'max_age' => 3600,

    'supports_credentials' => false,

];
