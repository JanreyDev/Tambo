<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Make email nullable -- onboarded kapitans may not have email initially
        DB::statement('ALTER TABLE users ALTER COLUMN email DROP NOT NULL');
    }

    public function down(): void
    {
        // Set empty emails to placeholder before making NOT NULL again
        DB::statement("UPDATE users SET email = 'placeholder_' || id || '@kapitan.ph' WHERE email IS NULL");
        DB::statement('ALTER TABLE users ALTER COLUMN email SET NOT NULL');
    }
};
