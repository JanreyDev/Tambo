<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Disaster / DRRM ──
        Schema::create('hazard_pins', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('hazard_type', 50); // natural, transport, fire, military, industrial, viral
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->string('severity', 20)->default('moderate');
            $table->string('status', 20)->default('active');
            $table->uuid('reported_by_id')->nullable();
            $table->jsonb('photo_file_ids')->nullable();
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
        });

        Schema::create('evacuations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('evacuation_name', 255);
            $table->string('cause_type', 50);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('evacuation_center', 255)->nullable();
            $table->decimal('center_latitude', 10, 8)->nullable();
            $table->decimal('center_longitude', 11, 8)->nullable();
            $table->integer('evacuee_count')->default(0);
            $table->integer('family_count')->default(0);
            $table->string('status', 20)->default('active');
            $table->text('remarks')->nullable();
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
        });

        Schema::create('evacuation_families', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('evacuation_id');
            $table->uuid('barangay_id');
            $table->uuid('household_id')->nullable();
            $table->string('head_name', 200);
            $table->integer('member_count')->default(1);
            $table->text('special_needs')->nullable();
            $table->jsonb('relief_received')->nullable();
            $table->timestampsTz();

            $table->foreign('evacuation_id')->references('id')->on('evacuations')->cascadeOnDelete();
            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('household_id')->references('id')->on('households')->nullOnDelete();
            $table->index('evacuation_id');
            $table->index('barangay_id');
        });

        // ── GAD (Gender and Development) ──
        Schema::create('gad_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('plan_type', 30)->default('annual');
            $table->integer('fiscal_year');
            $table->decimal('barangay_total_budget', 14, 2)->default(0);
            $table->decimal('gad_budget', 14, 2)->default(0);
            $table->string('status', 20)->default('draft');
            $table->uuid('approved_by_id')->nullable();
            $table->timestampTz('approved_at')->nullable();
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
            $table->unique(['barangay_id', 'fiscal_year', 'plan_type']);
        });

        Schema::create('gad_plan_activities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('gad_plan_id');
            $table->uuid('barangay_id');
            $table->string('activity_name', 255);
            $table->text('objective')->nullable();
            $table->text('target_beneficiaries')->nullable();
            $table->decimal('budget_allocated', 14, 2)->default(0);
            $table->date('timeline_start')->nullable();
            $table->date('timeline_end')->nullable();
            $table->string('responsible_office', 200)->nullable();
            $table->text('performance_indicator')->nullable();
            $table->smallInteger('sort_order')->default(0);
            $table->timestampsTz();

            $table->foreign('gad_plan_id')->references('id')->on('gad_plans')->cascadeOnDelete();
            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('gad_plan_id');
        });

        Schema::create('gad_accomplishments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('gad_plan_id');
            $table->uuid('activity_id');
            $table->uuid('barangay_id');
            $table->decimal('actual_expenditure', 14, 2)->default(0);
            $table->integer('beneficiaries_reached')->default(0);
            $table->text('outcome')->nullable();
            $table->jsonb('supporting_documents')->nullable();
            $table->string('status', 20)->default('pending');
            $table->timestampsTz();

            $table->foreign('gad_plan_id')->references('id')->on('gad_plans')->cascadeOnDelete();
            $table->foreign('activity_id')->references('id')->on('gad_plan_activities')->cascadeOnDelete();
            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
        });

        // ── HRIS ──
        Schema::create('offices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->uuid('head_user_id')->nullable();
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
        });

        Schema::create('employees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->uuid('office_id');
            $table->uuid('resident_id')->nullable();
            $table->string('employee_number', 50)->nullable();
            $table->string('position', 200);
            $table->string('employment_type', 30)->default('regular');
            $table->date('date_hired')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('office_id')->references('id')->on('offices')->cascadeOnDelete();
            $table->foreign('resident_id')->references('id')->on('residents')->nullOnDelete();
            $table->index('barangay_id');
        });

        Schema::create('attendance_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->uuid('employee_id');
            $table->date('date');
            $table->timestampTz('time_in')->nullable();
            $table->timestampTz('time_out')->nullable();
            $table->string('status', 20)->default('present');
            $table->string('leave_type', 30)->nullable();
            $table->text('remarks')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->index('barangay_id');
            $table->index(['employee_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('offices');
        Schema::dropIfExists('gad_accomplishments');
        Schema::dropIfExists('gad_plan_activities');
        Schema::dropIfExists('gad_plans');
        Schema::dropIfExists('evacuation_families');
        Schema::dropIfExists('evacuations');
        Schema::dropIfExists('hazard_pins');
    }
};
