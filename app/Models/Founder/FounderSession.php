<?php

declare(strict_types=1);

namespace App\Models\Founder;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FounderSession extends Model
{
    use HasUuids;

    protected $table = 'founder_sessions';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'token_hash',
        'ip_address',
        'user_agent',
        'expires_at',
        'last_activity_at',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Check if this session is expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if this session has been idle too long.
     */
    public function isIdle(int $idleMinutes): bool
    {
        return $this->last_activity_at->addMinutes($idleMinutes)->isPast();
    }

    /**
     * Update the last activity timestamp.
     */
    public function touchActivity(): void
    {
        $this->update(['last_activity_at' => now()]);
    }
}
