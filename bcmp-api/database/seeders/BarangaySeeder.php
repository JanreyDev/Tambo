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
            'city_municipality' => 'Paranaque City',
            'province' => 'Metro Manila',
            'zip_code' => '1700',
            'contact_phone' => '(02) 8123-4567',
            'contact_email' => 'tambo@paranaque.gov.ph',
            'latitude' => 14.4793,
            'longitude' => 121.0198,
            'population' => 48527,
            'land_area_hectares' => 85.5,
            'officials_term' => '2023-2025',
            'status' => 'active',
            'subscription_plan' => 'gitna',
            'subscription_expires_at' => now()->endOfYear(),
            'sms_credit_balance' => 2450.00,
            'call_credit_balance' => 180.00,
            'map_credit_balance' => 500.00,
            'ai_credit_balance' => 1200.00,
            'storage_used_bytes' => 2516582400, // ~2.4 GB
            'storage_limit_bytes' => 15 * 1024 * 1024 * 1024, // 15 GB (gitna tier)
            'setup_complete' => false,
            'captain_name' => 'Hon. Juan Dela Cruz',
            'boundary_geojson' => [
                'type' => 'Polygon',
                'coordinates' => [[
                    [121.0140, 14.4830],
                    [121.0250, 14.4830],
                    [121.0260, 14.4760],
                    [121.0200, 14.4720],
                    [121.0140, 14.4750],
                    [121.0140, 14.4830],
                ]],
            ],
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
            'city_municipality' => 'Tarlac City',
            'province' => 'Tarlac',
            'zip_code' => '2300',
            'contact_phone' => '(045) 123-4567',
            'contact_email' => 'amucao@tarlaccity.gov.ph',
            'latitude' => 15.4389,
            'longitude' => 120.5980,
            'population' => 12890,
            'land_area_hectares' => 245.3,
            'officials_term' => '2023-2025',
            'status' => 'active',
            'subscription_plan' => 'munti',
            'subscription_expires_at' => now()->endOfYear(),
            'sms_credit_balance' => 850.00,
            'call_credit_balance' => 50.00,
            'map_credit_balance' => 200.00,
            'ai_credit_balance' => 400.00,
            'storage_used_bytes' => 536870912, // ~512 MB
            'storage_limit_bytes' => 5 * 1024 * 1024 * 1024, // 5 GB (munti tier)
            'settings' => [
                'timezone' => 'Asia/Manila',
                'date_format' => 'F j, Y',
                'currency' => 'PHP',
            ],
        ]);
    }
}
