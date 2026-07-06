<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Founder;

use App\Http\Controllers\Controller;
use App\Services\BcmpService;
use Illuminate\Http\JsonResponse;

/**
 * Proxy controller for PSGC (Philippine Standard Geographic Code) lookups.
 * Forwards requests to bcmp-api's PSGC endpoints for the founder dashboard's
 * cascading location dropdowns during barangay onboarding.
 */
class PsgcProxyController extends Controller
{
    public function __construct(
        private readonly BcmpService $bcmp,
    ) {}

    /**
     * List all provinces.
     *
     * GET /api/v1/founder/psgc/provinces
     */
    public function provinces(): JsonResponse
    {
        $result = $this->bcmp->get('api/v1/psgc/provinces');

        return response()->json($result['data'], $result['status']);
    }

    /**
     * List cities/municipalities under a province.
     *
     * GET /api/v1/founder/psgc/provinces/{code}/cities
     */
    public function cities(string $code): JsonResponse
    {
        if (! preg_match('/^\d{9,10}$/', $code)) {
            return response()->json(['message' => 'Invalid PSGC code.'], 400);
        }

        $result = $this->bcmp->get("api/v1/psgc/provinces/{$code}/cities");

        return response()->json($result['data'], $result['status']);
    }

    /**
     * List barangays under a city/municipality.
     *
     * GET /api/v1/founder/psgc/cities/{code}/barangays
     */
    public function barangays(string $code): JsonResponse
    {
        if (! preg_match('/^\d{9,10}$/', $code)) {
            return response()->json(['message' => 'Invalid PSGC code.'], 400);
        }

        $result = $this->bcmp->get("api/v1/psgc/cities/{$code}/barangays");

        return response()->json($result['data'], $result['status']);
    }
}
