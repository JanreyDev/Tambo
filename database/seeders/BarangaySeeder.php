<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Admin\Barangay;
use Illuminate\Database\Seeder;

class BarangaySeeder extends Seeder
{
    public function run(): void
    {
        Barangay::create([
            'psgc_code' => '137604024',
            'name' => 'Tambo',
            'municipality_psgc' => '137604',
            'province_psgc' => '1376',
            'region_psgc' => '13',
            'full_address' => 'Barangay Tambo, Paranaque City, Metro Manila',
            'contact_phone' => '(02) 8123-4567',
            'contact_email' => 'tambo@paranaque.gov.ph',
            'latitude' => 14.4793,
            'longitude' => 121.0198,
            'population' => 48527,
            'land_area_hectares' => 85.5,
            'officials_term' => '2023-2025',
            'status' => 'active',
            'subscription_plan' => 'professional',
            'subscription_expires_at' => now()->addYear(),
            'sms_credit_balance' => 2450.00,
            'call_credit_balance' => 180.00,
            'map_credit_balance' => 500.00,
            'ai_credit_balance' => 1200.00,
            'storage_used_bytes' => 2516582400, // ~2.4 GB
            'storage_limit_bytes' => 5368709120, // 5 GB
            'settings' => [
                'timezone' => 'Asia/Manila',
                'date_format' => 'F j, Y',
                'currency' => 'PHP',
                'auto_approve_documents' => false,
                'require_photo_on_registration' => false,
            ],
        ]);

        Barangay::create([
            'psgc_code' => '037101001',
            'name' => 'Amucao',
            'municipality_psgc' => '037101',
            'province_psgc' => '0371',
            'region_psgc' => '03',
            'full_address' => 'Barangay Amucao, Tarlac City, Tarlac',
            'contact_phone' => '(045) 123-4567',
            'contact_email' => 'amucao@tarlaccity.gov.ph',
            'latitude' => 15.4389,
            'longitude' => 120.5980,
            'population' => 12890,
            'land_area_hectares' => 245.3,
            'officials_term' => '2023-2025',
            'status' => 'active',
            'subscription_plan' => 'basic',
            'subscription_expires_at' => now()->addMonths(6),
            'sms_credit_balance' => 850.00,
            'call_credit_balance' => 50.00,
            'map_credit_balance' => 200.00,
            'ai_credit_balance' => 400.00,
            'storage_used_bytes' => 536870912, // ~512 MB
            'storage_limit_bytes' => 2147483648, // 2 GB
            'settings' => [
                'timezone' => 'Asia/Manila',
                'date_format' => 'F j, Y',
                'currency' => 'PHP',
            ],
        ]);
    }
}
