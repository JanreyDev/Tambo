<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tanods', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->uuid('resident_id');
            $table->uuid('official_id')->nullable();
            $table->string('badge_number', 50)->nullable();
            $table->date('appointment_date')->nullable();
            $table->uuid('appointed_by_id')->nullable();
            $table->string('beat_assignment', 100)->nullable();
            $table->string('team', 50)->nullable();
            $table->string('status', 20)->default('active');
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('resident_id')->references('id')->on('residents')->cascadeOnDelete();
            $table->foreign('official_id')->references('id')->on('barangay_officials')->nullOnDelete();
            $table->index('barangay_id');
        });

        Schema::create('tanod_duty_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->uuid('tanod_id');
            $table->date('date');
            $table->time('shift_start');
            $table->time('shift_end');
            $table->string('beat', 100)->nullable();
            $table->uuid('team_leader_id')->nullable();
            $table->string('status', 20)->default('scheduled');
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('tanod_id')->references('id')->on('tanods')->cascadeOnDelete();
            $table->index('barangay_id');
            $table->index(['tanod_id', 'date']);
        });

        Schema::create('tanod_patrol_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->uuid('tanod_id');
            $table->uuid('schedule_id')->nullable();
            $table->timestampTz('log_time');
            $table->string('location', 255)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->text('activity')->nullable();
            $table->text('observations')->nullable();
            $table->jsonb('attachments')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('tanod_id')->references('id')->on('tanods')->cascadeOnDelete();
            $table->index('barangay_id');
        });

        Schema::create('tanod_incident_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->uuid('reporting_tanod_id');
            $table->string('incident_number', 50)->nullable();
            $table->date('incident_date');
            $table->time('incident_time')->nullable();
            $table->string('incident_location', 255)->nullable();
            $table->text('who')->nullable();
            $table->text('what')->nullable();
            $table->text('when_details')->nullable();
            $table->text('where_details')->nullable();
            $table->text('why')->nullable();
            $table->text('how')->nullable();
            $table->text('actions_taken')->nullable();
            $table->string('referred_to', 100)->nullable();
            $table->uuid('linked_blotter_id')->nullable();
            $table->uuid('linked_vawc_case_id')->nullable();
            $table->jsonb('witness_info')->nullable();
            $table->jsonb('evidence_file_ids')->nullable();
            $table->string('status', 20)->default('reported');
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('reporting_tanod_id')->references('id')->on('tanods')->cascadeOnDelete();
            $table->foreign('linked_blotter_id')->references('id')->on('blotter_records')->nullOnDelete();
            $table->foreign('linked_vawc_case_id')->references('id')->on('vawc_cases')->nullOnDelete();
            $table->index('barangay_id');
        });

        Schema::create('tanod_trainings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->uuid('tanod_id');
            $table->string('training_name', 255);
            $table->string('provider', 255)->nullable();
            $table->date('date_completed')->nullable();
            $table->uuid('certificate_file_id')->nullable();
            $table->date('expiry_date')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('tanod_id')->references('id')->on('tanods')->cascadeOnDelete();
            $table->foreign('certificate_file_id')->references('id')->on('files')->nullOnDelete();
            $table->index('barangay_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tanod_trainings');
        Schema::dropIfExists('tanod_incident_reports');
        Schema::dropIfExists('tanod_patrol_logs');
        Schema::dropIfExists('tanod_duty_schedules');
        Schema::dropIfExists('tanods');
    }
};
