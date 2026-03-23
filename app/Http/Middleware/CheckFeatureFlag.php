<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\FeatureFlagService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates routes behind a feature flag.
 *
 * Usage in routes: ->middleware('feature:mabini-ai')
 *
 * Checks the feature flag for the current tenant first, then falls back to global.
 * Returns 404 if the feature is disabled (route does not exist for this tenant).
 */
class CheckFeatureFlag
{
    public function handle(Request $request, Closure $next, string $flag): Response
    {
        $tenantId = app()->bound('current_barangay_id')
            ? app('current_barangay_id')
            : null;

        if (! FeatureFlagService::isEnabled($flag, $tenantId)) {
            abort(404, 'Resource not found.');
        }

        return $next($request);
    }
}
