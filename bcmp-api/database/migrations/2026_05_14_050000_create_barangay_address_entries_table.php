<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-barangay learned autocomplete entries for the Resident form.
     *
     * Replaces hardcoded `default*Entries` arrays that lived inside the
     * Residents page. Each row is one canonical value for one entry kind,
     * with a usage count and an array of misspelling/alias variants.
     *
     * The frontend's FCombobox calls `POST /address-entries` whenever a
     * clerk picks or types a value — the controller upserts on
     * (barangay_id, kind, canonical) and bumps `count`.
     */
    public function up(): void
    {
        Schema::create('barangay_address_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('kind', 32);
            $table->string('canonical', 200);
            $table->unsignedInteger('count')->default(1);
            $table->jsonb('aliases')->default('[]');
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->onDelete('cascade');

            $table->unique(['barangay_id', 'kind', 'canonical']);
            $table->index(['barangay_id', 'kind', 'count']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barangay_address_entries');
    }
};
