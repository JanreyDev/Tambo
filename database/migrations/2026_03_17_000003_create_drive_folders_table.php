<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drive_folders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->uuid('user_id'); // owner
            $table->string('name', 255);
            $table->uuid('parent_id')->nullable(); // null = root
            $table->string('color', 20)->nullable(); // for UI
            $table->boolean('is_shared_with_barangay')->default(false);
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index('barangay_id');
            $table->index(['user_id', 'parent_id']);
        });

        // Extend files table: add drive-specific columns
        Schema::table('files', function (Blueprint $table) {
            $table->uuid('drive_folder_id')->nullable()->after('category');
            $table->uuid('drive_owner_id')->nullable()->after('drive_folder_id');
            $table->boolean('drive_shared_with_barangay')->default(false)->after('drive_owner_id');
            $table->foreign('drive_folder_id')->references('id')->on('drive_folders')->nullOnDelete();
            $table->foreign('drive_owner_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->dropColumn(['drive_folder_id', 'drive_owner_id', 'drive_shared_with_barangay']);
        });
        Schema::dropIfExists('drive_folders');
    }
};
