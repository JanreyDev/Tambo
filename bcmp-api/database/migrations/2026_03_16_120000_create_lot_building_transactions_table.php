<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lot_building_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id')->index();
            $table->uuid('lot_building_id')->index();
            $table->string('transaction_type', 30); // lot_clearance | building_clearance | fencing_clearance | excavation_clearance | demolition_clearance | renovation_clearance
            $table->smallInteger('year');            // PH year the clearance was issued
            $table->text('notes')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->onDelete('cascade');
            $table->foreign('lot_building_id')->references('id')->on('lots_buildings')->onDelete('cascade');
            $table->index(['lot_building_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lot_building_transactions');
    }
};
