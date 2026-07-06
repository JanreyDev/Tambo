<?php

declare(strict_types=1);

namespace App\Models\Founder;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class InfrastructureSnapshot extends Model
{
    use HasUuids;

    protected $table = 'infrastructure_snapshots';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'snapshot_type',
        'data',
        'fetched_at',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data' => 'array',
            'fetched_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Get the latest snapshot of a given type.
     */
    public static function latest(string $type): ?self
    {
        return static::where('snapshot_type', $type)
            ->orderByDesc('fetched_at')
            ->first();
    }

    /**
     * Check if a cached snapshot is still fresh.
     */
    public static function isFresh(string $type, int $maxAgeMinutes): bool
    {
        $snapshot = static::latest($type);

        if ($snapshot === null) {
            return false;
        }

        return $snapshot->fetched_at->addMinutes($maxAgeMinutes)->isFuture();
    }
}
