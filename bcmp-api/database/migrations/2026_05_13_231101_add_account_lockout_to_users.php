<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Server-side account lockout state.
 *
 * Frontend-only lockout (sessionStorage) is bypassable by clearing storage. Server-side
 * lockout survives every client trick. After N failed attempts, the account is locked
 * for a configurable window — even with valid credentials, login is rejected with 423
 * Locked. Successful login resets the counter atomically.
 *
 * Defaults baked into AuthController:
 *   - 10 failed attempts in 15 minutes → 15-minute lock
 *   - last_failed_login_at lets us implement decay (e.g., wipe counter after 1hr clean)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->unsignedSmallInteger('failed_login_attempts')->default(0)->after('two_factor_recovery_codes');
            $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
            $table->timestamp('last_failed_login_at')->nullable()->after('locked_until');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->index('locked_until', 'users_locked_until_idx');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex('users_locked_until_idx');
            $table->dropColumn(['failed_login_attempts', 'locked_until', 'last_failed_login_at']);
        });
    }
};
