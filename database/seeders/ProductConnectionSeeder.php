<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ProductConnection;
use Illuminate\Database\Seeder;

class ProductConnectionSeeder extends Seeder
{
    /**
     * Seed default product connections with staging URLs.
     */
    public function run(): void
    {
        $connections = [
            [
                'product_slug' => 'bcmp',
                'product_name' => 'BCMP (Kapitan)',
                'api_base_url' => 'https://staging-api-bcmp.primex.ventures',
                'api_token' => 'placeholder-token-bcmp',
                'status' => 'active',
                'settings' => [
                    'description' => 'Barangay Comprehensive Management Platform',
                    'production_url' => 'https://api.kapitan.ph',
                ],
            ],
            [
                'product_slug' => 'lgmp',
                'product_name' => 'LGMP (Tarlac)',
                'api_base_url' => 'https://staging-api-lgmp.primex.ventures',
                'api_token' => 'placeholder-token-lgmp',
                'status' => 'active',
                'settings' => [
                    'description' => 'Local Government Management Platform',
                    'production_url' => 'https://api.tarlac.ph',
                ],
            ],
            [
                'product_slug' => 'pdmp',
                'product_name' => 'PDMP (Political Data)',
                'api_base_url' => 'https://staging-api-pdmp.primex.ventures',
                'api_token' => 'placeholder-token-pdmp',
                'status' => 'inactive',
                'settings' => [
                    'description' => 'Political Data Management Platform',
                    'production_url' => null,
                ],
            ],
            [
                'product_slug' => 'spacall',
                'product_name' => 'SPACALL',
                'api_base_url' => 'https://staging-api-spacall.primex.ventures',
                'api_token' => 'placeholder-token-spacall',
                'status' => 'active',
                'settings' => [
                    'description' => 'Wellness Booking Platform',
                    'production_url' => 'https://api.spacall.ph',
                ],
            ],
            [
                'product_slug' => 'barangaymo',
                'product_name' => 'Barangaymo',
                'api_base_url' => 'https://staging-api-barangaymo.primex.ventures',
                'api_token' => 'placeholder-token-barangaymo',
                'status' => 'active',
                'settings' => [
                    'description' => 'Barangay Management Platform (Lester Nadong)',
                    'production_url' => 'https://api.barangaymo.com',
                ],
            ],
        ];

        foreach ($connections as $connection) {
            ProductConnection::firstOrCreate(
                ['product_slug' => $connection['product_slug']],
                $connection,
            );
        }
    }
}
