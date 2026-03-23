<?php

declare(strict_types=1);

namespace App\Models\Platform;

use App\Models\Admin\Barangay;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeatureFlag extends Model
{
    protected $table = 'feature_flags';

    protected $fillable = [
        'key',
        'name',
        'description',
        'enabled',
        'tenant_id',
        'metadata',
        'remove_after',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'metadata' => 'array',
            'remove_after' => 'date',
        ];
    }

    // ── Relationships ──

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class, 'tenant_id');
    }

    // ── Scopes ──

    /**
     * Scope to global flags (no tenant).
     */
    public function scopeGlobal($query)
    {
        return $query->whereNull('tenant_id');
    }

    /**
     * Scope to a specific tenant.
     */
    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}
