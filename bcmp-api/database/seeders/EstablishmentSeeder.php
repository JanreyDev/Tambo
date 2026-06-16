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
            ['business_name' => 'Mang Pedring Sari-Sari Store', 'business_type' => 'Convenience Store', 'owner_name' => 'Pedro Mercado', 'owner_contact' => '09191234507', 'address' => '123 Rizal St.', 'purok' => 'Purok 1 - Sampaguita'],
            ['business_name' => 'Nelia\'s Carinderia', 'business_type' => 'Food Service', 'owner_name' => 'Nelia Flores', 'owner_contact' => '09161234516', 'address' => '45 Bonifacio Ave.', 'purok' => 'Purok 2 - Rosal'],
            ['business_name' => 'JD Auto Repair Shop', 'business_type' => 'Automotive Repair', 'owner_name' => 'Armando de los Santos', 'owner_contact' => '09151234511', 'address' => '78 Mabini St.', 'purok' => 'Purok 3 - Ilang-Ilang'],
            ['business_name' => 'Golden Harvest Hardware', 'business_type' => 'Hardware Store', 'owner_name' => 'Roberto Reyes', 'owner_contact' => '09201234503', 'address' => '210 Luna St.', 'purok' => 'Purok 4 - Gumamela'],
            ['business_name' => 'Tambo Pharmacy', 'business_type' => 'Pharmacy', 'owner_name' => 'Ana Bautista', 'owner_contact' => '09451234506', 'address' => '15 Del Pilar St.', 'purok' => 'Purok 1 - Sampaguita'],
            ['business_name' => 'SM Laundry Express', 'business_type' => 'Laundry Service', 'owner_name' => 'Cynthia Santiago', 'owner_contact' => '09331234518', 'address' => '89 Quezon Blvd.', 'purok' => 'Purok 5 - Orchid'],
            ['business_name' => 'Bahay Kubo Eatery', 'business_type' => 'Restaurant', 'owner_name' => 'Lorna Dizon', 'owner_contact' => '09281234508', 'address' => '156 Roxas St.', 'purok' => 'Purok 6 - Santan'],
            ['business_name' => 'Digital Hub Internet Cafe', 'business_type' => 'Internet Cafe', 'owner_name' => 'Emmanuel Tolentino', 'owner_contact' => '09291234517', 'address' => '33 Magallanes St.', 'purok' => 'Purok 7 - Jasmine'],
            ['business_name' => 'Tambo Water Refilling Station', 'business_type' => 'Water Refilling', 'owner_name' => 'Danilo Pangilinan Jr.', 'owner_contact' => '09381234509', 'address' => '200 Rizal St.', 'purok' => 'Purok 3 - Ilang-Ilang'],
            ['business_name' => 'R&J Beauty Salon', 'business_type' => 'Beauty Salon', 'owner_name' => 'Rosalinda Villanueva', 'owner_contact' => '09351234504', 'address' => '67 Bonifacio Ave.', 'purok' => 'Purok 2 - Rosal'],
        ];

        foreach ($establishments as $i => $data) {
            Establishment::create([
                'barangay_id' => $tambo->id,
                'establishment_number' => str_pad((string) ($i + 1), 6, '0', STR_PAD_LEFT),
                'business_name' => $data['business_name'],
                'business_type' => $data['business_type'],
                'owner_name' => $data['owner_name'],
                'owner_contact' => $data['owner_contact'],
                'exact_address' => $data['address'],
                'purok' => $data['purok'],
                'street' => explode(' ', $data['address'], 2)[1] ?? '',
                'latitude' => 14.4793 + (fake()->randomFloat(4, -0.005, 0.005)),
                'longitude' => 121.0198 + (fake()->randomFloat(4, -0.005, 0.005)),
                'status' => 'active',
            ]);
        }
    }
}
