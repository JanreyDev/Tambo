<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('files', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id')->nullable();
            $table->string('original_name', 255);
            $table->string('stored_name', 255);
            $table->string('mime_type', 100);
            $table->bigInteger('size_bytes');
            $table->string('storage_path', 500);
            $table->string('storage_bucket', 100);
            $table->uuid('uploaded_by')->nullable();
            $table->string('category', 50); // photo, document, signature, thumbmark, attachment, seal, template_border
            $table->boolean('is_public')->default(false);
            $table->jsonb('metadata')->nullable();
            $table->timestampTz('created_at');
            $table->softDeletesTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->nullOnDelete();
            $table->foreign('uploaded_by')->references('id')->on('users')->nullOnDelete();
            $table->index('barangay_id');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};
