<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('issued_documents', function (Blueprint $table): void {
            DB::statement('ALTER TABLE issued_documents ALTER COLUMN approved_by_left TYPE VARCHAR(255) USING approved_by_left::varchar');
            DB::statement('ALTER TABLE issued_documents ALTER COLUMN approved_by_right TYPE VARCHAR(255) USING approved_by_right::varchar');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('issued_documents', function (Blueprint $table): void {
            DB::statement('ALTER TABLE issued_documents ALTER COLUMN approved_by_left TYPE UUID USING approved_by_left::uuid');
            DB::statement('ALTER TABLE issued_documents ALTER COLUMN approved_by_right TYPE UUID USING approved_by_right::uuid');
        });
    }
};
