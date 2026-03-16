<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voters', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('barangay_id');
            $table->string('last_name', 100);
            $table->string('first_name', 100);
            $table->string('middle_name', 150)->nullable();
            $table->string('full_name', 350); // stored for display: LASTNAME, FIRSTNAME MIDDLENAME
            $table->string('precinct_number', 30);
            $table->text('address');
            $table->string('application_number', 100)->nullable(); // COMELEC app no.
            $table->uuid('resident_id')->nullable(); // matched resident
            $table->timestamp('matched_at')->nullable();
            $table->timestamp('imported_at'); // batch identifier — all records share same timestamp per import
            $table->timestamps();

            $table->foreign('barangay_id')->references('id')->on('barangays')->onDelete('cascade');
            $table->foreign('resident_id')->references('id')->on('residents')->nullOnDelete();

            $table->index(['barangay_id', 'precinct_number']);
            $table->index(['barangay_id', 'last_name', 'first_name']);
            $table->index('resident_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voters');
    }
};
