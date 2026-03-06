<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barangay_posts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('title', 255);
            $table->text('content')->nullable();
            $table->string('category', 50)->default('announcement');
            $table->uuid('cover_image_file_id')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->timestampTz('published_at')->nullable();
            $table->string('status', 20)->default('draft');
            $table->uuid('author_id')->nullable();
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('cover_image_file_id')->references('id')->on('files')->nullOnDelete();
            $table->foreign('author_id')->references('id')->on('users')->nullOnDelete();
            $table->index('barangay_id');
            $table->index(['barangay_id', 'status', 'published_at']);
        });

        Schema::create('public_document_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('request_number', 50)->unique();
            $table->string('requester_name', 200);
            $table->string('requester_phone', 20)->nullable();
            $table->string('requester_email', 255)->nullable();
            $table->uuid('requester_resident_id')->nullable();
            $table->string('document_type', 100);
            $table->text('purpose')->nullable();
            $table->string('delivery_method', 20)->default('pickup');
            $table->string('status', 30)->default('submitted');
            $table->date('estimated_date')->nullable();
            $table->decimal('fee_amount', 10, 2)->nullable();
            $table->string('payment_status', 20)->default('pending');
            $table->uuid('issued_document_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('requester_resident_id')->references('id')->on('residents')->nullOnDelete();
            $table->foreign('issued_document_id')->references('id')->on('issued_documents')->nullOnDelete();
            $table->index('barangay_id');
            $table->index(['barangay_id', 'status']);
        });

        Schema::create('public_complaints', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('complaint_number', 50)->unique();
            $table->string('complainant_name', 200);
            $table->string('complainant_phone', 20)->nullable();
            $table->string('complainant_email', 255)->nullable();
            $table->uuid('complainant_resident_id')->nullable();
            $table->string('subject', 255);
            $table->text('description');
            $table->string('category', 50)->default('other');
            $table->string('location', 255)->nullable();
            $table->jsonb('attachment_file_ids')->nullable();
            $table->uuid('assigned_to_id')->nullable();
            $table->text('resolution')->nullable();
            $table->string('status', 30)->default('submitted');
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('complainant_resident_id')->references('id')->on('residents')->nullOnDelete();
            $table->foreign('assigned_to_id')->references('id')->on('users')->nullOnDelete();
            $table->index('barangay_id');
            $table->index(['barangay_id', 'status']);
        });

        Schema::create('barangay_website_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id')->unique();
            $table->string('template', 50)->default('default');
            $table->text('hero_title')->nullable();
            $table->text('hero_subtitle')->nullable();
            $table->uuid('hero_image_file_id')->nullable();
            $table->text('about_content')->nullable();
            $table->text('mission')->nullable();
            $table->text('vision')->nullable();
            $table->text('core_values')->nullable();
            $table->jsonb('contact_info')->nullable();
            $table->jsonb('social_links')->nullable();
            $table->jsonb('custom_sections')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barangay_website_configs');
        Schema::dropIfExists('public_complaints');
        Schema::dropIfExists('public_document_requests');
        Schema::dropIfExists('barangay_posts');
    }
};
