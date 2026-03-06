<?php

declare(strict_types=1);

namespace App\Traits;

use App\Models\Admin\Barangay;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Trait for models that belong to a barangay (tenant-scoped).
 *
 * Automatically scopes queries to the current tenant via PostgreSQL RLS.
 * This trait is a safety net — RLS is the primary isolation mechanism.
 */
trait BelongsToBarangay
{
    public static function bootBelongsToBarangay(): void
    {
        static::creating(function ($model) {
            if (empty($model->barangay_id) && app()->bound('current_barangay_id')) {
                $model->barangay_id = app('current_barangay_id');
            }
        });
    }

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    public function scopeForBarangay(Builder $query, string $barangayId): Builder
    {
        return $query->where('barangay_id', $barangayId);
    }
}
