<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Default Hash Driver
    |--------------------------------------------------------------------------
    |
    | Argon2id is the OWASP-recommended password hashing algorithm (2026).
    | Bcrypt remains supported for backward compatibility with existing hashes —
    | PHP's password_verify() auto-detects the algorithm from the hash prefix,
    | so old bcrypt hashes still validate. On successful login, AuthController
    | calls Hash::needsRehash() and transparently re-hashes to Argon2id.
    |
    | Supported: "argon2i", "argon2id", "bcrypt"
    |
    */

    'driver' => 'argon2id',

    /*
    |--------------------------------------------------------------------------
    | Bcrypt Options
    |--------------------------------------------------------------------------
    |
    | Retained for legacy hash verification only.
    | Rounds 12 = ~250ms per hash on modern CPU. OWASP minimum is 10.
    |
    */

    'bcrypt' => [
        'rounds' => env('BCRYPT_ROUNDS', 12),
        'verify' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Argon2id Options
    |--------------------------------------------------------------------------
    |
    | Tuned for s-1vcpu-1gb droplet — balance security vs OOM risk.
    | memory: 32 MB per hash (OWASP minimum 19 MiB)
    | time:   4 iterations (OWASP recommended 3+)
    | threads: 1 (single-vCPU droplet)
    |
    | Result: ~200-400ms per hash. Defeats credential stuffing at scale
    | while staying responsive for human logins.
    |
    */

    'argon' => [
        'memory' => env('ARGON_MEMORY', 32768),
        'threads' => env('ARGON_THREADS', 1),
        'time' => env('ARGON_TIME', 4),
        'verify' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Rehash On Login
    |--------------------------------------------------------------------------
    |
    | When true, automatically rehashes a user's password if the configured
    | algorithm changes (e.g., bcrypt -> argon2id migration). Default true.
    |
    */

    'rehash_on_login' => true,

];
