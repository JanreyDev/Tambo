<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('psgc_regions', function (Blueprint $table) {
            $table->string('psgc_code', 10)->primary();
            $table->string('name', 255);
        });

        Schema::create('psgc_provinces', function (Blueprint $table) {
            $table->string('psgc_code', 10)->primary();
            $table->string('name', 255);
            $table->string('region_psgc', 10)->index();
            $table->foreign('region_psgc')->references('psgc_code')->on('psgc_regions');
        });

        Schema::create('psgc_cities', function (Blueprint $table) {
            $table->string('psgc_code', 10)->primary();
            $table->string('name', 255);
            $table->string('province_psgc', 10)->index();
            $table->string('city_class', 20)->nullable(); // city, municipality
            $table->foreign('province_psgc')->references('psgc_code')->on('psgc_provinces');
        });

        Schema::create('psgc_barangays', function (Blueprint $table) {
            $table->string('psgc_code', 10)->primary();
            $table->string('name', 255);
            $table->string('city_psgc', 10)->index();
            $table->foreign('city_psgc')->references('psgc_code')->on('psgc_cities');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('psgc_barangays');
        Schema::dropIfExists('psgc_cities');
        Schema::dropIfExists('psgc_provinces');
        Schema::dropIfExists('psgc_regions');
    }
};
