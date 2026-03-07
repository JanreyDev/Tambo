<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_users', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('email')->unique();
            $table->string('username')->unique();
            $table->string('password');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('photo_url')->nullable();
            $table->string('role')->default('admin');
            $table->string('status')->default('active');
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip')->nullable();
            $table->jsonb('preferences')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->index('status');
            $table->index('role');
        });

        // Self-referencing foreign keys must be added after table creation
        Schema::table('admin_users', function (Blueprint $table): void {
            $table->foreign('created_by')->references('id')->on('admin_users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('admin_users')->nullOnDelete();
            $table->foreign('deleted_by')->references('id')->on('admin_users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_users');
    }
};
