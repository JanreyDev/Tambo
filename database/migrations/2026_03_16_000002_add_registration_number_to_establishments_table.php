<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            // DTI or SEC registration number (optional)
            $table->string('registration_type', 10)->nullable()->after('exact_address'); // 'DTI' or 'SEC'
            $table->string('registration_number', 100)->nullable()->after('registration_type');
        });
    }

    public function down(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            $table->dropColumn(['registration_type', 'registration_number']);
        });
    }
};
