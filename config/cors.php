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
        'https://staging-bcmp.primex.ventures',
        'https://pulitika.ph',
        'https://staging-pulitika.primex.ventures',
        'http://localhost:3000',
        'http://localhost:3001',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Requested-With',
        'X-XSRF-TOKEN',
    ],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => false,

];
