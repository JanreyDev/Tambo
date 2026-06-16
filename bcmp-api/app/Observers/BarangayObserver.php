<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Admin\Barangay;
use App\Services\BoundaryFetcherService;
use Illuminate\Support\Facades\Log;

class BarangayObserver
{
    public function __construct(private readonly BoundaryFetcherService $boundaryFetcher) {}

    /**
     * On barangay creation (onboarding), fire-and-forget the OSM boundary fetch.
     *
     * Runs synchronously today. Once Horizon is wired we'll move to a queued job
     * so onboarding doesn't wait on Nominatim (15s timeout x 4 queries worst case).
     */
    public function created(Barangay $barangay): void
    {
        if ($barangay->boundary_geojson !== null) {
            return;
        }

        try {
            $this->boundaryFetcher->fetchAndStore($barangay);
        } catch (\Throwable $e) {
            Log::warning('Boundary auto-fetch on barangay creation failed', [
                'barangay_id' => $barangay->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
