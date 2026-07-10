<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * SOGIE sex/gender values (e.g. "transgender", "prefer not to say") exceed the
     * original varchar(10) column and cause insert failures.
     */
    public function up(): void
    {
        Schema::table('residents', function (Blueprint $table) {
            $table->string('sex', 30)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('residents', function (Blueprint $table) {
            $table->string('sex', 10)->nullable()->change();
        });
    }
};
