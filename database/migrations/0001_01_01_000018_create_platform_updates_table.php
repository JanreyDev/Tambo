<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migration 0018: Platform Updates ("What's New")
 *
 * Tracks all development changes, new features, bug fixes, and improvements.
 * Displayed as "What's New" widget on the dashboard for all users.
 * Every build/deployment logs entries here so barangay users see what changed.
 *
 * NOT tenant-scoped — these are platform-wide updates visible to all barangays.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_updates', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Categorization
            $table->string('type', 20); // feature, improvement, bugfix, security, maintenance
            $table->string('category', 50); // module affected: residents, documents, finance, etc.
            $table->string('version')->nullable(); // e.g., "5.0.1", "5.1.0"

            // Content
            $table->string('title'); // Short title: "New resident flag system"
            $table->text('description'); // Markdown description of the change
            $table->string('icon')->nullable(); // Lucide icon name for display
            $table->string('badge_color')->nullable(); // Hex color for the type badge

            // Visibility
            $table->boolean('is_published')->default(false); // Only published updates show to users
            $table->boolean('is_breaking')->default(false); // Breaking changes flagged prominently
            $table->timestamp('published_at')->nullable();

            // Metadata
            $table->string('commit_hash', 40)->nullable(); // Git commit reference
            $table->string('author')->default('Claude'); // Who made the change

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('is_published');
            $table->index('published_at');
            $table->index('type');
            $table->index('category');
        });

        // Also create sign_in_logs for login/logout monitoring
        Schema::create('sign_in_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('barangay_id')->nullable();

            $table->string('action', 20); // login, logout, failed_login, token_refresh
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->string('device_type', 20)->nullable(); // desktop, mobile, tablet
            $table->string('browser', 50)->nullable();
            $table->string('os', 50)->nullable();
            $table->string('location')->nullable(); // Approximate from IP (city, country)
            $table->jsonb('metadata')->nullable(); // Extra context

            $table->timestamp('created_at')->useCurrent();

            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('barangay_id')->references('id')->on('barangays')->nullOnDelete();

            // Indexes
            $table->index('user_id');
            $table->index('barangay_id');
            $table->index('action');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sign_in_logs');
        Schema::dropIfExists('platform_updates');
    }
};
