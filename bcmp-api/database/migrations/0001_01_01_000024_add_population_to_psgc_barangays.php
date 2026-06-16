<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('psgc_barangays', function (Blueprint $table) {
            $table->bigInteger('population')->nullable()->after('city_psgc');
            $table->smallInteger('population_year')->nullable()->after('population');
        });
    }

    public function down(): void
    {
        Schema::table('psgc_barangays', function (Blueprint $table) {
            $table->dropColumn(['population', 'population_year']);
        });
    }
};
