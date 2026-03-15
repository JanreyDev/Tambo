<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Track how each resident was registered
        Schema::table('residents', function (Blueprint $table) {
            $table->string('registration_source', 20)->default('form')->after('registration_date');
            // form = manual entry via resident form
            // import = bulk CSV import
            // census = mobile census/field survey
            $table->uuid('import_batch_id')->nullable()->after('registration_source');
        });

        // Track import batches for rollback capability
        Schema::create('import_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->uuid('imported_by'); // user who performed the import
            $table->string('filename');
            $table->integer('total_rows')->default(0);
            $table->integer('imported_count')->default(0);
            $table->integer('skipped_count')->default(0);
            $table->jsonb('errors')->nullable();
            $table->jsonb('column_mapping')->nullable();
            $table->string('status', 20)->default('completed'); // completed, rolled_back
            $table->timestamp('rolled_back_at')->nullable();
            $table->uuid('rolled_back_by')->nullable();
            $table->timestamps();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('imported_by')->references('id')->on('users')->cascadeOnDelete();
            $table->index('barangay_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_batches');

        Schema::table('residents', function (Blueprint $table) {
            $table->dropColumn(['registration_source', 'import_batch_id']);
        });
    }
};
