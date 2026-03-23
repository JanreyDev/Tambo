<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Add vawc.delete permission (RA 9262 compliance — separate delete from edit).
 *
 * Previously, VAWC case deletion used the vawc.edit permission. This migration
 * creates a dedicated vawc.delete permission and assigns it to the roles that
 * should have delete authority: kapitan, secretary, and vawc_desk_officer.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Reset cached permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create the permission if it doesn't exist
        $permission = Permission::firstOrCreate(
            ['name' => 'vawc.delete', 'guard_name' => 'sanctum'],
        );

        // Assign to roles that should have VAWC delete authority
        $roles = ['kapitan', 'secretary', 'vawc_desk_officer'];

        foreach ($roles as $roleName) {
            $role = Role::where('name', $roleName)
                ->where('guard_name', 'sanctum')
                ->first();

            if ($role && ! $role->hasPermissionTo('vawc.delete')) {
                $role->givePermissionTo($permission);
            }
        }
    }

    public function down(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Remove the permission from roles
        $permission = Permission::where('name', 'vawc.delete')
            ->where('guard_name', 'sanctum')
            ->first();

        if ($permission) {
            $permission->delete();
        }
    }
};
