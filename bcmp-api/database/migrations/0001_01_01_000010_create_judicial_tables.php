<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── KP (Katarungang Pambarangay) Cases ──
        Schema::create('kp_cases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('case_number', 50)->unique();
            $table->date('filing_date');
            $table->string('case_level', 20)->default('mediation'); // mediation, conciliation, arbitration
            $table->string('nature', 20); // civil, criminal
            $table->string('nature_of_complaint', 200);
            $table->string('rpc_article', 20)->nullable(); // Art. 155, Art. 266, etc.
            $table->text('case_description')->nullable();

            // Parties
            $table->string('complainant_type', 20)->default('individual'); // individual, group
            $table->string('respondent_type', 20)->default('individual');

            // Officers
            $table->uuid('presiding_officer_id')->nullable();
            $table->uuid('lupon_secretary_id')->nullable();
            $table->uuid('pangkat_chairman_id')->nullable();
            $table->jsonb('pangkat_members')->nullable(); // [{official_id, name}]

            // Timeline (strict per RA 7160)
            $table->date('first_meeting_date')->nullable();
            $table->date('mediation_deadline')->nullable(); // filing + 15 days
            $table->date('pangkat_constituted_date')->nullable();
            $table->date('pangkat_convene_date')->nullable(); // constitution + 3 days
            $table->date('conciliation_deadline')->nullable(); // convene + 15 days
            $table->date('conciliation_extended_deadline')->nullable(); // + 15 more days

            // Resolution
            $table->text('action_taken')->nullable();
            $table->text('settlement_text')->nullable();
            $table->date('settlement_date')->nullable();
            $table->text('arbitration_award')->nullable();
            $table->date('arbitration_date')->nullable();
            $table->date('repudiation_deadline')->nullable(); // settlement/award + 10 days
            $table->date('execution_date')->nullable();
            $table->boolean('certification_to_file_action')->default(false);
            $table->date('cfa_date')->nullable();
            $table->text('cfa_reason')->nullable();

            // Status
            $table->string('status', 30)->default('filed'); // filed, mediation, conciliation, arbitration, settled, cfa_issued, dismissed, closed
            $table->text('remarks')->nullable();

            // Blockchain
            $table->string('blockchain_hash', 128)->nullable();

            $table->timestampsTz();
            $table->softDeletesTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('presiding_officer_id')->references('id')->on('barangay_officials')->nullOnDelete();
            $table->foreign('lupon_secretary_id')->references('id')->on('barangay_officials')->nullOnDelete();
            $table->foreign('pangkat_chairman_id')->references('id')->on('barangay_officials')->nullOnDelete();
            $table->index('barangay_id');
            $table->index(['barangay_id', 'status']);
        });

        Schema::create('kp_case_parties', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('case_id');
            $table->uuid('barangay_id');
            $table->uuid('resident_id')->nullable();
            $table->string('party_type', 20); // complainant, respondent, witness
            $table->string('full_name', 200);
            $table->text('address')->nullable();
            $table->string('mobile_number', 20)->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('case_id')->references('id')->on('kp_cases')->cascadeOnDelete();
            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('resident_id')->references('id')->on('residents')->nullOnDelete();
            $table->index('case_id');
            $table->index('barangay_id');
        });

        Schema::create('kp_case_hearings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('case_id');
            $table->uuid('barangay_id');
            $table->string('hearing_type', 30); // mediation, conciliation, arbitration
            $table->date('hearing_date');
            $table->time('hearing_time')->nullable();
            $table->string('venue', 255)->nullable();
            $table->text('minutes')->nullable();
            $table->jsonb('attendees')->nullable();
            $table->string('outcome', 50)->nullable(); // continued, settled, referred, defaulted
            $table->date('next_hearing_date')->nullable();
            $table->timestampsTz();

            $table->foreign('case_id')->references('id')->on('kp_cases')->cascadeOnDelete();
            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('case_id');
            $table->index('barangay_id');
        });

        // ── Blotter Records ──
        Schema::create('blotter_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('blotter_number', 50)->unique();
            $table->date('filing_date');
            $table->string('complainant_name', 200);
            $table->text('complainant_address')->nullable();
            $table->string('complainant_mobile', 20)->nullable();
            $table->uuid('complainant_resident_id')->nullable();
            $table->string('respondent_name', 200);
            $table->text('respondent_address')->nullable();
            $table->string('respondent_mobile', 20)->nullable();
            $table->uuid('respondent_resident_id')->nullable();
            $table->string('incident_type', 200);
            $table->date('incident_date')->nullable();
            $table->time('incident_time')->nullable();
            $table->string('incident_place', 255)->nullable();
            $table->text('narrative');
            $table->text('resolution')->nullable();
            $table->uuid('officer_on_duty_id')->nullable();
            $table->string('status', 20)->default('filed'); // filed, for_hearing, for_subpoena, settled, closed
            $table->uuid('linked_kp_case_id')->nullable();
            $table->jsonb('attachment_file_ids')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('complainant_resident_id')->references('id')->on('residents')->nullOnDelete();
            $table->foreign('respondent_resident_id')->references('id')->on('residents')->nullOnDelete();
            $table->foreign('officer_on_duty_id')->references('id')->on('barangay_officials')->nullOnDelete();
            $table->foreign('linked_kp_case_id')->references('id')->on('kp_cases')->nullOnDelete();
            $table->index('barangay_id');
            $table->index(['barangay_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blotter_records');
        Schema::dropIfExists('kp_case_hearings');
        Schema::dropIfExists('kp_case_parties');
        Schema::dropIfExists('kp_cases');
    }
};
