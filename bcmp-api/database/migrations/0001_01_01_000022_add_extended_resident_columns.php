<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('residents', function (Blueprint $table) {
            // JSONB arrays for structured data
            $table->jsonb('work_history')->nullable()->after('education_details');
            $table->jsonb('business_details')->nullable()->after('work_history');
            $table->jsonb('pet_records')->nullable()->after('business_details');
            $table->jsonb('assistance_history')->nullable()->after('pet_records');
            $table->jsonb('relative_links')->nullable()->after('assistance_history');

            // Barangay role (kagawad, tanod, etc.)
            $table->string('barangay_position', 100)->nullable()->after('relative_links');
            $table->date('barangay_role_start')->nullable()->after('barangay_position');
            $table->date('barangay_role_end')->nullable()->after('barangay_role_start');

            // Additional personal fields
            $table->string('livelihood_type', 50)->nullable()->after('source_of_income');
            $table->text('skills')->nullable()->after('livelihood_type');
            $table->text('health_history')->nullable()->after('skills');
            $table->boolean('is_organ_donor')->default(false)->after('health_history');
            $table->string('sector_other', 255)->nullable()->after('is_organ_donor');
            $table->text('other_remarks')->nullable()->after('sector_other');

            // Government ID expiry dates
            $table->date('philhealth_expiry')->nullable()->after('philhealth_number_encrypted');
            $table->date('sss_gsis_expiry')->nullable()->after('sss_gsis_number_encrypted');
            $table->date('pagibig_expiry')->nullable()->after('pagibig_number_encrypted');
            $table->date('tin_expiry')->nullable()->after('tin_number_encrypted');
            $table->text('pwd_id_encrypted')->nullable()->after('tin_expiry');
            $table->date('pwd_id_expiry')->nullable()->after('pwd_id_encrypted');
            $table->text('senior_citizen_id_encrypted')->nullable()->after('pwd_id_expiry');

            // Geo coordinates for address
            $table->decimal('latitude', 10, 8)->nullable()->after('zip_code');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
        });
    }

    public function down(): void
    {
        Schema::table('residents', function (Blueprint $table) {
            $table->dropColumn([
                'work_history', 'business_details', 'pet_records',
                'assistance_history', 'relative_links',
                'barangay_position', 'barangay_role_start', 'barangay_role_end',
                'livelihood_type', 'skills', 'health_history', 'is_organ_donor',
                'sector_other', 'other_remarks',
                'philhealth_expiry', 'sss_gsis_expiry', 'pagibig_expiry', 'tin_expiry',
                'pwd_id_encrypted', 'pwd_id_expiry', 'senior_citizen_id_encrypted',
                'latitude', 'longitude',
            ]);
        });
    }
};
