<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('residents', function (Blueprint $table) {
            $table->date('senior_citizen_id_expiry')->nullable()->after('senior_citizen_id_encrypted');
            $table->text('solo_parent_id_encrypted')->nullable()->after('senior_citizen_id_expiry');
            $table->date('solo_parent_id_expiry')->nullable()->after('solo_parent_id_encrypted');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('residents', function (Blueprint $table) {
            $table->dropColumn([
                'senior_citizen_id_expiry',
                'solo_parent_id_encrypted',
                'solo_parent_id_expiry',
            ]);
        });
    }
};
