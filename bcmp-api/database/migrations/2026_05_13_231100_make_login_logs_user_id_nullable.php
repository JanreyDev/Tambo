<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Make login_logs.user_id nullable + capture attempted_username for forensic visibility.
 *
 * Why: failed-login attempts against UNKNOWN usernames (credential-stuffing probes,
 * reconnaissance) were silently dropped because the FK constraint required a real
 * user_id. The most-important forensic signal was being lost. After this migration,
 * every failed attempt is audited regardless of whether the username resolved.
 *
 * Indexes added so threat-hunting queries against (ip, time) and (attempted_username, time)
 * stay fast at scale.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('login_logs', function (Blueprint $table): void {
            $table->uuid('user_id')->nullable()->change();
            $table->string('attempted_username', 64)->nullable()->after('user_id');
        });

        Schema::table('login_logs', function (Blueprint $table): void {
            $table->index(['ip_address', 'created_at'], 'login_logs_ip_created_idx');
            $table->index(['attempted_username', 'created_at'], 'login_logs_attempted_created_idx');
            $table->index(['action', 'created_at'], 'login_logs_action_created_idx');
        });
    }

    public function down(): void
    {
        Schema::table('login_logs', function (Blueprint $table): void {
            $table->dropIndex('login_logs_ip_created_idx');
            $table->dropIndex('login_logs_attempted_created_idx');
            $table->dropIndex('login_logs_action_created_idx');
            $table->dropColumn('attempted_username');
        });

        // Reverting user_id to NOT NULL would orphan any unknown-username rows.
        // Down migration intentionally leaves user_id nullable — re-applying up is safe.
    }
};
