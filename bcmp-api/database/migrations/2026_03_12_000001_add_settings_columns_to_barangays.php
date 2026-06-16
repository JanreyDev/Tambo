<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barangays', function (Blueprint $table) {
            $table->string('motto', 500)->nullable()->after('website_url');
            $table->string('office_hours', 255)->nullable()->after('motto');
            $table->smallInteger('established_year')->nullable()->after('office_hours');
            $table->string('captain_name', 200)->nullable()->after('established_year');
            $table->jsonb('boundary_geojson')->nullable()->after('longitude');
            $table->boolean('setup_complete')->default(false)->after('boundary_geojson');
            $table->text('document_header_text')->nullable()->after('setup_complete');
            $table->text('document_footer_text')->nullable()->after('document_header_text');
            $table->string('sms_sender_name', 11)->nullable()->after('document_footer_text');
            $table->jsonb('notification_preferences')->nullable()->after('sms_sender_name');
        });
    }

    public function down(): void
    {
        Schema::table('barangays', function (Blueprint $table) {
            $table->dropColumn([
                'motto',
                'office_hours',
                'established_year',
                'captain_name',
                'boundary_geojson',
                'setup_complete',
                'document_header_text',
                'document_footer_text',
                'sms_sender_name',
                'notification_preferences',
            ]);
        });
    }
};
