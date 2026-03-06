<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Admin\Barangay;
use App\Models\Tenant\Records\Establishment;
use Illuminate\Database\Seeder;

class EstablishmentSeeder extends Seeder
{
    public function run(): void
    {
        $tambo = Barangay::where('name', 'Tambo')->first();

        $establishments = [
            ['name' => 'Mang Pedring Sari-Sari Store', 'type' => 'retail', 'business_type' => 'Convenience Store', 'owner_name' => 'Pedro Mercado', 'owner_contact_number' => '09191234507', 'address' => '123 Rizal St.', 'purok' => 'Purok 1 - Sampaguita', 'employee_count' => 1],
            ['name' => 'Nelia\'s Carinderia', 'type' => 'food', 'business_type' => 'Food Service', 'owner_name' => 'Nelia Flores', 'owner_contact_number' => '09161234516', 'address' => '45 Bonifacio Ave.', 'purok' => 'Purok 2 - Rosal', 'employee_count' => 3],
            ['name' => 'JD Auto Repair Shop', 'type' => 'service', 'business_type' => 'Automotive Repair', 'owner_name' => 'Armando de los Santos', 'owner_contact_number' => '09151234511', 'address' => '78 Mabini St.', 'purok' => 'Purok 3 - Ilang-Ilang', 'employee_count' => 5],
            ['name' => 'Golden Harvest Hardware', 'type' => 'retail', 'business_type' => 'Hardware Store', 'owner_name' => 'Roberto Reyes', 'owner_contact_number' => '09201234503', 'address' => '210 Luna St.', 'purok' => 'Purok 4 - Gumamela', 'employee_count' => 8],
            ['name' => 'Tambo Pharmacy', 'type' => 'retail', 'business_type' => 'Pharmacy', 'owner_name' => 'Ana Bautista', 'owner_contact_number' => '09451234506', 'address' => '15 Del Pilar St.', 'purok' => 'Purok 1 - Sampaguita', 'employee_count' => 4],
            ['name' => 'SM Laundry Express', 'type' => 'service', 'business_type' => 'Laundry Service', 'owner_name' => 'Cynthia Santiago', 'owner_contact_number' => '09331234518', 'address' => '89 Quezon Blvd.', 'purok' => 'Purok 5 - Orchid', 'employee_count' => 2],
            ['name' => 'Bahay Kubo Eatery', 'type' => 'food', 'business_type' => 'Restaurant', 'owner_name' => 'Lorna Dizon', 'owner_contact_number' => '09281234508', 'address' => '156 Roxas St.', 'purok' => 'Purok 6 - Santan', 'employee_count' => 6],
            ['name' => 'Digital Hub Internet Cafe', 'type' => 'service', 'business_type' => 'Internet Cafe', 'owner_name' => 'Emmanuel Tolentino', 'owner_contact_number' => '09291234517', 'address' => '33 Magallanes St.', 'purok' => 'Purok 7 - Jasmine', 'employee_count' => 2],
            ['name' => 'Tambo Water Refilling Station', 'type' => 'retail', 'business_type' => 'Water Refilling', 'owner_name' => 'Danilo Pangilinan Jr.', 'owner_contact_number' => '09381234509', 'address' => '200 Rizal St.', 'purok' => 'Purok 3 - Ilang-Ilang', 'employee_count' => 3],
            ['name' => 'R&J Beauty Salon', 'type' => 'service', 'business_type' => 'Beauty Salon', 'owner_name' => 'Rosalinda Villanueva', 'owner_contact_number' => '09351234504', 'address' => '67 Bonifacio Ave.', 'purok' => 'Purok 2 - Rosal', 'employee_count' => 2],
        ];

        foreach ($establishments as $i => $data) {
            Establishment::create([
                'barangay_id' => $tambo->id,
                'establishment_number' => str_pad((string) ($i + 1), 6, '0', STR_PAD_LEFT),
                'name' => $data['name'],
                'type' => $data['type'],
                'business_type' => $data['business_type'],
                'owner_name' => $data['owner_name'],
                'owner_contact_number' => $data['owner_contact_number'],
                'contact_number' => $data['owner_contact_number'],
                'address' => $data['address'],
                'purok' => $data['purok'],
                'street' => explode(' ', $data['address'], 2)[1] ?? '',
                'latitude' => 14.4793 + (fake()->randomFloat(4, -0.005, 0.005)),
                'longitude' => 121.0198 + (fake()->randomFloat(4, -0.005, 0.005)),
                'employee_count' => $data['employee_count'],
                'status' => 'active',
            ]);
        }
    }
}
