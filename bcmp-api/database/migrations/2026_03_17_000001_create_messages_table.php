<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Internal barangay messaging (email-like inbox)
        // Will be upgraded to actual SMTP/IMAP when domain email is provisioned
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barangay_id');

            // Sender / Recipient
            $table->uuid('from_user_id')->nullable(); // null = system message
            $table->uuid('to_user_id')->nullable();   // null = broadcast to barangay
            $table->string('to_address', 255)->nullable(); // future: external email
            $table->string('cc_addresses', 1000)->nullable(); // comma-separated

            // Content
            $table->string('subject', 500);
            $table->longText('body');
            $table->jsonb('attachments')->nullable(); // [{file_id, name, size}]

            // State
            $table->string('folder', 20)->default('inbox'); // inbox, sent, draft, trash, starred, archive
            $table->boolean('is_read')->default(false);
            $table->boolean('is_starred')->default(false);
            $table->boolean('is_draft')->default(false);
            $table->timestampTz('sent_at')->nullable(); // null if draft
            $table->uuid('parent_message_id')->nullable(); // for threading

            $table->timestampsTz();
            $table->softDeletesTz();

            $table->foreign('barangay_id')->references('id')->on('barangays')->cascadeOnDelete();
            $table->foreign('from_user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('to_user_id')->references('id')->on('users')->nullOnDelete();
            $table->index('barangay_id');
            $table->index(['to_user_id', 'folder', 'is_read']);
            $table->index(['from_user_id', 'folder']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
