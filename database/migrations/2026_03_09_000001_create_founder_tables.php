<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('founder_sessions', function (Blueprint $table): void {
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

        Schema::create('infrastructure_snapshots', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('snapshot_type', 50);
            $table->jsonb('data');
            $table->timestamp('fetched_at');
            $table->timestamp('created_at');

            $table->index(['snapshot_type', 'fetched_at']);
        });

        Schema::create('system_alerts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('severity', 20);
            $table->string('source', 50);
            $table->string('title', 255);
            $table->text('description');
            $table->jsonb('metadata')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('telegram_sent_at')->nullable();
            $table->timestamp('created_at');

            $table->index('created_at');
            $table->index('severity');
            $table->index('source');
        });

        // Partial index on unresolved alerts (PostgreSQL-specific).
        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                'CREATE INDEX system_alerts_unresolved_idx ON system_alerts (created_at DESC) WHERE resolved_at IS NULL'
            );
        }

        Schema::create('metric_snapshots', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->bigInteger('droplet_id');
            $table->decimal('cpu_percent', 5, 2);
            $table->decimal('memory_percent', 5, 2);
            $table->decimal('disk_percent', 5, 2);
            $table->bigInteger('bandwidth_in')->default(0);
            $table->bigInteger('bandwidth_out')->default(0);
            $table->timestamp('recorded_at');

            $table->index(['droplet_id', 'recorded_at']);
        });

        Schema::create('mabini_conversations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->jsonb('messages')->default('[]');
            $table->jsonb('context')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mabini_conversations');
        Schema::dropIfExists('metric_snapshots');
        Schema::dropIfExists('system_alerts');
        Schema::dropIfExists('infrastructure_snapshots');
        Schema::dropIfExists('founder_sessions');
    }
};
