<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barangays', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('psgc_code', 10)->unique()->nullable();
            $table->string('name', 255);
            $table->string('municipality_psgc', 10)->nullable();
            $table->string('province_psgc', 10)->nullable();
            $table->string('region_psgc', 10)->nullable();
            $table->text('full_address')->nullable();
            $table->string('logo_url', 500)->nullable();
            $table->string('seal_url', 500)->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->string('contact_email', 255)->nullable();
            $table->string('website_url', 500)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->integer('population')->default(0);
            $table->decimal('land_area_hectares', 10, 2)->nullable();
            $table->string('officials_term', 20)->nullable();
            $table->string('status', 20)->default('active');
            $table->string('subscription_plan', 50)->nullable();
            $table->timestampTz('subscription_expires_at')->nullable();
            $table->decimal('sms_credit_balance', 10, 2)->default(0);
            $table->decimal('call_credit_balance', 10, 2)->default(0);
            $table->decimal('map_credit_balance', 10, 2)->default(0);
            $table->decimal('ai_credit_balance', 10, 2)->default(0);
            $table->bigInteger('storage_used_bytes')->default(0);
            $table->bigInteger('storage_limit_bytes')->default(2147483648); // 2GB
            $table->jsonb('settings')->default('{}');
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->index('status');
            $table->index('province_psgc');
            $table->index('region_psgc');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barangays');
    }
};
