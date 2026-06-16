<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Admin\Barangay;
use App\Models\Tenant\Officials\Purok;
use Illuminate\Database\Seeder;

class PurokSeeder extends Seeder
{
    public function run(): void
    {
        $tambo = Barangay::where('name', 'Tambo')->first();
        $amucao = Barangay::where('name', 'Amucao')->first();

        $tamboPuroks = [
            ['name' => 'Purok 1 - Sampaguita', 'description' => 'Zone 1', 'household_count' => 87],
            ['name' => 'Purok 2 - Rosal', 'description' => 'Zone 1', 'household_count' => 65],
            ['name' => 'Purok 3 - Ilang-Ilang', 'description' => 'Zone 2', 'household_count' => 92],
            ['name' => 'Purok 4 - Gumamela', 'description' => 'Zone 2', 'household_count' => 54],
            ['name' => 'Purok 5 - Orchid', 'description' => 'Zone 3', 'household_count' => 78],
            ['name' => 'Purok 6 - Santan', 'description' => 'Zone 3', 'household_count' => 43],
            ['name' => 'Purok 7 - Jasmine', 'description' => 'Zone 4', 'household_count' => 69],
        ];

        foreach ($tamboPuroks as $purok) {
            Purok::create([
                'barangay_id' => $tambo->id,
                'name' => $purok['name'],
                'description' => $purok['description'],
                'household_count' => $purok['household_count'],
            ]);
        }

        $amucaoPuroks = [
            ['name' => 'Purok 1 - Narra', 'description' => 'Zone 1', 'household_count' => 45],
            ['name' => 'Purok 2 - Mahogany', 'description' => 'Zone 1', 'household_count' => 38],
            ['name' => 'Purok 3 - Acacia', 'description' => 'Zone 2', 'household_count' => 52],
            ['name' => 'Purok 4 - Molave', 'description' => 'Zone 2', 'household_count' => 41],
            ['name' => 'Purok 5 - Kamagong', 'description' => 'Zone 3', 'household_count' => 33],
        ];

        foreach ($amucaoPuroks as $purok) {
            Purok::create([
                'barangay_id' => $amucao->id,
                'name' => $purok['name'],
                'description' => $purok['description'],
                'household_count' => $purok['household_count'],
            ]);
        }
    }
}
