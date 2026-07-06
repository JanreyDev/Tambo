<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\AdminUser;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the default super admin user.
     */
    public function run(): void
    {
        $admin = AdminUser::firstOrCreate(
            ['username' => 'admin'],
            [
                'email' => 'admin@primex.ventures',
                'password' => 'password',
                'first_name' => 'System',
                'last_name' => 'Administrator',
                'role' => 'super_admin',
                'status' => 'active',
            ],
        );

        $admin->assignRole('super_admin');
    }
}
