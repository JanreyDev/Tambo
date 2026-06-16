<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id')->nullable(); // null = system default
            $table->string('name', 255);
            $table->string('category', 50); // clearance, residency, indigency, business_permit, cedula, etc.
            $table->string('constituent_type', 30)->default('resident'); // resident, establishment, lot_building, case
            $table->text('content')->nullable(); // rich text with {{merge_fields}}
            $table->string('title', 255)->nullable();
            $table->text('salutation')->nullable();
            $table->jsonb('merge_fields')->nullable();
            $table->jsonb('custom_inputs')->nullable(); // [{name, type, required}]
            $table->jsonb('custom_tables')->nullable();
            $table->jsonb('approval_config')->nullable(); // {left: {label, position}, right: {label, position}}
            $table->jsonb('settings')->nullable(); // {show_qr, show_ctc, show_doc_no, show_or, show_expiry, etc.}
            $table->string('status', 20)->default('draft'); // draft, published, archived
            $table->smallInteger('sort_order')->default(0);
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->nullOnDelete();
            $table->index('barangay_id');
            $table->index('category');
        });

        Schema::create('issued_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('document_number', 50)->unique();
            $table->uuid('template_id')->nullable();
            $table->string('constituent_type', 30); // resident, establishment, lot_building
            $table->uuid('constituent_id');
            $table->text('purpose')->nullable();
            $table->string('or_number', 50)->nullable();
            $table->decimal('or_amount', 10, 2)->nullable();
            $table->string('ctc_number', 50)->nullable();
            $table->date('ctc_date')->nullable();
            $table->string('ctc_place', 200)->nullable();
            $table->date('issued_date')->nullable();
            $table->date('valid_until')->nullable();
            $table->jsonb('custom_field_values')->nullable();
            $table->uuid('approved_by_left')->nullable();
            $table->uuid('approved_by_right')->nullable();
            $table->string('qr_code_url', 500)->nullable();
            $table->string('blockchain_hash', 128)->nullable();
            $table->uuid('pdf_file_id')->nullable();
            $table->string('status', 20)->default('draft'); // draft, issued, expired, revoked
            $table->boolean('sms_sent')->default(false);
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('template_id')->references('id')->on('document_templates')->nullOnDelete();
            $table->foreign('pdf_file_id')->references('id')->on('files')->nullOnDelete();
            $table->index('barangay_id');
            $table->index(['constituent_type', 'constituent_id']);
            $table->index(['barangay_id', 'status']);
        });

        Schema::create('document_routes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('document_title', 255);
            $table->string('reference_number', 50)->nullable();
            $table->string('document_type', 50)->nullable();
            $table->string('origin', 50)->nullable(); // internal, external
            $table->string('from_office', 200)->nullable();
            $table->string('to_office', 200)->nullable();
            $table->uuid('current_holder_id')->nullable();
            $table->text('remarks')->nullable();
            $table->string('status', 20)->default('new'); // new, received, in_progress, returned, completed, closed
            $table->jsonb('attachment_file_ids')->nullable(); // array of file UUIDs
            $table->jsonb('route_history')->nullable(); // [{from, to, action, date, remarks}]
            $table->timestampsTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('current_holder_id')->references('id')->on('users')->nullOnDelete();
            $table->index('barangay_id');
            $table->index(['barangay_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_routes');
        Schema::dropIfExists('issued_documents');
        Schema::dropIfExists('document_templates');
    }
};
