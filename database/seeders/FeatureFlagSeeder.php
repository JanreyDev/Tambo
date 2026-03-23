<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Platform\FeatureFlag;
use Illuminate\Database\Seeder;

class FeatureFlagSeeder extends Seeder
{
    public function run(): void
    {
        $flags = [
            [
                'key' => 'mabini-ai',
                'name' => 'Mabini AI Assistant',
                'description' => 'Mabini AI assistant — natural language search, auto-classification, document generation.',
                'enabled' => true,
                'tenant_id' => null,
                'metadata' => null,
                'remove_after' => null,
            ],
            [
                'key' => 'marketplace',
                'name' => 'Barangay Marketplace',
                'description' => 'Barangay marketplace — product catalog, cart, orders.',
                'enabled' => true,
                'tenant_id' => null,
                'metadata' => null,
                'remove_after' => null,
            ],
            [
                'key' => 'offline-mode',
                'name' => 'Offline Mode (PWA)',
                'description' => 'Offline-capable PWA with IndexedDB sync. Census Mode, blotter logging, document viewing.',
                'enabled' => false,
                'tenant_id' => null,
                'metadata' => ['target_release' => 'Q3 2026'],
                'remove_after' => null,
            ],
            [
                'key' => 'census-mode',
                'name' => 'Census Mode',
                'description' => 'Offline census data collection with IndexedDB queue and background sync on reconnect.',
                'enabled' => true,
                'tenant_id' => null,
                'metadata' => null,
                'remove_after' => null,
            ],
            [
                'key' => 'kabataan',
                'name' => 'kabataan.ph (SK/Youth)',
                'description' => 'kabataan.ph — SK/youth management module (age 15-30).',
                'enabled' => false,
                'tenant_id' => null,
                'metadata' => ['target_release' => 'Q4 2026'],
                'remove_after' => null,
            ],
        ];

        foreach ($flags as $flag) {
            FeatureFlag::updateOrCreate(
                ['key' => $flag['key'], 'tenant_id' => $flag['tenant_id']],
                $flag,
            );
        }
    }
}
