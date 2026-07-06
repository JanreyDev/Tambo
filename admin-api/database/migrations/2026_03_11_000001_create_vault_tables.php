<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Vault auth sessions (separate from founder_sessions, different TTL/no idle timeout).
        Schema::create('vault_sessions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('token_hash', 64);
            $table->string('ip_address', 45);
            $table->text('user_agent');
            $table->timestamp('expires_at');
            $table->timestamp('last_activity_at');
            $table->timestamp('created_at');

            $table->index('token_hash');
            $table->index('expires_at');
        });

        // Vault content entries -- encrypted at rest via Laravel Crypt.
        Schema::create('vault_entries', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('category', 50);
            $table->string('title', 255);
            $table->text('content_encrypted');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->jsonb('metadata')->nullable();
            $table->timestamp('created_at');
            $table->timestamp('updated_at');

            $table->index('category');
            $table->index(['category', 'sort_order']);
            $table->index('is_active');
        });

        // Vault access audit log (immutable -- who accessed what, when).
        Schema::create('vault_access_logs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('vault_session_id')->nullable();
            $table->string('action', 50);
            $table->string('resource_type', 50)->nullable();
            $table->string('resource_id', 50)->nullable();
            $table->string('ip_address', 45);
            $table->text('user_agent');
            $table->jsonb('metadata')->nullable();
            $table->timestamp('created_at');

            $table->index('created_at');
            $table->index('action');
            $table->index('vault_session_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vault_access_logs');
        Schema::dropIfExists('vault_entries');
        Schema::dropIfExists('vault_sessions');
    }
};
