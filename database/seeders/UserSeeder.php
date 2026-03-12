<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Admin\Barangay;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $tambo = Barangay::where('name', 'Tambo')->first();
        $amucao = Barangay::where('name', 'Amucao')->first();

        // Super Admin (PrimeX)
        $superAdmin = User::create([
            'username' => 'primex_admin',
            'email' => 'admin@primex.ventures',
            'password' => Hash::make('PrimeX@2026!'),
            'first_name' => 'PrimeX',
            'last_name' => 'Admin',
            'status' => 'active',
        ]);
        // Set explicitly (excluded from $fillable for security)
        $superAdmin->is_super_admin = true;
        $superAdmin->save();

        // Tambo Barangay Users
        $kapitanTambo = User::create([
            'barangay_id' => $tambo->id,
            'username' => 'kap_tambo',
            'email' => 'kapitan@tambo.paranaque.gov.ph',
            'password' => Hash::make('Tambo@2026!'),
            'first_name' => 'Ricardo',
            'last_name' => 'Santos',
            'middle_name' => 'dela Cruz',
            'phone' => '09171234567',
            'status' => 'active',
        ]);
        $kapitanTambo->assignRole('kapitan');

        $secretaryTambo = User::create([
            'barangay_id' => $tambo->id,
            'username' => 'sec_tambo',
            'email' => 'secretary@tambo.paranaque.gov.ph',
            'password' => Hash::make('Tambo@2026!'),
            'first_name' => 'Maria',
            'last_name' => 'Reyes',
            'middle_name' => 'Garcia',
            'phone' => '09189876543',
            'status' => 'active',
        ]);
        $secretaryTambo->assignRole('secretary');

        $treasurerTambo = User::create([
            'barangay_id' => $tambo->id,
            'username' => 'tres_tambo',
            'email' => 'treasurer@tambo.paranaque.gov.ph',
            'password' => Hash::make('Tambo@2026!'),
            'first_name' => 'Jose',
            'last_name' => 'Mendoza',
            'phone' => '09201234567',
            'status' => 'active',
        ]);
        $treasurerTambo->assignRole('treasurer');

        $kagawadTambo = User::create([
            'barangay_id' => $tambo->id,
            'username' => 'kag_tambo',
            'email' => 'kagawad1@tambo.paranaque.gov.ph',
            'password' => Hash::make('Tambo@2026!'),
            'first_name' => 'Pedro',
            'last_name' => 'Villanueva',
            'phone' => '09351234567',
            'status' => 'active',
        ]);
        $kagawadTambo->assignRole('kagawad');

        $staffTambo = User::create([
            'barangay_id' => $tambo->id,
            'username' => 'staff_tambo',
            'email' => 'staff@tambo.paranaque.gov.ph',
            'password' => Hash::make('Tambo@2026!'),
            'first_name' => 'Ana',
            'last_name' => 'Lopez',
            'phone' => '09451234567',
            'status' => 'active',
        ]);
        $staffTambo->assignRole('staff');

        // Amucao Barangay Users
        $kapitanAmucao = User::create([
            'barangay_id' => $amucao->id,
            'username' => 'kap_amucao',
            'email' => 'kapitan@amucao.tarlac.gov.ph',
            'password' => Hash::make('Amucao@2026!'),
            'first_name' => 'Roberto',
            'last_name' => 'Cruz',
            'middle_name' => 'Manalo',
            'phone' => '09271234567',
            'status' => 'active',
        ]);
        $kapitanAmucao->assignRole('kapitan');

        $secretaryAmucao = User::create([
            'barangay_id' => $amucao->id,
            'username' => 'sec_amucao',
            'email' => 'secretary@amucao.tarlac.gov.ph',
            'password' => Hash::make('Amucao@2026!'),
            'first_name' => 'Carmen',
            'last_name' => 'Gonzales',
            'phone' => '09381234567',
            'status' => 'active',
        ]);
        $secretaryAmucao->assignRole('secretary');
    }
}
