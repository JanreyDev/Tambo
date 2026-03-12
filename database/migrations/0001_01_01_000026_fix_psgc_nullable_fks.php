<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fix PSGC reference tables: make parent codes nullable and drop FKs.
 *
 * The PSGC API has mismatched codes (e.g. BARMM provinces reference
 * region code 15 but the region's psgc10DigitCode starts with 19).
 * Independent component cities (like City of Isabela) have no province.
 * Dropping FKs and allowing NULLs lets us store all PSGC data correctly.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Drop FK constraints
        Schema::table('psgc_provinces', function ($table) {
            $table->dropForeign(['region_psgc']);
        });
        Schema::table('psgc_cities', function ($table) {
            $table->dropForeign(['province_psgc']);
        });
        Schema::table('psgc_barangays', function ($table) {
            $table->dropForeign(['city_psgc']);
        });

        // Make parent columns nullable
        DB::statement('ALTER TABLE psgc_provinces ALTER COLUMN region_psgc DROP NOT NULL');
        DB::statement('ALTER TABLE psgc_cities ALTER COLUMN province_psgc DROP NOT NULL');
        DB::statement('ALTER TABLE psgc_barangays ALTER COLUMN city_psgc DROP NOT NULL');
    }

    public function down(): void
    {
        // Re-add NOT NULL (will fail if NULLs exist)
        DB::statement('ALTER TABLE psgc_provinces ALTER COLUMN region_psgc SET NOT NULL');
        DB::statement('ALTER TABLE psgc_cities ALTER COLUMN province_psgc SET NOT NULL');
        DB::statement('ALTER TABLE psgc_barangays ALTER COLUMN city_psgc SET NOT NULL');

        // Re-add FKs
        Schema::table('psgc_provinces', function ($table) {
            $table->foreign('region_psgc')->references('psgc_code')->on('psgc_regions');
        });
        Schema::table('psgc_cities', function ($table) {
            $table->foreign('province_psgc')->references('psgc_code')->on('psgc_provinces');
        });
        Schema::table('psgc_barangays', function ($table) {
            $table->foreign('city_psgc')->references('psgc_code')->on('psgc_cities');
        });
    }
};
