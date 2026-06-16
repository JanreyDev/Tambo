<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feature_flags', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100);
            $table->text('description')->nullable();
            $table->boolean('enabled')->default(false);
            $table->uuid('tenant_id')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->date('remove_after')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('barangays')
                ->cascadeOnDelete();

            // A flag key is unique per tenant (null tenant = global)
            $table->unique(['key', 'tenant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_flags');
    }
};
