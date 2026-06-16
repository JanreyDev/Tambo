<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Platform\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Checks if the authenticated user has the required Spatie permission.
 *
 * Usage in routes: ->middleware('permission:vawc.view')
 *
 * Super admins bypass permission checks (they have full access).
 * Denied access attempts are logged to the audit trail for security monitoring.
 */
class CheckPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        // Super admins bypass all permission checks
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Check if user has ANY of the required permissions
        foreach ($permissions as $permission) {
            if ($user->hasPermissionTo($permission)) {
                return $next($request);
            }
        }

        // Log the denied access attempt
        AuditLog::create([
            'barangay_id' => $user->barangay_id,
            'user_id' => $user->id,
            'action' => 'access_denied',
            'resource_type' => $this->resolveResourceType($permissions),
            'resource_id' => $request->route('id') ?? $request->route('vawc_case') ?? null,
            'changes' => [
                'required_permissions' => $permissions,
                'route' => $request->path(),
                'method' => $request->method(),
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'module' => $this->resolveModule($permissions),
        ]);

        abort(403, 'You do not have permission to access this resource.');
    }

    /**
     * Resolve the resource type from the permission names.
     */
    private function resolveResourceType(array $permissions): string
    {
        $first = $permissions[0] ?? '';

        return match (true) {
            str_starts_with($first, 'vawc.') => 'vawc_case',
            str_starts_with($first, 'kp-cases.') => 'kp_case',
            str_starts_with($first, 'blotters.') => 'blotter',
            str_starts_with($first, 'residents.') => 'resident',
            str_starts_with($first, 'documents.') => 'document',
            str_starts_with($first, 'finance.') => 'finance',
            default => 'unknown',
        };
    }

    /**
     * Resolve the module name from the permission names.
     */
    private function resolveModule(array $permissions): string
    {
        $first = $permissions[0] ?? '';

        return match (true) {
            str_starts_with($first, 'vawc.') => 'vawc',
            str_starts_with($first, 'kp-cases.') => 'judicial',
            str_starts_with($first, 'blotters.') => 'judicial',
            str_starts_with($first, 'residents.') => 'residents',
            str_starts_with($first, 'documents.') => 'documents',
            str_starts_with($first, 'finance.') => 'finance',
            default => 'system',
        };
    }
}
