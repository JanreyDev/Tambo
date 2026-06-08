<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // GeoJSON FeatureCollection or Polygon representing the barangay boundary.
        // Auto-fetched from OpenStreetMap Nominatim on barangay creation via BarangayObserver.
        // Used by the Map page to draw the boundary polygon and detect out-of-barangay pins.
        Schema::table('barangays', function (Blueprint $table) {
            if (! Schema::hasColumn('barangays', 'boundary_geojson')) {
                $table->jsonb('boundary_geojson')->nullable()->after('map_credit_balance');
            }
            if (! Schema::hasColumn('barangays', 'boundary_fetched_at')) {
                $table->timestampTz('boundary_fetched_at')->nullable()->after('boundary_geojson');
            }
            if (! Schema::hasColumn('barangays', 'boundary_source')) {
                $table->string('boundary_source', 32)->nullable()->after('boundary_fetched_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('barangays', function (Blueprint $table) {
            $table->dropColumn(['boundary_geojson', 'boundary_fetched_at', 'boundary_source']);
        });
    }
};
