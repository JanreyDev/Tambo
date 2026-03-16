<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('establishment_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id')->index();
            $table->uuid('establishment_id')->index();
            $table->string('transaction_type', 20); // new | renewal | closure
            $table->smallInteger('year');           // PH year the transaction was processed
            $table->text('notes')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->onDelete('cascade');
            $table->foreign('establishment_id')->references('id')->on('establishments')->onDelete('cascade');
            $table->index(['establishment_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('establishment_transactions');
    }
};
