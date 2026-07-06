<?php

declare(strict_types=1);

namespace Tests\Traits;

use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

trait SeedsRoles
{
    /**
     * Seed the Spatie roles required for tests.
     * Call this in beforeEach() for any test that creates admin users via API.
     */
    protected function seedRoles(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $guardName = 'sanctum';

        Role::findOrCreate('super_admin', $guardName);
        Role::findOrCreate('admin', $guardName);
        Role::findOrCreate('viewer', $guardName);
    }
}
