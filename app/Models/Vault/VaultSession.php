<?php

declare(strict_types=1);

namespace App\Models\Vault;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class VaultSession extends Model
{
    use HasUuids;

    protected $table = 'vault_sessions';

    public $timestamps = false;

    /** @var list<string> */
    protected $fillable = [
        'token_hash',
        'ip_address',
        'user_agent',
        'expires_at',
        'last_activity_at',
        'created_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * No idle timeout for vault -- family may need extended time to read.
     */
    public function touchActivity(): void
    {
        $this->update(['last_activity_at' => now()]);
    }
}
