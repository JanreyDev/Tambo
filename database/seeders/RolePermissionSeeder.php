<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Residents
            'residents.view', 'residents.create', 'residents.edit', 'residents.delete',
            // Establishments
            'establishments.view', 'establishments.create', 'establishments.edit', 'establishments.delete',
            // Lots & Buildings
            'lots-buildings.view', 'lots-buildings.create', 'lots-buildings.edit', 'lots-buildings.delete',
            // Documents
            'documents.view', 'documents.create', 'documents.edit', 'documents.delete', 'documents.approve',
            // Judicial
            'kp-cases.view', 'kp-cases.create', 'kp-cases.edit',
            'blotters.view', 'blotters.create', 'blotters.edit',
            'vawc.view', 'vawc.create', 'vawc.edit',
            // Officials
            'officials.view', 'officials.manage',
            // Finance
            'finance.view', 'finance.create', 'finance.approve',
            // Settings
            'settings.view', 'settings.manage',
            // Users
            'users.view', 'users.create', 'users.edit', 'users.delete',
            // Reports
            'reports.view', 'reports.export',
            // AI
            'ai.access',
            // SMS
            'sms.send', 'sms.blast',
        ];

        foreach ($permissions as $perm) {
            Permission::create(['name' => $perm, 'guard_name' => 'sanctum']);
        }

        // Create roles and assign permissions
        $kapitan = Role::create(['name' => 'kapitan', 'guard_name' => 'sanctum']);
        $kapitan->givePermissionTo(Permission::all());

        $secretary = Role::create(['name' => 'secretary', 'guard_name' => 'sanctum']);
        $secretary->givePermissionTo([
            'residents.view', 'residents.create', 'residents.edit',
            'establishments.view', 'establishments.create', 'establishments.edit',
            'lots-buildings.view', 'lots-buildings.create', 'lots-buildings.edit',
            'documents.view', 'documents.create', 'documents.edit', 'documents.approve',
            'kp-cases.view', 'kp-cases.create', 'kp-cases.edit',
            'blotters.view', 'blotters.create', 'blotters.edit',
            'officials.view', 'officials.manage',
            'finance.view', 'finance.create',
            'reports.view', 'reports.export',
            'users.view',
            'ai.access', 'sms.send', 'sms.blast',
        ]);

        $treasurer = Role::create(['name' => 'treasurer', 'guard_name' => 'sanctum']);
        $treasurer->givePermissionTo([
            'residents.view',
            'documents.view', 'documents.create',
            'finance.view', 'finance.create', 'finance.approve',
            'reports.view', 'reports.export',
            'ai.access',
        ]);

        $kagawad = Role::create(['name' => 'kagawad', 'guard_name' => 'sanctum']);
        $kagawad->givePermissionTo([
            'residents.view',
            'establishments.view',
            'documents.view', 'documents.create',
            'kp-cases.view', 'kp-cases.create',
            'blotters.view', 'blotters.create',
            'reports.view',
            'ai.access',
        ]);

        $healthWorker = Role::create(['name' => 'health_worker', 'guard_name' => 'sanctum']);
        $healthWorker->givePermissionTo([
            'residents.view', 'residents.edit',
            'documents.view',
            'reports.view',
            'ai.access',
        ]);

        $skChairman = Role::create(['name' => 'sk_chairman', 'guard_name' => 'sanctum']);
        $skChairman->givePermissionTo([
            'residents.view',
            'documents.view', 'documents.create',
            'reports.view',
            'ai.access',
        ]);

        $tanod = Role::create(['name' => 'tanod', 'guard_name' => 'sanctum']);
        $tanod->givePermissionTo([
            'residents.view',
            'blotters.view', 'blotters.create',
            'ai.access',
        ]);

        $staff = Role::create(['name' => 'staff', 'guard_name' => 'sanctum']);
        $staff->givePermissionTo([
            'residents.view',
            'documents.view',
            'ai.access',
        ]);
    }
}
