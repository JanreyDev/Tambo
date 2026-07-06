<?php

declare(strict_types=1);

namespace App\Models\Vault;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class VaultAccessLog extends Model
{
    use HasUuids;

    protected $table = 'vault_access_logs';

    public $timestamps = false;

    /** @var list<string> */
    protected $fillable = [
        'vault_session_id',
        'action',
        'resource_type',
        'resource_id',
        'ip_address',
        'user_agent',
        'metadata',
        'created_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Create a vault access log entry.
     */
    public static function log(
        ?string $vaultSessionId,
        string $action,
        ?string $resourceType = null,
        ?string $resourceId = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?array $metadata = null,
    ): static {
        return static::create([
            'vault_session_id' => $vaultSessionId,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'ip_address' => $ipAddress ?? 'unknown',
            'user_agent' => $userAgent ?? 'unknown',
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }
}
