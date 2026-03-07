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
            $this->setTenantSession('');

            return $next($request);
        }

        if ($user->is_super_admin) {
            // Super admin bypasses tenant scoping
            // RLS policies allow all rows when setting is empty + user has bypass role
            $this->setTenantSession('');
            app()->instance('current_barangay_id', null);
        } else {
            $barangayId = $user->barangay_id;

            if (empty($barangayId)) {
                abort(403, 'User is not assigned to any barangay.');
            }

            // SET LOCAL scopes to the current transaction
            $this->setTenantSession($barangayId);
            app()->instance('current_barangay_id', $barangayId);
        }

        return $next($request);
    }

    /**
     * Set the tenant context in the database session.
     * PostgreSQL uses SET LOCAL for RLS; other drivers (SQLite in tests) skip.
     */
    private function setTenantSession(string $barangayId): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('SET LOCAL app.current_barangay_id = ?', [$barangayId]);
        }
    }
}
