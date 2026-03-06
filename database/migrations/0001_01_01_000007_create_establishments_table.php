<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('establishments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('establishment_number', 50)->unique();
            $table->string('business_name', 255);
            $table->string('business_type', 100)->nullable();
            $table->uuid('owner_resident_id')->nullable();
            $table->string('owner_name', 200)->nullable();
            $table->string('owner_contact', 20)->nullable();
            $table->string('owner_email', 255)->nullable();
            $table->text('owner_address')->nullable();
            $table->string('purok', 100)->nullable();
            $table->string('street', 255)->nullable();
            $table->text('exact_address')->nullable();
            $table->date('registration_date')->nullable();
            $table->string('permit_number', 100)->nullable();
            $table->date('permit_expiry')->nullable();
            $table->string('status', 20)->default('active'); // active, closed, suspended
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('owner_resident_id')->references('id')->on('residents')->nullOnDelete();
            $table->index('barangay_id');
            $table->index(['barangay_id', 'status']);
        });

        Schema::create('lots_buildings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('lot_building_number', 50)->unique();
            $table->string('classification', 30); // lot_only, building_only, lot_and_building
            $table->uuid('owner_resident_id')->nullable();
            $table->string('owner_name', 200)->nullable();
            $table->string('owner_contact', 20)->nullable();
            $table->string('owner_email', 255)->nullable();
            $table->text('owner_address')->nullable();
            $table->string('size', 100)->nullable();
            $table->string('mri', 100)->nullable(); // Municipal Reference Index
            $table->string('purok', 100)->nullable();
            $table->text('exact_address')->nullable();
            $table->text('boundary_north')->nullable();
            $table->text('boundary_south')->nullable();
            $table->text('boundary_east')->nullable();
            $table->text('boundary_west')->nullable();
            $table->string('tax_declaration_number', 100)->nullable();
            $table->date('registration_date')->nullable();
            $table->string('status', 20)->default('active'); // active, inactive, demolished
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('owner_resident_id')->references('id')->on('residents')->nullOnDelete();
            $table->index('barangay_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lots_buildings');
        Schema::dropIfExists('establishments');
    }
};
