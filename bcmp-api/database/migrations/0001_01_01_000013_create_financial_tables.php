<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->integer('fiscal_year');
            $table->decimal('appropriation', 14, 2)->default(0);
            $table->decimal('allotment', 14, 2)->default(0);
            $table->decimal('obligations', 14, 2)->default(0);
            $table->decimal('unobligated', 14, 2)->default(0);
            $table->decimal('beginning_cash_treasury', 14, 2)->default(0);
            $table->decimal('beginning_cash_bank', 14, 2)->default(0);
            $table->decimal('beginning_cash_advance', 14, 2)->default(0);
            $table->decimal('beginning_petty_cash', 14, 2)->default(0);
            $table->decimal('gad_budget', 14, 2)->default(0); // >= 5% of total
            $table->decimal('sk_budget', 14, 2)->default(0);
            $table->string('status', 20)->default('draft');
            $table->uuid('approved_by_id')->nullable();
            $table->timestampTz('approved_at')->nullable();
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
            $table->unique(['barangay_id', 'fiscal_year']);
        });

        Schema::create('disbursement_vouchers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('dv_number', 50)->unique();
            $table->string('dv_type', 30)->default('payment'); // payment, cash_advance, petty_cash_replenishment
            $table->string('payee', 255);
            $table->text('particulars')->nullable();
            $table->decimal('amount', 14, 2);
            $table->string('fund_source', 100)->nullable();
            $table->string('status', 20)->default('draft');
            $table->uuid('prepared_by_id')->nullable();
            $table->uuid('certified_by_id')->nullable();
            $table->uuid('approved_by_id')->nullable();
            $table->timestampTz('approved_at')->nullable();
            $table->string('check_number', 50)->nullable();
            $table->date('check_date')->nullable();
            $table->string('bank_name', 200)->nullable();
            $table->timestampsTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
        });

        Schema::create('petty_cash_vouchers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('pcv_number', 50)->unique();
            $table->date('date');
            $table->string('payee', 255);
            $table->text('particulars')->nullable();
            $table->decimal('amount', 14, 2);
            $table->string('status', 20)->default('draft');
            $table->timestampsTz();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('payment_type', 50); // tax, fee, permit, clearance, etc.
            $table->string('reference_number', 50)->nullable();
            $table->date('date');
            $table->string('payer_name', 255);
            $table->uuid('payer_resident_id')->nullable();
            $table->decimal('amount', 14, 2);
            $table->string('or_number', 50)->nullable();
            $table->text('remarks')->nullable();
            $table->string('status', 20)->default('received');
            $table->timestampsTz();
            $table->uuid('created_by')->nullable();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('payer_resident_id')->references('id')->on('residents')->nullOnDelete();
            $table->index('barangay_id');
        });

        Schema::create('collections_deposits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->date('report_date');
            $table->decimal('collection_amount', 14, 2)->default(0);
            $table->decimal('deposit_amount', 14, 2)->default(0);
            $table->string('bank_name', 200)->nullable();
            $table->string('deposit_slip_number', 50)->nullable();
            $table->uuid('prepared_by_id')->nullable();
            $table->string('status', 20)->default('draft');
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
        });

        Schema::create('cashbook_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->date('entry_date');
            $table->text('description')->nullable();
            $table->string('reference_type', 30)->nullable(); // dv, pcv, payment, collection
            $table->uuid('reference_id')->nullable();
            $table->decimal('debit', 14, 2)->default(0);
            $table->decimal('credit', 14, 2)->default(0);
            $table->decimal('balance', 14, 2)->default(0);
            $table->string('fund_type', 50)->default('general'); // general, sk, trust, special_education
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
            $table->index(['barangay_id', 'fund_type', 'entry_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cashbook_entries');
        Schema::dropIfExists('collections_deposits');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('petty_cash_vouchers');
        Schema::dropIfExists('disbursement_vouchers');
        Schema::dropIfExists('budgets');
    }
};
