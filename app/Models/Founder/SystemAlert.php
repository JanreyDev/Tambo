<?php

declare(strict_types=1);

namespace App\Models\Founder;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SystemAlert extends Model
{
    use HasUuids;

    protected $table = 'system_alerts';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'severity',
        'source',
        'title',
        'description',
        'metadata',
        'acknowledged_at',
        'resolved_at',
        'telegram_sent_at',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'acknowledged_at' => 'datetime',
            'resolved_at' => 'datetime',
            'telegram_sent_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Scope: only unresolved alerts.
     */
    public function scopeUnresolved(Builder $query): Builder
    {
        return $query->whereNull('resolved_at');
    }

    /**
     * Scope: only critical severity alerts.
     */
    public function scopeCritical(Builder $query): Builder
    {
        return $query->where('severity', 'critical');
    }

    /**
     * Scope: filter by severity.
     */
    public function scopeOfSeverity(Builder $query, string $severity): Builder
    {
        return $query->where('severity', $severity);
    }

    /**
     * Scope: filter by source.
     */
    public function scopeFromSource(Builder $query, string $source): Builder
    {
        return $query->where('source', $source);
    }

    /**
     * Mark this alert as acknowledged.
     */
    public function acknowledge(): void
    {
        $this->update(['acknowledged_at' => now()]);
    }

    /**
     * Mark this alert as resolved.
     */
    public function resolve(): void
    {
        $this->update(['resolved_at' => now()]);
    }
}
