<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add cooldown + 2FA columns to users
        Schema::table('users', function (Blueprint $table) {
            $table->timestampTz('username_changed_at')->nullable()->after('preferences');
            $table->timestampTz('password_changed_at')->nullable()->after('username_changed_at');
            $table->text('two_factor_secret')->nullable()->after('password_changed_at');
            $table->timestampTz('two_factor_confirmed_at')->nullable()->after('two_factor_secret');
            $table->text('two_factor_recovery_codes')->nullable()->after('two_factor_confirmed_at');
        });

        // Add device tracking to Sanctum personal_access_tokens
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->string('ip_address', 45)->nullable()->after('abilities');
            $table->jsonb('device_info')->nullable()->after('ip_address');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'username_changed_at',
                'password_changed_at',
                'two_factor_secret',
                'two_factor_confirmed_at',
                'two_factor_recovery_codes',
            ]);
        });

        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropColumn(['ip_address', 'device_info']);
        });
    }
};
