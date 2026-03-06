<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('households', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('household_number', 50)->unique();
            $table->string('household_name', 255)->nullable();
            $table->uuid('head_resident_id')->nullable();
            $table->string('household_type', 20)->nullable(); // nuclear, extended, single_person
            $table->string('tenure_status', 50)->nullable(); // owned, rented, living_with_relatives, informal_settler
            $table->string('housing_unit', 50)->nullable(); // single_house, apartment, room, makeshift
            $table->string('purok', 100)->nullable();
            $table->text('address')->nullable();
            $table->integer('member_count')->default(0);
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('head_resident_id')->references('id')->on('residents')->nullOnDelete();
            $table->index('barangay_id');
            $table->index(['barangay_id', 'purok']);
        });

        // Add household FK to residents now that both tables exist
        Schema::table('residents', function (Blueprint $table) {
            $table->foreign('household_id')->references('id')->on('households')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('residents', function (Blueprint $table) {
            $table->dropForeign(['household_id']);
        });
        Schema::dropIfExists('households');
    }
};
