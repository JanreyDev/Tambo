<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('puroks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('name', 100);
            $table->uuid('leader_resident_id')->nullable();
            $table->text('description')->nullable();
            $table->integer('resident_count')->default(0);
            $table->integer('household_count')->default(0);
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('leader_resident_id')->references('id')->on('residents')->nullOnDelete();
            $table->index('barangay_id');
            $table->unique(['barangay_id', 'name']);
        });

        Schema::create('barangay_officials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->uuid('resident_id')->nullable();
            $table->string('position', 100); // punong_barangay, sb_member, sk_chairman, etc.
            $table->string('committee', 200)->nullable();
            $table->date('term_start')->nullable();
            $table->date('term_end')->nullable();
            $table->date('appointment_date')->nullable();
            $table->date('oath_date')->nullable();
            $table->boolean('is_elected')->default(true);
            $table->smallInteger('sort_order')->default(0);
            $table->string('status', 20)->default('active'); // active, resigned, removed, term_ended
            $table->uuid('photo_file_id')->nullable();
            $table->uuid('signature_file_id')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('resident_id')->references('id')->on('residents')->nullOnDelete();
            $table->foreign('photo_file_id')->references('id')->on('files')->nullOnDelete();
            $table->foreign('signature_file_id')->references('id')->on('files')->nullOnDelete();
            $table->index('barangay_id');
            $table->index(['barangay_id', 'status']);
        });

        Schema::create('councils', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('council_type', 50); // sangguniang_barangay, sangguniang_kabataan, lupon, etc.
            $table->string('term', 20)->nullable();
            $table->string('status', 20)->default('active'); // active, dissolved
            $table->text('meeting_schedule')->nullable();
            $table->jsonb('members')->nullable(); // [{official_id, role}]
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
        });

        Schema::create('council_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('council_id');
            $table->uuid('barangay_id');
            $table->string('session_type', 30); // regular, special, emergency
            $table->integer('session_number')->nullable();
            $table->date('date');
            $table->time('time_start')->nullable();
            $table->time('time_end')->nullable();
            $table->string('venue', 255)->nullable();
            $table->text('agenda')->nullable();
            $table->text('minutes')->nullable();
            $table->jsonb('attendees')->nullable(); // [{official_id, status}]
            $table->boolean('quorum_met')->default(false);
            $table->uuid('presiding_officer_id')->nullable();
            $table->uuid('secretary_id')->nullable();
            $table->timestampsTz();

            $table->foreign('council_id')->references('id')->on('councils')->cascadeOnDelete();
            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('presiding_officer_id')->references('id')->on('barangay_officials')->nullOnDelete();
            $table->foreign('secretary_id')->references('id')->on('barangay_officials')->nullOnDelete();
            $table->index('barangay_id');
            $table->index(['council_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('council_sessions');
        Schema::dropIfExists('councils');
        Schema::dropIfExists('barangay_officials');
        Schema::dropIfExists('puroks');
    }
};
