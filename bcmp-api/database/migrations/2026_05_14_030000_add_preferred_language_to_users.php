<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add preferred_language to users — per-account UI language preference.
 * Read on login, updated when user toggles in Settings → System Preferences.
 *
 * Without this column, the language preference is per-device (localStorage only),
 * which leaks one user's preference to the next user on shared devices and resets
 * when a clerk uses a different browser. Per RA 10173 & Principle 8 (Filipino-First),
 * personal preferences must be account-bound.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('preferred_language', 8)->default('en')->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('preferred_language');
        });
    }
};
