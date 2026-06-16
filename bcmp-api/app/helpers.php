<?php

declare(strict_types=1);

use App\Services\FeatureFlagService;

if (! function_exists('feature')) {
    /**
     * Check if a feature flag is enabled.
     *
     * Usage:
     *   feature('mabini-ai')                      // Check global flag
     *   feature('marketplace', $barangayId)        // Check tenant-specific flag
     *   feature('offline-mode', tenant_id())       // Check for current tenant
     *
     * @param  string  $key  The feature flag key
     * @param  string|null  $tenantId  Optional tenant (barangay) ID for tenant-specific flags
     */
    function feature(string $key, ?string $tenantId = null): bool
    {
        return FeatureFlagService::isEnabled($key, $tenantId);
    }
}

if (! function_exists('tenant_id')) {
    /**
     * Get the current tenant (barangay) ID from the application context.
     *
     * Returns null if no tenant context is set (e.g., super admin, unauthenticated).
     */
    function tenant_id(): ?string
    {
        return app()->bound('current_barangay_id')
            ? app('current_barangay_id')
            : null;
    }
}
