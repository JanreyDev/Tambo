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
 * For super admins: sets app.is_super_admin = 'true' (bypasses RLS via policy check).
 * For unauthenticated requests: no context set (sees zero tenant rows — defense in depth).
 */
class SetTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            // Unauthenticated — public routes only.
            // No session variables set = RLS blocks all tenant rows.
            $this->clearTenantSession();

            return $next($request);
        }

        if ($user->is_super_admin) {
            // Super admin bypasses tenant scoping via dedicated flag.
            // RLS policy checks: app.is_super_admin = 'true'
            $this->setSuperAdminSession();
            app()->instance('current_barangay_id', null);
        } else {
            $barangayId = $user->barangay_id;

            if (empty($barangayId)) {
                abort(403, 'User is not assigned to any barangay.');
            }

            $this->setTenantSession($barangayId);
            app()->instance('current_barangay_id', $barangayId);
        }

        return $next($request);
    }

    /**
     * Set tenant context for a regular barangay user.
     */
    private function setTenantSession(string $barangayId): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        // Strict UUID validation to prevent SQL injection via SET statement.
        // PostgreSQL SET does not support parameterized queries.
        if (! preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $barangayId)) {
            abort(403, 'Invalid tenant context.');
        }

        $escaped = pg_escape_string($barangayId);
        DB::statement("SET app.current_barangay_id = '{$escaped}'");
        DB::statement("SET app.is_super_admin = 'false'");
    }

    /**
     * Set super admin bypass flag (no tenant scoping).
     */
    private function setSuperAdminSession(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("SET app.current_barangay_id = ''");
        DB::statement("SET app.is_super_admin = 'true'");
    }

    /**
     * Clear all tenant context (unauthenticated requests).
     * Neither barangay_id nor super_admin flag is set — RLS blocks all tenant rows.
     */
    private function clearTenantSession(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("SET app.current_barangay_id = ''");
        DB::statement("SET app.is_super_admin = 'false'");
    }
}
