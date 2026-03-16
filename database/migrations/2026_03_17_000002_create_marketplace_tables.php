<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Products managed by PrimeX admin (via primex-api)
        Schema::create('marketplace_products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('category', 100)->default('supplies'); // supplies, equipment, furniture, medical, electronics, vehicles, other
            $table->decimal('price', 14, 2);
            $table->decimal('original_price', 14, 2)->nullable();
            $table->integer('stock_qty')->default(0);
            $table->string('unit', 50)->default('pcs'); // pcs, reams, boxes, sets, liters, kg
            $table->string('sku', 50)->nullable()->unique();
            $table->string('supplier_name', 255)->nullable();
            $table->uuid('image_file_id')->nullable();
            $table->decimal('rating', 3, 2)->default(0); // 0-5
            $table->integer('total_orders')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->string('tag', 50)->nullable(); // Best Seller, New, Official, Custom
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();

            $table->index(['is_active', 'category']);
        });

        Schema::create('marketplace_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('order_number', 50)->unique();
            $table->string('status', 30)->default('pending'); // pending, approved, processing, shipped, delivered, cancelled
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('total_amount', 14, 2)->default(0);
            $table->text('delivery_address')->nullable();
            $table->string('contact_person', 255)->nullable();
            $table->string('contact_number', 20)->nullable();
            $table->text('notes')->nullable();
            $table->string('payment_method', 50)->default('cod'); // cod, check, bank_transfer
            $table->string('payment_status', 20)->default('unpaid'); // unpaid, paid
            $table->string('po_number', 50)->nullable(); // Purchase Order number
            $table->date('expected_delivery_date')->nullable();
            $table->date('delivered_date')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
            $table->index(['barangay_id', 'status']);
        });

        Schema::create('marketplace_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id');
            $table->uuid('product_id');
            $table->string('product_name', 255); // snapshot at time of order
            $table->string('unit', 50)->default('pcs');
            $table->integer('quantity');
            $table->decimal('unit_price', 14, 2);
            $table->decimal('subtotal', 14, 2);
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('order_id')->references('id')->on('marketplace_orders')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('marketplace_products')->restrictOnDelete();
            $table->index('order_id');
        });

        // Barangay cart (per user, per barangay)
        Schema::create('marketplace_cart_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->uuid('user_id');
            $table->uuid('product_id');
            $table->integer('quantity')->default(1);
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('marketplace_products')->cascadeOnDelete();
            $table->unique(['user_id', 'product_id']);
            $table->index(['barangay_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketplace_cart_items');
        Schema::dropIfExists('marketplace_order_items');
        Schema::dropIfExists('marketplace_orders');
        Schema::dropIfExists('marketplace_products');
    }
};
