<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Widen house_block_lot to 255 chars (was 100)
        Schema::table('residents', function (Blueprint $table) {
            $table->string('house_block_lot', 255)->nullable()->change();
        });

        // 2. Merge subdivision_village data into house_block_lot
        DB::statement("
            UPDATE residents
            SET house_block_lot = CASE
                WHEN house_block_lot IS NOT NULL AND house_block_lot != '' AND subdivision_village IS NOT NULL AND subdivision_village != ''
                    THEN house_block_lot || ', ' || subdivision_village
                WHEN (house_block_lot IS NULL OR house_block_lot = '') AND subdivision_village IS NOT NULL AND subdivision_village != ''
                    THEN subdivision_village
                ELSE house_block_lot
            END
            WHERE subdivision_village IS NOT NULL AND subdivision_village != ''
        ");

        // 3. Drop subdivision_village
        Schema::table('residents', function (Blueprint $table) {
            $table->dropColumn('subdivision_village');
        });
    }

    public function down(): void
    {
        Schema::table('residents', function (Blueprint $table) {
            $table->string('subdivision_village', 255)->nullable()->after('street');
        });

        Schema::table('residents', function (Blueprint $table) {
            $table->string('house_block_lot', 100)->nullable()->change();
        });
    }
};
