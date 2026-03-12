<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            BarangaySeeder::class,
            RolePermissionSeeder::class,
            UserSeeder::class,
            PurokSeeder::class,
            ResidentSeeder::class,
            EstablishmentSeeder::class,
            LotBuildingSeeder::class,
            OfficialSeeder::class,
            PlatformUpdatesSeeder::class,
            DefaultDocumentTemplateSeeder::class,
        ]);
    }
}
