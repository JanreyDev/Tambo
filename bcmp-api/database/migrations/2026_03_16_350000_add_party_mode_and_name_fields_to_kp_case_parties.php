<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kp_case_parties', function (Blueprint $table) {
            // Individual vs group distinction
            $table->string('party_mode', 20)->default('individual')->after('party_type'); // individual, group

            // Name fields for individual mode
            $table->string('first_name', 100)->nullable()->after('party_mode');
            $table->string('middle_name', 100)->nullable()->after('first_name');
            $table->string('last_name', 100)->nullable()->after('middle_name');
        });

        // full_name column stays — for individual it stores derived "FIRST [MIDDLE] LAST",
        // for group it stores the raw comma-separated names (e.g. "JUAN SANTOS, MARIA DELA CRUZ, et al.")
    }

    public function down(): void
    {
        Schema::table('kp_case_parties', function (Blueprint $table) {
            $table->dropColumn(['party_mode', 'first_name', 'middle_name', 'last_name']);
        });
    }
};
