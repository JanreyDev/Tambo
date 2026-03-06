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
            ['record_type' => 'building', 'classification' => 'residential', 'owner_name' => 'Juan dela Cruz', 'address' => '123 Rizal St.', 'purok' => 'Purok 1 - Sampaguita', 'land_area_sqm' => 120.5, 'number_of_floors' => 2, 'building_material' => 'Concrete', 'year_constructed' => 2015, 'landmark_north' => 'Mercado residence', 'landmark_south' => 'Vacant lot'],
            ['record_type' => 'both', 'classification' => 'commercial', 'owner_name' => 'Roberto Reyes', 'address' => '210 Luna St.', 'purok' => 'Purok 4 - Gumamela', 'land_area_sqm' => 250.0, 'number_of_floors' => 3, 'building_material' => 'Concrete/Steel', 'year_constructed' => 2010, 'landmark_north' => 'Main road', 'landmark_south' => 'Creek'],
            ['record_type' => 'lot', 'classification' => 'residential', 'owner_name' => 'Eduardo Ramos', 'address' => '78 Mabini St.', 'purok' => 'Purok 3 - Ilang-Ilang', 'land_area_sqm' => 180.0, 'number_of_floors' => null, 'building_material' => null, 'year_constructed' => null, 'landmark_north' => 'Barangay Hall', 'landmark_south' => 'Basketball Court'],
            ['record_type' => 'building', 'classification' => 'residential', 'owner_name' => 'Danilo Pangilinan Jr.', 'address' => '200 Rizal St.', 'purok' => 'Purok 3 - Ilang-Ilang', 'land_area_sqm' => 95.0, 'number_of_floors' => 1, 'building_material' => 'Wood/Concrete', 'year_constructed' => 2005, 'landmark_north' => 'Water refilling station', 'landmark_south' => 'Ramos compound'],
            ['record_type' => 'building', 'classification' => 'institutional', 'owner_name' => 'Barangay Tambo', 'address' => '1 Aguinaldo St.', 'purok' => 'Purok 1 - Sampaguita', 'land_area_sqm' => 500.0, 'number_of_floors' => 2, 'building_material' => 'Concrete', 'year_constructed' => 2000, 'landmark_north' => 'Tambo Elementary School', 'landmark_south' => 'Multi-purpose court'],
        ];

        foreach ($records as $i => $data) {
            LotBuilding::create([
                'barangay_id' => $tambo->id,
                'record_number' => str_pad((string) ($i + 1), 6, '0', STR_PAD_LEFT),
                'record_type' => $data['record_type'],
                'classification' => $data['classification'],
                'owner_name' => $data['owner_name'],
                'owner_contact_number' => fake()->numerify('091########'),
                'address' => $data['address'],
                'purok' => $data['purok'],
                'street' => explode(' ', $data['address'], 2)[1] ?? '',
                'latitude' => 14.4793 + (fake()->randomFloat(4, -0.005, 0.005)),
                'longitude' => 121.0198 + (fake()->randomFloat(4, -0.005, 0.005)),
                'land_area_sqm' => $data['land_area_sqm'],
                'number_of_floors' => $data['number_of_floors'],
                'building_material' => $data['building_material'],
                'year_constructed' => $data['year_constructed'],
                'landmark_north' => $data['landmark_north'],
                'landmark_south' => $data['landmark_south'],
                'status' => 'active',
            ]);
        }
    }
}
