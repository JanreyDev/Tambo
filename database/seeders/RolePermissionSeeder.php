<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Seed roles and permissions for the Pulitika admin system.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            'manage_users',
            'manage_products',
            'view_analytics',
            'manage_settings',
            'view_audit_logs',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'sanctum',
            ]);
        }

        // Create roles and assign permissions
        $superAdmin = Role::firstOrCreate([
            'name' => 'super_admin',
            'guard_name' => 'sanctum',
        ]);
        $superAdmin->syncPermissions($permissions);

        $admin = Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'sanctum',
        ]);
        $admin->syncPermissions([
            'manage_users',
            'manage_products',
            'view_analytics',
            'view_audit_logs',
        ]);

        $viewer = Role::firstOrCreate([
            'name' => 'viewer',
            'guard_name' => 'sanctum',
        ]);
        $viewer->syncPermissions([
            'view_analytics',
            'view_audit_logs',
        ]);
    }
}
