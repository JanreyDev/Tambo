<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vawc_cases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('case_number', 50)->unique();
            $table->string('incident_type', 50); // vawc, vac, vaw
            $table->date('filing_date');
            $table->date('incident_date')->nullable();
            $table->time('incident_time')->nullable();
            $table->string('incident_place', 255)->nullable();
            $table->text('narrative_encrypted')->nullable(); // encrypted

            // Victim-Survivor (encrypted fields)
            $table->text('victim_name_encrypted');
            $table->date('victim_dob')->nullable();
            $table->text('victim_address_encrypted')->nullable();
            $table->text('victim_phone_encrypted')->nullable();
            $table->string('victim_occupation', 200)->nullable();
            $table->string('victim_income_range', 50)->nullable();
            $table->string('victim_civil_status', 20)->nullable();
            $table->uuid('victim_resident_id')->nullable();

            // Respondent (encrypted fields)
            $table->text('respondent_name_encrypted');
            $table->date('respondent_dob')->nullable();
            $table->text('respondent_address_encrypted')->nullable();
            $table->text('respondent_phone_encrypted')->nullable();
            $table->string('respondent_occupation', 200)->nullable();
            $table->string('respondent_civil_status', 20)->nullable();
            $table->string('respondent_relationship', 50)->nullable();

            // Children
            $table->text('children_info_encrypted')->nullable(); // encrypted JSON

            // Protection Orders
            $table->boolean('bpo_issued')->default(false);
            $table->date('bpo_issued_date')->nullable();
            $table->date('bpo_expiry_date')->nullable(); // 15 days from issuance
            $table->boolean('tpo_referred')->default(false);
            $table->date('tpo_date')->nullable();
            $table->boolean('ppo_referred')->default(false);
            $table->date('ppo_date')->nullable();

            // Referrals (RA 9262 Section 44 — 4-hour window)
            $table->boolean('referred_to_pnp')->default(false);
            $table->timestampTz('pnp_referral_time')->nullable();
            $table->boolean('referred_to_dswd')->default(false);
            $table->timestampTz('dswd_referral_time')->nullable();
            $table->jsonb('other_referrals')->nullable();

            // Status
            $table->string('status', 30)->default('reported');
            $table->uuid('vaw_desk_officer_id')->nullable();
            $table->string('logbook_type', 10)->nullable(); // ra9262, other_vaw
            $table->integer('logbook_page_number')->nullable();

            // Audit (extra strict — every access recorded)
            $table->jsonb('access_log')->nullable();

            $table->timestampsTz();
            $table->softDeletesTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vawc_cases');
    }
};
