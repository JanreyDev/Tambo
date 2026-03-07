<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('admin_user_id')->nullable();
            $table->string('action');
            $table->string('resource_type')->nullable();
            $table->string('resource_id')->nullable();
            $table->text('description')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->foreign('admin_user_id')
                ->references('id')
                ->on('admin_users')
                ->nullOnDelete();

            $table->index('admin_user_id');
            $table->index('action');
            $table->index('created_at');
            $table->index('resource_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
