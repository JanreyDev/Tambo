<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sets the PostgreSQL tenant context for Row Level Security.
 *
 * For authenticated barangay users: sets app.current_barangay_id to their barangay.
 * For super admins: leaves the setting empty (bypasses RLS via database role).
 * For unauthenticated requests: no tenant context (public routes only).
 */
class SetTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            // Unauthenticated — public routes, no tenant context
            DB::statement("SET LOCAL app.current_barangay_id = ''");

            return $next($request);
        }

        if ($user->is_super_admin) {
            // Super admin bypasses tenant scoping
            // RLS policies allow all rows when setting is empty + user has bypass role
            DB::statement("SET LOCAL app.current_barangay_id = ''");
            app()->instance('current_barangay_id', null);
        } else {
            $barangayId = $user->barangay_id;

            if (empty($barangayId)) {
                abort(403, 'User is not assigned to any barangay.');
            }

            // SET LOCAL scopes to the current transaction
            DB::statement("SET LOCAL app.current_barangay_id = ?", [$barangayId]);
            app()->instance('current_barangay_id', $barangayId);
        }

        return $next($request);
    }
}
