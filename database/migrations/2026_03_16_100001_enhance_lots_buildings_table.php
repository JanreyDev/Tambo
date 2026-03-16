<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lots_buildings', function (Blueprint $table) {
            // Add street (structured address, separate from exact_address)
            $table->string('street', 255)->nullable()->after('purok');

            // Add lot/block identifiers
            $table->string('lot_number', 100)->nullable()->after('exact_address');
            $table->string('block_number', 100)->nullable()->after('lot_number');

            // Property classification (residential, commercial, agricultural, etc.)
            // Different from `classification` which stores record type: lot_only, building_only, lot_and_building
            $table->string('property_classification', 100)->nullable()->after('block_number');

            // Building-specific fields
            $table->integer('number_of_floors')->nullable()->after('property_classification');
            $table->string('building_material', 255)->nullable()->after('number_of_floors');
            $table->integer('year_constructed')->nullable()->after('building_material');

            // Financial / assessment
            $table->decimal('assessed_value', 14, 2)->nullable()->after('year_constructed');
            $table->decimal('market_value', 14, 2)->nullable()->after('assessed_value');
        });
    }

    public function down(): void
    {
        Schema::table('lots_buildings', function (Blueprint $table) {
            $table->dropColumn([
                'street',
                'lot_number',
                'block_number',
                'property_classification',
                'number_of_floors',
                'building_material',
                'year_constructed',
                'assessed_value',
                'market_value',
            ]);
        });
    }
};
