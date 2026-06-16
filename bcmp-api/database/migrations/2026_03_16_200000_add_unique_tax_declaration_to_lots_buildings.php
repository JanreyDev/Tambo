<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lots_buildings', function (Blueprint $table) {
            // Unique per barangay — PostgreSQL skips NULL values in unique indexes
            // so records without a TD# can still coexist freely
            $table->unique(
                ['barangay_id', 'tax_declaration_number'],
                'lots_buildings_barangay_td_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('lots_buildings', function (Blueprint $table) {
            $table->dropUnique('lots_buildings_barangay_td_unique');
        });
    }
};
