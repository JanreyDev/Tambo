<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Asset Management (PPE, Semi-Expendable, Expendable) ──
        Schema::create('suppliers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('name', 255);
            $table->string('contact_person', 200)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email', 255)->nullable();
            $table->text('address')->nullable();
            $table->string('tin', 50)->nullable();
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
        });

        Schema::create('acceptance_inspection_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('air_number', 50)->unique();
            $table->uuid('supplier_id')->nullable();
            $table->date('delivery_date')->nullable();
            $table->date('accepted_date')->nullable();
            $table->string('delivery_status', 20)->default('complete');
            $table->uuid('inspected_by_id')->nullable();
            $table->uuid('accepted_by_id')->nullable();
            $table->text('remarks')->nullable();
            $table->string('status', 20)->default('pending');
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();
            $table->index('barangay_id');
        });

        Schema::create('assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->uuid('air_id')->nullable();
            $table->string('asset_id_tag', 50)->unique();
            $table->text('description');
            $table->string('classification', 30); // expendable, semi_expendable, ppe
            $table->string('uacs_code', 30)->nullable();
            $table->integer('quantity')->default(1);
            $table->string('unit', 20)->default('pcs');
            $table->decimal('unit_price', 14, 2)->default(0);
            $table->decimal('total_value', 14, 2)->default(0);
            $table->date('acquisition_date')->nullable();
            $table->string('condition', 20)->default('new');
            $table->string('location', 200)->nullable();
            $table->uuid('assigned_to_id')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('status', 20)->default('in_use');
            $table->date('disposal_date')->nullable();
            $table->string('disposal_method', 50)->nullable();
            $table->uuid('photo_file_id')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('air_id')->references('id')->on('acceptance_inspection_reports')->nullOnDelete();
            $table->foreign('photo_file_id')->references('id')->on('files')->nullOnDelete();
            $table->index('barangay_id');
            $table->index(['barangay_id', 'classification']);
        });

        // ── Inventory (Medicines, Supplies, Equipment, Furniture) ──
        Schema::create('inventory_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('name', 100); // medicines, furniture, equipment, supplies, vehicles
            $table->text('description')->nullable();
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
            $table->unique(['barangay_id', 'name']);
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->uuid('category_id');
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('sku', 50)->nullable();
            $table->integer('quantity')->default(0);
            $table->integer('minimum_stock')->default(0); // alert threshold
            $table->string('unit', 20)->default('pcs');
            $table->string('location', 200)->nullable();
            $table->date('expiry_date')->nullable(); // for medicines
            $table->string('condition', 20)->default('good');
            $table->uuid('photo_file_id')->nullable();
            $table->string('status', 20)->default('available'); // available, low_stock, out_of_stock, expired, disposed
            $table->timestampsTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('category_id')->references('id')->on('inventory_categories')->cascadeOnDelete();
            $table->foreign('photo_file_id')->references('id')->on('files')->nullOnDelete();
            $table->index('barangay_id');
            $table->index(['barangay_id', 'status']);
        });

        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->uuid('item_id');
            $table->string('transaction_type', 20); // received, issued, returned, disposed, adjusted
            $table->integer('quantity');
            $table->text('reference')->nullable();
            $table->uuid('performed_by_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('item_id')->references('id')->on('inventory_items')->cascadeOnDelete();
            $table->index('barangay_id');
            $table->index('item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('inventory_categories');
        Schema::dropIfExists('assets');
        Schema::dropIfExists('acceptance_inspection_reports');
        Schema::dropIfExists('suppliers');
    }
};
