<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Subscription Plans (Super Admin) ──
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->decimal('price_annual', 10, 2)->default(0);
            $table->decimal('price_quarterly', 10, 2)->default(0);
            $table->jsonb('features')->nullable();
            $table->bigInteger('storage_limit_bytes')->default(2147483648); // 2GB
            $table->integer('sms_credits_included')->default(0);
            $table->timestampsTz();
        });

        // ── Billings ──
        Schema::create('billings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('billing_number', 50)->unique();
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('amount', 10, 2);
            $table->decimal('balance', 10, 2)->default(0);
            $table->string('status', 20)->default('draft'); // draft, delivered, paid, overdue, cancelled
            $table->string('invoice_number', 50)->nullable();
            $table->string('or_number', 50)->nullable();
            $table->date('due_date')->nullable();
            $table->timestampTz('paid_at')->nullable();
            $table->text('remarks')->nullable();
            $table->jsonb('line_items')->nullable();
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
            $table->index('status');
        });

        // ── SMS Transactions ──
        Schema::create('sms_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('recipient_phone', 20);
            $table->text('message');
            $table->decimal('credit_cost', 6, 2)->default(1);
            $table->string('source', 50)->nullable(); // resident_registration, document_issued, etc.
            $table->uuid('source_id')->nullable();
            $table->string('status', 20)->default('queued'); // queued, sent, delivered, failed
            $table->jsonb('provider_response')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
        });

        // ── System Templates (Super Admin default templates) ──
        Schema::create('system_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 255);
            $table->string('category', 50);
            $table->text('content')->nullable();
            $table->jsonb('merge_fields')->nullable();
            $table->jsonb('settings')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestampsTz();
        });

        // ── AI Conversations ──
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->uuid('user_id');
            $table->string('module_context', 50)->nullable(); // residents, documents, cases, finance, etc.
            $table->jsonb('messages')->nullable(); // [{role, content, timestamp}]
            $table->integer('tokens_used')->default(0);
            $table->decimal('credit_cost', 6, 4)->default(0);
            $table->string('status', 20)->default('active');
            $table->timestampsTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index('barangay_id');
            $table->index(['user_id', 'module_context']);
        });

        // ── Blockchain Records ──
        Schema::create('blockchain_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');
            $table->string('record_type', 50); // document, case_settlement, ordinance, resolution
            $table->uuid('record_id');
            $table->string('data_hash', 128); // SHA-512 hash
            $table->string('transaction_hash', 128)->nullable();
            $table->string('chain', 30)->nullable(); // ethereum_l2, hyperledger
            $table->bigInteger('block_number')->nullable();
            $table->timestampTz('verified_at')->nullable();
            $table->string('verification_url', 500)->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->index('barangay_id');
            $table->index(['record_type', 'record_id']);
            $table->index('data_hash');
        });

        // ── Audit Log ──
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->string('action', 50); // create, update, delete, view, export, print
            $table->string('resource_type', 100);
            $table->uuid('resource_id')->nullable();
            $table->jsonb('changes')->nullable(); // {field: {old, new}}
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('module', 50)->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['resource_type', 'resource_id']);
            $table->index(['user_id', 'created_at']);
            $table->index('barangay_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('blockchain_records');
        Schema::dropIfExists('ai_conversations');
        Schema::dropIfExists('system_templates');
        Schema::dropIfExists('sms_transactions');
        Schema::dropIfExists('billings');
        Schema::dropIfExists('subscription_plans');
    }
};
