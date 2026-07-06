<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Vault Keyphrase
    |--------------------------------------------------------------------------
    |
    | The bcrypt hash of the family vault keyphrase. Used by the Family Vault
    | at founder.primex.ventures/vault for keyphrase-based authentication.
    | Completely separate from the Founder passcode.
    |
    | Generate with: php artisan tinker --execute="echo bcrypt('your-keyphrase');"
    |
    */

    'keyphrase_hash' => env('VAULT_KEYPHRASE'),

    /*
    |--------------------------------------------------------------------------
    | Session TTL (Time To Live)
    |--------------------------------------------------------------------------
    |
    | Maximum session duration in minutes before the family must
    | re-authenticate. Default: 4 hours (240 minutes).
    | Longer than Founder because family may need extended time to read.
    |
    */

    'session_ttl' => (int) env('VAULT_SESSION_TTL', 4 * 60),

    /*
    |--------------------------------------------------------------------------
    | No Idle Timeout
    |--------------------------------------------------------------------------
    |
    | Family Vault intentionally has NO idle timeout.
    | Family members may leave the page open while making calls,
    | reading documents, or gathering information.
    |
    */

];
