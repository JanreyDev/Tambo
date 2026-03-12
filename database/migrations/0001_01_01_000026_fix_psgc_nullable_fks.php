<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
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
        // Drop FK constraints (SQLite ignores FKs by default, so wrap in try)
        try {
            Schema::table('psgc_provinces', function (Blueprint $table) {
                $table->dropForeign(['region_psgc']);
            });
            Schema::table('psgc_cities', function (Blueprint $table) {
                $table->dropForeign(['province_psgc']);
            });
            Schema::table('psgc_barangays', function (Blueprint $table) {
                $table->dropForeign(['city_psgc']);
            });
        } catch (\Exception) {
            // SQLite doesn't support dropping foreign keys
        }

        // Make parent columns nullable
        Schema::table('psgc_provinces', function (Blueprint $table) {
            $table->string('region_psgc')->nullable()->change();
        });
        Schema::table('psgc_cities', function (Blueprint $table) {
            $table->string('province_psgc')->nullable()->change();
        });
        Schema::table('psgc_barangays', function (Blueprint $table) {
            $table->string('city_psgc')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('psgc_provinces', function (Blueprint $table) {
            $table->string('region_psgc')->nullable(false)->change();
            $table->foreign('region_psgc')->references('psgc_code')->on('psgc_regions');
        });
        Schema::table('psgc_cities', function (Blueprint $table) {
            $table->string('province_psgc')->nullable(false)->change();
            $table->foreign('province_psgc')->references('psgc_code')->on('psgc_provinces');
        });
        Schema::table('psgc_barangays', function (Blueprint $table) {
            $table->string('city_psgc')->nullable(false)->change();
            $table->foreign('city_psgc')->references('psgc_code')->on('psgc_cities');
        });
    }
};
