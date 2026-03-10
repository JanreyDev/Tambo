<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Founder Passcode
    |--------------------------------------------------------------------------
    |
    | The bcrypt hash of the founder's passcode. Used by the Command Center
    | at founder.primex.ventures for passcode-based authentication (not Sanctum).
    |
    | Generate with: php artisan tinker --execute="echo bcrypt('your-passcode');"
    |
    */

    'passcode_hash' => env('FOUNDER_PASSCODE'),

    /*
    |--------------------------------------------------------------------------
    | Session TTL (Time To Live)
    |--------------------------------------------------------------------------
    |
    | Maximum session duration in minutes before the founder must
    | re-authenticate. Default: 24 hours (1440 minutes).
    |
    */

    'session_ttl' => (int) env('FOUNDER_SESSION_TTL', 24 * 60),

    /*
    |--------------------------------------------------------------------------
    | Idle Timeout
    |--------------------------------------------------------------------------
    |
    | Maximum idle time in minutes before the session is automatically
    | invalidated. Default: 2 hours (120 minutes).
    |
    */

    'idle_timeout' => (int) env('FOUNDER_IDLE_TIMEOUT', 2 * 60),

];
