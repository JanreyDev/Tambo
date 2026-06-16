<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Admin\Barangay;
use App\Models\Tenant\Records\LotBuilding;
use Illuminate\Database\Seeder;

class LotBuildingSeeder extends Seeder
{
    public function run(): void
    {
        $tambo = Barangay::where('name', 'Tambo')->first();

        $records = [
            ['classification' => 'building_only', 'owner_name' => 'Juan dela Cruz', 'address' => '123 Rizal St.', 'purok' => 'Purok 1 - Sampaguita', 'size' => '120.5 sqm', 'boundary_north' => 'Mercado residence', 'boundary_south' => 'Vacant lot'],
            ['classification' => 'lot_and_building', 'owner_name' => 'Roberto Reyes', 'address' => '210 Luna St.', 'purok' => 'Purok 4 - Gumamela', 'size' => '250 sqm', 'boundary_north' => 'Main road', 'boundary_south' => 'Creek'],
            ['classification' => 'lot_only', 'owner_name' => 'Eduardo Ramos', 'address' => '78 Mabini St.', 'purok' => 'Purok 3 - Ilang-Ilang', 'size' => '180 sqm', 'boundary_north' => 'Barangay Hall', 'boundary_south' => 'Basketball Court'],
            ['classification' => 'building_only', 'owner_name' => 'Danilo Pangilinan Jr.', 'address' => '200 Rizal St.', 'purok' => 'Purok 3 - Ilang-Ilang', 'size' => '95 sqm', 'boundary_north' => 'Water refilling station', 'boundary_south' => 'Ramos compound'],
            ['classification' => 'building_only', 'owner_name' => 'Barangay Tambo', 'address' => '1 Aguinaldo St.', 'purok' => 'Purok 1 - Sampaguita', 'size' => '500 sqm', 'boundary_north' => 'Tambo Elementary School', 'boundary_south' => 'Multi-purpose court'],
        ];

        foreach ($records as $i => $data) {
            LotBuilding::create([
                'barangay_id' => $tambo->id,
                'lot_building_number' => str_pad((string) ($i + 1), 6, '0', STR_PAD_LEFT),
                'classification' => $data['classification'],
                'owner_name' => $data['owner_name'],
                'owner_contact' => fake()->numerify('091########'),
                'exact_address' => $data['address'],
                'purok' => $data['purok'],
                'latitude' => 14.4793 + (fake()->randomFloat(4, -0.005, 0.005)),
                'longitude' => 121.0198 + (fake()->randomFloat(4, -0.005, 0.005)),
                'size' => $data['size'],
                'boundary_north' => $data['boundary_north'],
                'boundary_south' => $data['boundary_south'],
                'status' => 'active',
            ]);
        }
    }
}
