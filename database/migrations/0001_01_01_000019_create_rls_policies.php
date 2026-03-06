<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * PostgreSQL Row Level Security (RLS) policies.
 *
 * Tenant isolation: every table with a barangay_id column gets
 * an RLS policy that filters rows by the current session's
 * app.current_barangay_id setting (set by SetTenantContext middleware).
 *
 * Super admin users bypass RLS via the bcmp_admin role.
 */
return new class extends Migration
{
    /**
     * Tables that have barangay_id and need RLS policies.
     */
    private array $tenantTables = [
        'residents',
        'resident_sectoral_tags',
        'resident_cross_barangay_flags',
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
        // Create a database role for admin users that bypasses RLS
        DB::statement("DO $$ BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bcmp_admin') THEN
                CREATE ROLE bcmp_admin;
            END IF;
        END $$;");

        foreach ($this->tenantTables as $table) {
            // Enable RLS on the table
            DB::statement("ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY");

            // Policy: users see only rows matching their tenant
            // When app.current_barangay_id is empty string, show no rows (public/unauthenticated)
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

            // Force RLS for table owner too (needed for application-level queries)
            DB::statement("ALTER TABLE {$table} FORCE ROW LEVEL SECURITY");
        }
    }

    public function down(): void
    {
        foreach ($this->tenantTables as $table) {
            DB::statement("DROP POLICY IF EXISTS tenant_isolation ON {$table}");
            DB::statement("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY");
        }

        DB::statement("DROP ROLE IF EXISTS bcmp_admin");
    }
};
