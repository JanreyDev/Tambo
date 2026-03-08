<?php

declare(strict_types=1);

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

/**
 * Extended Sanctum token with device tracking fields.
 *
 * Adds ip_address and device_info columns to track session details
 * for the My Account > Active Sessions UI.
 */
class PersonalAccessToken extends SanctumPersonalAccessToken
{
    protected $fillable = [
        'name',
        'token',
        'abilities',
        'ip_address',
        'device_info',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'abilities' => 'json',
            'device_info' => 'array',
            'last_used_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }
}
