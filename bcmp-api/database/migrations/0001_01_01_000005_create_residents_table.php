<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('residents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('resident_number', 50)->unique();
            $table->date('registration_date')->nullable();
            $table->string('resident_type', 30)->default('permanent'); // permanent, transient, transferee
            $table->date('transfer_date')->nullable();

            // Personal
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('extension_name', 10)->nullable(); // Jr, Sr, III, IV
            $table->string('mothers_maiden_name', 200)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('place_of_birth', 255)->nullable();
            $table->string('sex', 10)->nullable(); // male, female
            $table->string('civil_status', 20)->nullable();
            $table->string('citizenship', 50)->nullable();
            $table->string('blood_type', 5)->nullable();
            $table->decimal('height_cm', 5, 1)->nullable();
            $table->decimal('weight_kg', 5, 1)->nullable();
            $table->string('complexion', 30)->nullable();
            $table->string('religion', 100)->nullable();
            $table->string('ethnicity', 100)->nullable(); // for IP identification

            // Contact
            $table->string('email', 255)->nullable();
            $table->string('mobile_number', 20)->nullable();
            $table->string('telephone', 20)->nullable();

            // Address (within barangay)
            $table->string('purok', 100)->nullable();
            $table->string('sitio', 100)->nullable();
            $table->string('house_block_lot', 100)->nullable();
            $table->string('street', 255)->nullable();
            $table->string('subdivision_village', 255)->nullable();
            $table->string('zip_code', 10)->nullable();

            // Voter Info
            $table->boolean('is_voter')->default(false);
            $table->boolean('is_resident_voter')->default(false);
            $table->string('voter_precinct_number', 50)->nullable();
            $table->integer('last_voted_year')->nullable();

            // Government IDs (encrypted at field level)
            $table->text('philhealth_number_encrypted')->nullable();
            $table->text('sss_gsis_number_encrypted')->nullable();
            $table->text('pagibig_number_encrypted')->nullable();
            $table->text('tin_number_encrypted')->nullable();

            // Education
            $table->string('highest_education', 100)->nullable();
            $table->jsonb('education_details')->nullable();

            // Employment
            $table->string('occupation', 200)->nullable();
            $table->string('employer', 200)->nullable();
            $table->string('monthly_income_range', 50)->nullable();
            $table->string('source_of_income', 200)->nullable();

            // Biometric (stored as file references, NOT base64)
            $table->uuid('photo_file_id')->nullable();
            $table->uuid('signature_file_id')->nullable();
            $table->uuid('left_thumbmark_file_id')->nullable();
            $table->uuid('right_thumbmark_file_id')->nullable();

            // Emergency Contact
            $table->string('emergency_contact_name', 200)->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->text('emergency_contact_address')->nullable();
            $table->string('emergency_contact_relationship', 50)->nullable();

            // Status
            $table->boolean('is_head_of_household')->default(false);
            $table->uuid('household_id')->nullable();
            $table->smallInteger('profile_completion_pct')->default(0);
            $table->string('status', 20)->default('active'); // active, deceased, transferred, archived
            $table->timestampTz('approved_at')->nullable();
            $table->uuid('approved_by')->nullable();

            // QR Code
            $table->string('qr_code_data', 500)->nullable();

            // Audit
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            // Foreign Keys
            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('photo_file_id')->references('id')->on('files')->nullOnDelete();
            $table->foreign('signature_file_id')->references('id')->on('files')->nullOnDelete();
            $table->foreign('left_thumbmark_file_id')->references('id')->on('files')->nullOnDelete();
            $table->foreign('right_thumbmark_file_id')->references('id')->on('files')->nullOnDelete();

            // Indexes
            $table->index('barangay_id');
            $table->index(['barangay_id', 'last_name', 'first_name'], 'idx_residents_name');
            $table->index('mobile_number');
            $table->index('date_of_birth');
            $table->index(['last_name', 'first_name', 'date_of_birth'], 'idx_residents_cross_brgy');
            $table->index(['barangay_id', 'status']);
            $table->index(['barangay_id', 'purok']);
        });

        Schema::create('resident_sectoral_tags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('resident_id');
            $table->uuid('barangay_id');
            $table->string('sector', 50); // solo_parent, ofw, pwd, osc, osy, unemployed, labor_force, isy, 4ps, senior_citizen, ip
            $table->jsonb('details')->nullable(); // sector-specific details
            $table->timestampTz('verified_at')->nullable();
            $table->uuid('verified_by')->nullable();
            $table->timestampsTz();

            $table->foreign('resident_id')->references('id')->on('residents')->cascadeOnDelete();
            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
            $table->index(['resident_id', 'sector']);
        });

        Schema::create('resident_cross_barangay_flags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('resident_id');
            $table->uuid('other_barangay_id');
            $table->decimal('match_confidence', 3, 2)->default(0);
            $table->date('last_transaction_date')->nullable();
            $table->timestampTz('detected_at')->useCurrent();
            $table->timestampTz('acknowledged_at')->nullable();

            $table->foreign('resident_id')->references('id')->on('residents')->cascadeOnDelete();
            $table->foreign('other_barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('resident_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resident_cross_barangay_flags');
        Schema::dropIfExists('resident_sectoral_tags');
        Schema::dropIfExists('residents');
    }
};
