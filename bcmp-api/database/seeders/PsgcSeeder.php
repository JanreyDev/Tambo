<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Seed PSGC (Philippine Standard Geographic Code) reference tables.
 *
 * Data source: https://psgc.gitlab.io/api/ (mirrors official PSA publication)
 * ~17 regions, ~81 provinces, ~1,634 cities/municipalities, ~42,000 barangays
 *
 * The API returns two code formats per entity:
 *   - `code`: short hierarchical code (e.g. "0371" for Zambales)
 *   - `psgc10DigitCode`: full 10-digit PSGC (e.g. "0307100000")
 *
 * Child entities reference parents via the SHORT code (e.g. city.provinceCode = "0371").
 * We store psgc10DigitCode as PK, so we build short-code-to-psgc maps during seeding.
 *
 * Population data loaded separately from database/data/psgc_population.json if available.
 *
 * Usage: php artisan db:seed --class=PsgcSeeder
 * Idempotent — truncates and re-inserts all data.
 */
class PsgcSeeder extends Seeder
{
    private const API_BASE = 'https://psgc.gitlab.io/api';

    /** Maps: short code (padded to 10) -> psgc10DigitCode */
    private array $regionMap = [];

    private array $provinceMap = [];

    private array $cityMap = [];

    public function run(): void
    {
        $this->command->info('Fetching PSGC data from GitLab API...');

        DB::statement('TRUNCATE TABLE psgc_barangays CASCADE');
        DB::statement('TRUNCATE TABLE psgc_cities CASCADE');
        DB::statement('TRUNCATE TABLE psgc_provinces CASCADE');
        DB::statement('TRUNCATE TABLE psgc_regions CASCADE');

        $this->seedRegions();
        $this->seedProvinces();
        $this->seedCities();
        $this->fixNcrCascade();
        $this->seedBarangays();

        $this->loadPopulationData();

        $this->command->info('PSGC seeding complete!');
    }

    private function seedRegions(): void
    {
        $this->command->info('Seeding regions...');
        $regions = $this->fetchJson('/regions.json');

        $rows = [];
        foreach ($regions as $r) {
            $psgc = $r['psgc10DigitCode'] ?? str_pad((string) ($r['code'] ?? ''), 10, '0');
            $shortPadded = str_pad((string) ($r['code'] ?? ''), 10, '0');

            $this->regionMap[$shortPadded] = $psgc;

            $rows[] = [
                'psgc_code' => $psgc,
                'name' => $r['name'],
            ];
        }

        DB::table('psgc_regions')->insert($rows);
        $this->command->info('  '.count($rows).' regions seeded.');
    }

    private function seedProvinces(): void
    {
        $this->command->info('Seeding provinces...');
        $provinces = $this->fetchJson('/provinces.json');

        $rows = [];
        foreach ($provinces as $p) {
            $psgc = $p['psgc10DigitCode'] ?? str_pad((string) ($p['code'] ?? ''), 10, '0');
            $shortPadded = str_pad((string) ($p['code'] ?? ''), 10, '0');

            $this->provinceMap[$shortPadded] = $psgc;

            $regionRef = $p['regionCode'] ?? null;
            $regionPsgc = null;
            if ($regionRef) {
                $regionKey = str_pad((string) $regionRef, 10, '0');
                $regionPsgc = $this->regionMap[$regionKey] ?? $regionKey;
            }

            $rows[] = [
                'psgc_code' => $psgc,
                'name' => $p['name'],
                'region_psgc' => $regionPsgc,
            ];
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('psgc_provinces')->insert($chunk);
        }
        $this->command->info('  '.count($rows).' provinces seeded.');
    }

    private function seedCities(): void
    {
        $this->command->info('Seeding cities/municipalities...');
        $cities = $this->fetchJson('/cities-municipalities.json');

        $rows = [];
        foreach ($cities as $c) {
            $psgc = $c['psgc10DigitCode'] ?? str_pad((string) ($c['code'] ?? ''), 10, '0');
            $shortPadded = str_pad((string) ($c['code'] ?? ''), 10, '0');

            $this->cityMap[$shortPadded] = $psgc;

            $cityClass = null;
            if (isset($c['cityClass'])) {
                $cityClass = $c['cityClass'];
            } elseif (str_contains(strtolower($c['name'] ?? ''), 'city')) {
                $cityClass = 'city';
            } else {
                $cityClass = 'municipality';
            }

            $provRef = $c['provinceCode'] ?? null;
            $provPsgc = null;
            if ($provRef) {
                $provKey = str_pad((string) $provRef, 10, '0');
                $provPsgc = $this->provinceMap[$provKey] ?? $provKey;
            }

            $rows[] = [
                'psgc_code' => $psgc,
                'name' => $c['name'],
                'province_psgc' => $provPsgc,
                'city_class' => $cityClass,
            ];
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('psgc_cities')->insert($chunk);
        }
        $this->command->info('  '.count($rows).' cities/municipalities seeded.');
    }

    /**
     * NCR has no provinces in the PSGC standard -- cities sit directly under the region.
     * This breaks the Province → City cascade. Fix: insert "Metro Manila (NCR)" as a
     * virtual province and link all NCR cities to it.
     */
    private function fixNcrCascade(): void
    {
        $ncrProvinceCode = '1300000000';

        if (! DB::table('psgc_provinces')->where('psgc_code', $ncrProvinceCode)->exists()) {
            DB::table('psgc_provinces')->insert([
                'psgc_code' => $ncrProvinceCode,
                'name' => 'Metro Manila (NCR)',
                'region_psgc' => '1300000000',
            ]);
        }

        $updated = DB::table('psgc_cities')
            ->where('psgc_code', 'like', '13%')
            ->where(function ($q) {
                $q->whereNull('province_psgc')->orWhere('province_psgc', '');
            })
            ->update(['province_psgc' => $ncrProvinceCode]);

        $this->command->info("  NCR fix: linked {$updated} cities to Metro Manila province.");
    }

    private function seedBarangays(): void
    {
        $this->command->info('Seeding barangays (this may take a moment)...');
        $barangays = $this->fetchJson('/barangays.json');

        $rows = [];
        $batchCount = 0;

        foreach ($barangays as $b) {
            $muniCode = $b['municipalityCode'] ?? null;
            $cityCode = $b['cityCode'] ?? null;
            $parentRef = $muniCode ?: $cityCode;

            $cityPsgc = null;
            if ($parentRef) {
                $parentKey = str_pad((string) $parentRef, 10, '0');
                $cityPsgc = $this->cityMap[$parentKey] ?? $parentKey;
            }

            $rows[] = [
                'psgc_code' => $b['psgc10DigitCode'] ?? str_pad((string) ($b['code'] ?? ''), 10, '0'),
                'name' => $b['name'],
                'city_psgc' => $cityPsgc,
                'population' => null,
                'population_year' => null,
            ];

            if (count($rows) >= 500) {
                DB::table('psgc_barangays')->insert($rows);
                $batchCount += count($rows);
                $rows = [];
            }
        }

        if (count($rows) > 0) {
            DB::table('psgc_barangays')->insert($rows);
            $batchCount += count($rows);
        }

        $this->command->info("  {$batchCount} barangays seeded.");
    }

    /**
     * Load population data from a local JSON file if available.
     * File format: { "psgc_code": population, ... }
     */
    private function loadPopulationData(): void
    {
        $path = database_path('data/psgc_population.json');

        if (! file_exists($path)) {
            $this->command->warn('  No population data file found at database/data/psgc_population.json — skipping.');

            return;
        }

        $this->command->info('Loading population data...');
        $data = json_decode(file_get_contents($path), true);

        if (! is_array($data) || empty($data)) {
            $this->command->warn('  Population data file is empty or invalid.');

            return;
        }

        $updated = 0;
        foreach (array_chunk($data, 500, true) as $chunk) {
            foreach ($chunk as $code => $population) {
                $affected = DB::table('psgc_barangays')
                    ->where('psgc_code', (string) $code)
                    ->update([
                        'population' => (int) $population,
                        'population_year' => 2020,
                    ]);
                $updated += $affected;
            }
        }

        $this->command->info("  {$updated} barangays updated with population data.");
    }

    private function fetchJson(string $path): array
    {
        $url = self::API_BASE.$path;

        $response = Http::timeout(60)->get($url);

        if (! $response->successful()) {
            $this->command->error("Failed to fetch {$url}: HTTP {$response->status()}");
            Log::error('PsgcSeeder fetch failed', ['url' => $url, 'status' => $response->status()]);

            return [];
        }

        return $response->json() ?? [];
    }
}
