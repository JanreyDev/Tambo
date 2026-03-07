<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_connections', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('product_slug')->unique();
            $table->string('product_name');
            $table->string('api_base_url');
            $table->text('api_token');
            $table->string('status')->default('active');
            $table->timestamp('last_health_check_at')->nullable();
            $table->string('last_health_status')->nullable();
            $table->jsonb('settings')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_connections');
    }
};
