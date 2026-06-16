<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add a human-readable name column to feature_flags.
 *
 * The key column is the machine identifier (e.g., 'mabini-ai').
 * The name column is the display label (e.g., 'Mabini AI Assistant').
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feature_flags', function (Blueprint $table) {
            $table->string('name', 255)->after('key')->default('');
        });

        // Backfill names for existing flags
        $names = [
            'mabini-ai' => 'Mabini AI Assistant',
            'marketplace' => 'Barangay Marketplace',
            'offline-mode' => 'Offline Mode (PWA)',
            'kabataan' => 'kabataan.ph (SK/Youth)',
        ];

        foreach ($names as $key => $name) {
            \DB::table('feature_flags')
                ->where('key', $key)
                ->update(['name' => $name]);
        }
    }

    public function down(): void
    {
        Schema::table('feature_flags', function (Blueprint $table) {
            $table->dropColumn('name');
        });
    }
};
