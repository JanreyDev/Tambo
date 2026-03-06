<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id')->nullable();
            $table->string('username', 100)->unique();
            $table->string('email', 255)->unique();
            $table->string('password', 255);
            $table->string('phone', 20)->nullable();
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('extension_name', 10)->nullable();
            $table->string('photo_url', 500)->nullable();
            $table->boolean('is_super_admin')->default(false);
            $table->timestampTz('last_login_at')->nullable();
            $table->string('last_login_ip', 45)->nullable();
            $table->timestampTz('email_verified_at')->nullable();
            $table->timestampTz('phone_verified_at')->nullable();
            $table->string('status', 20)->default('active');
            $table->jsonb('preferences')->default('{}');
            $table->rememberToken();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->nullOnDelete();
            $table->index('barangay_id');
            $table->index('status');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestampTz('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->uuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('login_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('barangay_id')->nullable();
            $table->string('ip_address', 45);
            $table->text('user_agent')->nullable();
            $table->string('action', 20); // login, logout, failed_login
            $table->jsonb('device_info')->nullable();
            $table->timestampTz('created_at');

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('barangay_id')->references('id')->on('barangays')->nullOnDelete();
            $table->index(['barangay_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_logs');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
