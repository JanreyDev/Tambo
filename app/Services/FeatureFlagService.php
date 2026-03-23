<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Platform\FeatureFlag;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Feature flag service with Redis caching (5-minute TTL).
 *
 * Lookup order:
 * 1. Redis cache (tenant-specific key, then global key)
 * 2. Database (tenant-specific flag, then global flag)
 * 3. Default: false (flag does not exist = disabled)
 */
class FeatureFlagService
{
    private const CACHE_TTL_SECONDS = 300; // 5 minutes

    private const CACHE_PREFIX = 'feature_flag:';

    /**
     * Check if a feature flag is enabled.
     *
     * If a tenant-specific flag exists, it takes precedence over the global flag.
     * If only a global flag exists, that is used.
     * If no flag exists at all, returns false (default off).
     */
    public static function isEnabled(string $key, ?string $tenantId = null): bool
    {
        // Check tenant-specific flag first (if tenant provided)
        if ($tenantId !== null) {
            $tenantValue = static::getCachedFlag($key, $tenantId);
            if ($tenantValue !== null) {
                return $tenantValue;
            }
        }

        // Fall back to global flag
        $globalValue = static::getCachedFlag($key, null);

        return $globalValue ?? false;
    }

    /**
     * Get all flags for a tenant, merged with global flags.
     *
     * Tenant-specific flags override global flags with the same key.
     * Returns a collection keyed by flag key for easy lookup.
     */
    public static function getAllFlags(?string $tenantId = null): Collection
    {
        $cacheKey = static::CACHE_PREFIX.'all:'.($tenantId ?? 'global');

        return Cache::remember($cacheKey, static::CACHE_TTL_SECONDS, function () use ($tenantId): Collection {
            // Get global flags
            $globalFlags = FeatureFlag::whereNull('tenant_id')->get()->keyBy('key');

            if ($tenantId === null) {
                return $globalFlags;
            }

            // Get tenant-specific flags and merge (tenant overrides global)
            $tenantFlags = FeatureFlag::where('tenant_id', $tenantId)->get()->keyBy('key');

            return $globalFlags->merge($tenantFlags);
        });
    }

    /**
     * Enable a feature flag.
     */
    public static function enable(string $key, ?string $tenantId = null): void
    {
        static::set($key, true, $tenantId);
    }

    /**
     * Disable a feature flag.
     */
    public static function disable(string $key, ?string $tenantId = null): void
    {
        static::set($key, false, $tenantId);
    }

    /**
     * Set a feature flag value with optional metadata.
     */
    public static function set(string $key, bool $enabled, ?string $tenantId = null, ?array $metadata = null): void
    {
        $attributes = ['key' => $key, 'tenant_id' => $tenantId];
        $values = ['enabled' => $enabled];

        if ($metadata !== null) {
            $values['metadata'] = $metadata;
        }

        FeatureFlag::updateOrCreate($attributes, $values);

        // Bust the cache for this specific flag
        static::bustCache($key, $tenantId);
    }

    /**
     * Get a cached flag value. Returns null if not found in cache or database.
     */
    private static function getCachedFlag(string $key, ?string $tenantId): ?bool
    {
        $cacheKey = static::cacheKey($key, $tenantId);

        return Cache::remember($cacheKey, static::CACHE_TTL_SECONDS, function () use ($key, $tenantId): ?bool {
            $query = FeatureFlag::where('key', $key);

            if ($tenantId !== null) {
                $query->where('tenant_id', $tenantId);
            } else {
                $query->whereNull('tenant_id');
            }

            $flag = $query->first();

            // Return null if flag doesn't exist — lets caller distinguish "flag not found" from "flag disabled"
            return $flag?->enabled;
        });
    }

    /**
     * Build a cache key for a flag.
     */
    private static function cacheKey(string $key, ?string $tenantId): string
    {
        $scope = $tenantId ?? 'global';

        return static::CACHE_PREFIX.$scope.':'.$key;
    }

    /**
     * Bust the cache for a specific flag and the "all flags" cache.
     */
    private static function bustCache(string $key, ?string $tenantId): void
    {
        Cache::forget(static::cacheKey($key, $tenantId));
        Cache::forget(static::CACHE_PREFIX.'all:'.($tenantId ?? 'global'));
    }
}
