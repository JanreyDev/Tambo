<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Enhance ai_conversations for Mabini AI:
 * - Add title, input/output token tracking columns
 * - Add RLS policy (was missing from 000019)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_conversations', function (Blueprint $table) {
            $table->string('title', 255)->nullable()->after('user_id');
            $table->integer('input_tokens_used')->default(0)->after('tokens_used');
            $table->integer('output_tokens_used')->default(0)->after('input_tokens_used');
        });

        // Add RLS policy for ai_conversations (was missing from 000019)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY');

            DB::statement("
                CREATE POLICY tenant_isolation ON ai_conversations
                FOR ALL
                USING (
                    barangay_id::text = current_setting('app.current_barangay_id', true)
                    OR current_setting('app.current_barangay_id', true) = ''
                )
                WITH CHECK (
                    barangay_id::text = current_setting('app.current_barangay_id', true)
                )
            ");

            DB::statement('ALTER TABLE ai_conversations FORCE ROW LEVEL SECURITY');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP POLICY IF EXISTS tenant_isolation ON ai_conversations');
            DB::statement('ALTER TABLE ai_conversations DISABLE ROW LEVEL SECURITY');
        }

        Schema::table('ai_conversations', function (Blueprint $table) {
            $table->dropColumn(['title', 'input_tokens_used', 'output_tokens_used']);
        });
    }
};
