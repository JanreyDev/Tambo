<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Psgc\PsgcBarangay;
use App\Models\Psgc\PsgcCity;
use App\Models\Psgc\PsgcProvince;
use Illuminate\Http\JsonResponse;

/**
 * PSGC (Philippine Standard Geographic Code) lookup endpoints.
 * Used by founder dashboard for cascading location dropdowns.
 */
class PsgcController extends Controller
{
    /**
     * List all provinces sorted by name.
     *
     * GET /api/v1/psgc/provinces
     */
    public function provinces(): JsonResponse
    {
        $provinces = PsgcProvince::query()
            ->select('psgc_code', 'name', 'region_psgc')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $provinces]);
    }

    /**
     * List all cities/municipalities under a province.
     *
     * GET /api/v1/psgc/provinces/{code}/cities
     */
    public function cities(string $code): JsonResponse
    {
        if (! preg_match('/^\d{9,10}$/', $code)) {
            return response()->json(['message' => 'Invalid PSGC code.'], 400);
        }

        $cities = PsgcCity::query()
            ->where('province_psgc', $code)
            ->select('psgc_code', 'name', 'city_class', 'zip_code')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $cities]);
    }

    /**
     * List all barangays under a city/municipality with population.
     *
     * GET /api/v1/psgc/cities/{code}/barangays
     */
    public function barangays(string $code): JsonResponse
    {
        if (! preg_match('/^\d{9,10}$/', $code)) {
            return response()->json(['message' => 'Invalid PSGC code.'], 400);
        }

        $barangays = PsgcBarangay::query()
            ->where('city_psgc', $code)
            ->select('psgc_code', 'name', 'population', 'population_year')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $barangays]);
    }
}
