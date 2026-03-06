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
            ['name' => 'Purok 1 - Sampaguita', 'zone' => 'Zone 1', 'purok_leader' => 'Roberto Aquino', 'household_count' => 87],
            ['name' => 'Purok 2 - Rosal', 'zone' => 'Zone 1', 'purok_leader' => 'Lorna Fernandez', 'household_count' => 65],
            ['name' => 'Purok 3 - Ilang-Ilang', 'zone' => 'Zone 2', 'purok_leader' => 'Eduardo Ramos', 'household_count' => 92],
            ['name' => 'Purok 4 - Gumamela', 'zone' => 'Zone 2', 'purok_leader' => 'Rosalinda Torres', 'household_count' => 54],
            ['name' => 'Purok 5 - Orchid', 'zone' => 'Zone 3', 'purok_leader' => 'Danilo Mercado', 'household_count' => 78],
            ['name' => 'Purok 6 - Santan', 'zone' => 'Zone 3', 'purok_leader' => 'Gloria Bautista', 'household_count' => 43],
            ['name' => 'Purok 7 - Jasmine', 'zone' => 'Zone 4', 'purok_leader' => 'Armando Dizon', 'household_count' => 69],
        ];

        foreach ($tamboPuroks as $i => $purok) {
            Purok::create([
                'barangay_id' => $tambo->id,
                'name' => $purok['name'],
                'zone' => $purok['zone'],
                'purok_leader' => $purok['purok_leader'],
                'household_count' => $purok['household_count'],
                'sort_order' => $i + 1,
                'is_active' => true,
            ]);
        }

        $amucaoPuroks = [
            ['name' => 'Purok 1 - Narra', 'zone' => 'Zone 1', 'purok_leader' => 'Antonio Pangilinan', 'household_count' => 45],
            ['name' => 'Purok 2 - Mahogany', 'zone' => 'Zone 1', 'purok_leader' => 'Felicidad David', 'household_count' => 38],
            ['name' => 'Purok 3 - Acacia', 'zone' => 'Zone 2', 'purok_leader' => 'Rolando Aquino', 'household_count' => 52],
            ['name' => 'Purok 4 - Molave', 'zone' => 'Zone 2', 'purok_leader' => 'Teresita Lim', 'household_count' => 41],
            ['name' => 'Purok 5 - Kamagong', 'zone' => 'Zone 3', 'purok_leader' => 'Francisco Castro', 'household_count' => 33],
        ];

        foreach ($amucaoPuroks as $i => $purok) {
            Purok::create([
                'barangay_id' => $amucao->id,
                'name' => $purok['name'],
                'zone' => $purok['zone'],
                'purok_leader' => $purok['purok_leader'],
                'household_count' => $purok['household_count'],
                'sort_order' => $i + 1,
                'is_active' => true,
            ]);
        }
    }
}
