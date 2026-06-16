<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add denormalized constituent info to issued_documents.
     *
     * Storing constituent_name and constituent_number avoids N+1 queries
     * when listing documents -- no join to residents/establishments needed.
     * Set at issuance time and immutable after.
     */
    public function up(): void
    {
        Schema::table('issued_documents', function (Blueprint $table): void {
            $table->string('constituent_name', 255)->nullable()->after('constituent_id');
            $table->string('constituent_number', 100)->nullable()->after('constituent_name');
            $table->string('template_name', 255)->nullable()->after('template_id');
        });
    }

    public function down(): void
    {
        Schema::table('issued_documents', function (Blueprint $table): void {
            $table->dropColumn(['constituent_name', 'constituent_number', 'template_name']);
        });
    }
};
