<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Fix RLS policy super admin bypass.
 *
 * Previous policy: allowed ALL rows when app.current_barangay_id was empty.
 * This was used for both super admin bypass AND unauthenticated requests,
 * meaning unauthenticated requests could theoretically see all rows if
 * they reached a tenant-scoped table.
 *
 * New policy: uses a separate app.is_super_admin session variable.
 * Only authenticated super admin users get this flag set to 'true'.
 * Unauthenticated requests get neither flag, so they see zero rows
 * from tenant-scoped tables (defense in depth).
 */
return new class extends Migration
{
    private array $tenantTables = [
        'residents',
        'resident_sectoral_tags',
        'households',
        'establishments',
        'lots_buildings',
        'puroks',
        'barangay_officials',
        'councils',
        'council_sessions',
        'document_templates',
        'issued_documents',
        'document_routes',
        'kp_cases',
        'kp_case_parties',
        'kp_case_hearings',
        'blotter_records',
        'vawc_cases',
        'tanods',
        'tanod_duty_schedules',
        'tanod_patrol_logs',
        'tanod_incident_reports',
        'tanod_trainings',
        'budgets',
        'disbursement_vouchers',
        'petty_cash_vouchers',
        'payments',
        'collections_deposits',
        'cashbook_entries',
        'suppliers',
        'acceptance_inspection_reports',
        'assets',
        'inventory_categories',
        'inventory_items',
        'inventory_transactions',
        'hazard_pins',
        'evacuations',
        'evacuation_families',
        'gad_plans',
        'gad_plan_activities',
        'gad_accomplishments',
        'offices',
        'employees',
        'attendance_records',
        'barangay_posts',
        'public_document_requests',
        'public_complaints',
        'barangay_website_configs',
        'login_logs',
        'sign_in_logs',
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach ($this->tenantTables as $table) {
            // Drop old policy
            DB::statement("DROP POLICY IF EXISTS tenant_isolation ON {$table}");

            // New policy: explicit super admin flag instead of empty-string bypass
            DB::statement("
                CREATE POLICY tenant_isolation ON {$table}
                FOR ALL
                USING (
                    barangay_id::text = current_setting('app.current_barangay_id', true)
                    OR current_setting('app.is_super_admin', true) = 'true'
                )
                WITH CHECK (
                    barangay_id::text = current_setting('app.current_barangay_id', true)
                    OR current_setting('app.is_super_admin', true) = 'true'
                )
            ");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach ($this->tenantTables as $table) {
            DB::statement("DROP POLICY IF EXISTS tenant_isolation ON {$table}");

            // Restore original policy
            DB::statement("
                CREATE POLICY tenant_isolation ON {$table}
                FOR ALL
                USING (
                    barangay_id::text = current_setting('app.current_barangay_id', true)
                    OR current_setting('app.current_barangay_id', true) = ''
                )
                WITH CHECK (
                    barangay_id::text = current_setting('app.current_barangay_id', true)
                )
            ");
        }
    }
};
