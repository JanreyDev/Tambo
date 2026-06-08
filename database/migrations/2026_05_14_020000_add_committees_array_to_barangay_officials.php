<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Replace single `committee` varchar with `committees` JSONB array.
 *
 * LGU reality: one official (especially Sangguniang Kagawads) often chairs multiple committees
 * — e.g., Peace and Order + Health + Appropriations.
 *
 * Also relaxes term_start/term_end to nullable: in practice many barangays only record
 * name + position; term dates are filled in later when needed (typically during election cycles).
 *
 * Backfill: existing `committee` string values are copied into the new `committees` array
 * as single-element arrays. The old column stays for now to avoid breaking any reader that
 * still references it; a future cleanup migration can drop it after all readers migrate.
 */
return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        Schema::table('barangay_officials', function (Blueprint $table) use ($driver) {
            // jsonb on Postgres; falls back to TEXT on SQLite (used by Pest tests). Model cast 'array' handles both.
            if ($driver === 'pgsql') {
                $table->jsonb('committees')->default('[]')->after('committee');
            } else {
                $table->json('committees')->default(json_encode([]))->after('committee');
            }
        });

        // Backfill: copy single committee values into the new array — Postgres only (SQLite test DB starts empty)
        if ($driver === 'pgsql') {
            DB::statement("
                UPDATE barangay_officials
                SET committees = jsonb_build_array(committee)
                WHERE committee IS NOT NULL
                  AND committee != ''
                  AND committees = '[]'::jsonb
            ");
        }

        // Relax term_start / term_end to nullable
        Schema::table('barangay_officials', function (Blueprint $table) {
            $table->date('term_start')->nullable()->change();
            $table->date('term_end')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('barangay_officials', function (Blueprint $table) {
            $table->date('term_start')->nullable(false)->change();
            $table->date('term_end')->nullable(false)->change();
            $table->dropColumn('committees');
        });
    }
};
