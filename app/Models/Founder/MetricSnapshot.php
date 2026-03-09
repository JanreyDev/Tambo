<?php

declare(strict_types=1);

namespace App\Models\Founder;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class MetricSnapshot extends Model
{
    protected $table = 'metric_snapshots';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'droplet_id',
        'cpu_percent',
        'memory_percent',
        'disk_percent',
        'bandwidth_in',
        'bandwidth_out',
        'recorded_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'droplet_id' => 'integer',
            'cpu_percent' => 'decimal:2',
            'memory_percent' => 'decimal:2',
            'disk_percent' => 'decimal:2',
            'bandwidth_in' => 'integer',
            'bandwidth_out' => 'integer',
            'recorded_at' => 'datetime',
        ];
    }

    /**
     * Scope: filter by droplet ID.
     */
    public function scopeForDroplet(Builder $query, int $dropletId): Builder
    {
        return $query->where('droplet_id', $dropletId);
    }

    /**
     * Scope: only snapshots within the last N hours.
     */
    public function scopeRecent(Builder $query, int $hours = 1): Builder
    {
        return $query->where('recorded_at', '>=', now()->subHours($hours));
    }
}
