<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Admin\Barangay;
use App\Models\Tenant\Resident;
use Illuminate\Database\Seeder;

class ResidentSeeder extends Seeder
{
    public function run(): void
    {
        $tambo = Barangay::where('name', 'Tambo')->first();

        $puroks = ['Purok 1 - Sampaguita', 'Purok 2 - Rosal', 'Purok 3 - Ilang-Ilang', 'Purok 4 - Gumamela', 'Purok 5 - Orchid', 'Purok 6 - Santan', 'Purok 7 - Jasmine'];
        $streets = ['Rizal St.', 'Bonifacio Ave.', 'Mabini St.', 'Luna St.', 'Del Pilar St.', 'Aguinaldo St.', 'Quezon Blvd.', 'Roxas St.', 'Magallanes St.', 'Lapu-Lapu St.'];

        $residents = [
            ['first_name' => 'Juan', 'middle_name' => 'Santos', 'last_name' => 'dela Cruz', 'sex' => 'male', 'date_of_birth' => '1985-03-15', 'civil_status' => 'married', 'mobile_number' => '09171234501', 'occupation' => 'Driver', 'is_voter' => true, 'is_head_of_household' => true],
            ['first_name' => 'Maria', 'middle_name' => 'Garcia', 'last_name' => 'dela Cruz', 'sex' => 'female', 'date_of_birth' => '1988-07-22', 'civil_status' => 'married', 'mobile_number' => '09181234502', 'occupation' => 'Housewife', 'is_voter' => true, 'is_head_of_household' => false],
            ['first_name' => 'Roberto', 'middle_name' => 'Aquino', 'last_name' => 'Reyes', 'sex' => 'male', 'date_of_birth' => '1972-11-08', 'civil_status' => 'married', 'mobile_number' => '09201234503', 'occupation' => 'Electrician', 'is_voter' => true, 'is_head_of_household' => true],
            ['first_name' => 'Rosalinda', 'middle_name' => 'Mendoza', 'last_name' => 'Villanueva', 'sex' => 'female', 'date_of_birth' => '1990-01-30', 'civil_status' => 'single', 'mobile_number' => '09351234504', 'occupation' => 'Teacher', 'is_voter' => true, 'is_head_of_household' => false],
            ['first_name' => 'Eduardo', 'middle_name' => 'Torres', 'last_name' => 'Ramos', 'sex' => 'male', 'date_of_birth' => '1965-05-12', 'civil_status' => 'widowed', 'mobile_number' => '09271234505', 'occupation' => 'Retired', 'is_voter' => true, 'is_head_of_household' => true],
            ['first_name' => 'Ana', 'middle_name' => 'Lopez', 'last_name' => 'Bautista', 'sex' => 'female', 'date_of_birth' => '1995-09-18', 'civil_status' => 'single', 'mobile_number' => '09451234506', 'occupation' => 'Nurse', 'is_voter' => true, 'is_head_of_household' => false],
            ['first_name' => 'Pedro', 'middle_name' => 'Gonzales', 'last_name' => 'Mercado', 'sex' => 'male', 'date_of_birth' => '1978-12-25', 'civil_status' => 'married', 'mobile_number' => '09191234507', 'occupation' => 'Carpenter', 'is_voter' => true, 'is_head_of_household' => true],
            ['first_name' => 'Lorna', 'middle_name' => 'Fernandez', 'last_name' => 'Dizon', 'sex' => 'female', 'date_of_birth' => '1982-04-03', 'civil_status' => 'married', 'mobile_number' => '09281234508', 'occupation' => 'Vendor', 'is_voter' => true, 'is_head_of_household' => false],
            ['first_name' => 'Danilo', 'middle_name' => 'Castro', 'last_name' => 'Pangilinan', 'extension_name' => 'Jr.', 'sex' => 'male', 'date_of_birth' => '1958-08-14', 'civil_status' => 'married', 'mobile_number' => '09381234509', 'occupation' => 'Fisherman', 'is_voter' => true, 'is_head_of_household' => true],
            ['first_name' => 'Gloria', 'middle_name' => 'Santos', 'last_name' => 'Lim', 'sex' => 'female', 'date_of_birth' => '2000-02-28', 'civil_status' => 'single', 'mobile_number' => '09491234510', 'occupation' => 'Student', 'is_voter' => false, 'is_head_of_household' => false],
            ['first_name' => 'Armando', 'middle_name' => null, 'last_name' => 'de los Santos', 'sex' => 'male', 'date_of_birth' => '1970-06-20', 'civil_status' => 'separated', 'mobile_number' => '09151234511', 'occupation' => 'Mechanic', 'is_voter' => true, 'is_head_of_household' => true],
            ['first_name' => 'Teresita', 'middle_name' => 'Cruz', 'last_name' => 'Manalo', 'sex' => 'female', 'date_of_birth' => '1993-10-10', 'civil_status' => 'married', 'mobile_number' => '09261234512', 'occupation' => 'Barangay Health Worker', 'is_voter' => true, 'is_head_of_household' => false],
            ['first_name' => 'Francisco', 'middle_name' => 'Reyes', 'last_name' => 'Aquino', 'extension_name' => 'Sr.', 'sex' => 'male', 'date_of_birth' => '1945-01-01', 'civil_status' => 'widowed', 'mobile_number' => null, 'occupation' => 'Retired', 'is_voter' => true, 'is_head_of_household' => true],
            ['first_name' => 'Felicidad', 'middle_name' => 'David', 'last_name' => 'Navarro', 'sex' => 'female', 'date_of_birth' => '2005-11-15', 'civil_status' => 'single', 'mobile_number' => '09371234514', 'occupation' => 'Student', 'is_voter' => false, 'is_head_of_household' => false],
            ['first_name' => 'Rolando', 'middle_name' => 'Bautista', 'last_name' => 'Hernandez', 'sex' => 'male', 'date_of_birth' => '1987-07-04', 'civil_status' => 'married', 'mobile_number' => '09471234515', 'occupation' => 'Tricycle Driver', 'is_voter' => true, 'is_head_of_household' => true],
            ['first_name' => 'Nelia', 'middle_name' => 'Soriano', 'last_name' => 'Flores', 'sex' => 'female', 'date_of_birth' => '1975-03-08', 'civil_status' => 'married', 'mobile_number' => '09161234516', 'occupation' => 'Sari-sari Store Owner', 'is_voter' => true, 'is_head_of_household' => false],
            ['first_name' => 'Emmanuel', 'middle_name' => 'Villanueva', 'last_name' => 'Tolentino', 'sex' => 'male', 'date_of_birth' => '1999-12-31', 'civil_status' => 'single', 'mobile_number' => '09291234517', 'occupation' => 'IT Support', 'is_voter' => true, 'is_head_of_household' => false],
            ['first_name' => 'Cynthia', 'middle_name' => 'Ramos', 'last_name' => 'Santiago', 'sex' => 'female', 'date_of_birth' => '1968-09-25', 'civil_status' => 'married', 'mobile_number' => '09331234518', 'occupation' => 'Laundrywoman', 'is_voter' => true, 'is_head_of_household' => true],
            ['first_name' => 'Angelo', 'middle_name' => 'dela Rosa', 'last_name' => 'Pascual', 'sex' => 'male', 'date_of_birth' => '2002-08-19', 'civil_status' => 'single', 'mobile_number' => '09411234519', 'occupation' => 'Call Center Agent', 'is_voter' => true, 'is_head_of_household' => false],
            ['first_name' => 'Remedios', 'middle_name' => 'Gutierrez', 'last_name' => 'Ocampo', 'sex' => 'female', 'date_of_birth' => '1950-04-09', 'civil_status' => 'widowed', 'mobile_number' => null, 'occupation' => 'Retired', 'is_voter' => true, 'is_head_of_household' => true],
        ];

        foreach ($residents as $i => $data) {
            $number = str_pad((string) ($i + 1), 6, '0', STR_PAD_LEFT);
            $resident = Resident::create([
                'barangay_id' => $tambo->id,
                'resident_number' => $number,
                'registration_date' => fake()->dateTimeBetween('-3 years', 'now')->format('Y-m-d'),
                'first_name' => $data['first_name'],
                'middle_name' => $data['middle_name'],
                'last_name' => $data['last_name'],
                'extension_name' => $data['extension_name'] ?? null,
                'date_of_birth' => $data['date_of_birth'],
                'sex' => $data['sex'],
                'civil_status' => $data['civil_status'],
                'citizenship' => 'Filipino',
                'religion' => fake()->randomElement(['Roman Catholic', 'Iglesia ni Cristo', 'Protestant', 'Muslim', 'Born Again Christian']),
                'blood_type' => fake()->randomElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
                'mobile_number' => $data['mobile_number'],
                'purok' => $puroks[array_rand($puroks)],
                'street' => $streets[array_rand($streets)],
                'house_block_lot' => fake()->numberBetween(1, 500) . ' ' . fake()->randomElement(['Blk', 'Lot', '#']) . ' ' . fake()->numberBetween(1, 50),
                'zip_code' => '1700',
                'is_voter' => $data['is_voter'],
                'is_resident_voter' => $data['is_voter'],
                'voter_precinct_number' => $data['is_voter'] ? fake()->numerify('####A') : null,
                'occupation' => $data['occupation'],
                'highest_education' => fake()->randomElement(['Elementary', 'High School', 'Vocational', 'College', 'Post-Graduate']),
                'is_head_of_household' => $data['is_head_of_household'],
                'status' => 'active',
                'created_by' => null,
            ]);

            $resident->update([
                'profile_completion_pct' => $resident->calculateProfileCompletion(),
            ]);
        }
    }
}
