<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Admin\Barangay;
use App\Models\Tenant\Disaster\Evacuation;
use App\Models\Tenant\Disaster\HazardPin;
use App\Models\Tenant\Resident;
use App\Models\Tenant\Records\Establishment;
use App\Models\Tenant\Records\Household;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class MapController extends Controller
{
    /**
     * GET /api/v1/map/residents
     *
     * Returns one pin per household that has at least one ACTIVE resident.
     * Location priority:
     *   1. household.latitude / longitude  (set via household form)
     *   2. Head resident's latitude / longitude (households.head_resident_id)
     *   3. First ACTIVE member resident's latitude / longitude
     *
     * Response key kept as "residents" for frontend compatibility.
     */
    public function residents(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $barangay = Barangay::select(['id', 'name', 'city_municipality', 'province', 'latitude', 'longitude', 'boundary_geojson', 'boundary_fetched_at', 'boundary_source'])
            ->find($barangayId);

        // Pull households that still have at least one ACTIVE resident.
        // This keeps map totals aligned with the active Residents page.
        $households = Household::where('barangay_id', $barangayId)
            ->whereNull('deleted_at')
            ->whereExists(function ($q) use ($barangayId) {
                $q->select(DB::raw(1))
                    ->from('residents')
                    ->whereColumn('residents.household_id', 'households.id')
                    ->where('residents.barangay_id', $barangayId)
                    ->whereNull('residents.deleted_at')
                    ->where('residents.status', 'active');
            })
            ->select([
                'id', 'household_number', 'household_name',
                'head_resident_id', 'purok', 'address', 'member_count',
                'latitude', 'longitude',
            ])
            ->with(['headResident:id,first_name,middle_name,last_name,extension_name'])
            ->orderBy('household_number')
            ->get();

        // For households without own coords, first try head resident coordinates.
        // Keyed by resident_id (head_resident_id) -> {lat, lng}
        $headResidentIds = $households
            ->whereNull('latitude')
            ->pluck('head_resident_id')
            ->filter()
            ->unique()
            ->values();

        $headCoords = [];
        if ($headResidentIds->isNotEmpty()) {
            Resident::whereIn('id', $headResidentIds)
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->select(['id', 'latitude', 'longitude'])
                ->get()
                ->each(function ($r) use (&$headCoords) {
                    $headCoords[$r->id] = [
                        'lat' => (float) $r->latitude,
                        'lng' => (float) $r->longitude,
                    ];
                });
        }

        // Final fallback: first ACTIVE member with coordinates per household.
        // Keyed by household_id -> {lat, lng}
        $householdIdsMissingCoords = $households
            ->filter(function ($h) use ($headCoords) {
                return $h->latitude === null && (! $h->head_resident_id || ! isset($headCoords[$h->head_resident_id]));
            })
            ->pluck('id')
            ->values();

        $memberCoords = [];
        if ($householdIdsMissingCoords->isNotEmpty()) {
            Resident::whereIn('household_id', $householdIdsMissingCoords)
                ->whereNull('deleted_at')
                ->where('status', 'active')
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->select(['household_id', 'latitude', 'longitude'])
                ->orderBy('household_id')
                ->get()
                ->each(function ($r) use (&$memberCoords) {
                    if (! isset($memberCoords[$r->household_id])) {
                        $memberCoords[$r->household_id] = [
                            'lat' => (float) $r->latitude,
                            'lng' => (float) $r->longitude,
                        ];
                    }
                });
        }

        // Last fallback: geocode household address text (Nominatim) when no pin exists.
        // Keep this bounded to avoid slow map loads.
        $householdIdsForGeocode = $households
            ->filter(function ($h) use ($headCoords, $memberCoords) {
                if ($h->latitude !== null && $h->longitude !== null) {
                    return false;
                }
                if ($h->head_resident_id && isset($headCoords[$h->head_resident_id])) {
                    return false;
                }

                return ! isset($memberCoords[$h->id]);
            })
            ->take(8);

        foreach ($householdIdsForGeocode as $h) {
            $coords = $this->geocodeHouseholdAddress($h, $barangay);
            if (! $coords) {
                continue;
            }

            // Save to household once so next map load is fast and stable.
            $h->forceFill([
                'latitude' => $coords['lat'],
                'longitude' => $coords['lng'],
            ])->save();

            $memberCoords[$h->id] = $coords;
        }

        $hasExactLocation = function ($h) use ($headCoords, $memberCoords): bool {
            if ($h->latitude !== null && $h->longitude !== null) {
                return true;
            }
            if ($h->head_resident_id && isset($headCoords[$h->head_resident_id])) {
                return true;
            }

            return isset($memberCoords[$h->id]);
        };

        $mappedExactCount = $households->filter($hasExactLocation)->count();

        // Build map pins for every active household:
        // - exact coordinates when available
        // - otherwise a deterministic approximate coordinate near barangay center
        $fallbackCenterLat = $barangay && $barangay->latitude !== null ? (float) $barangay->latitude : 14.5995;
        $fallbackCenterLng = $barangay && $barangay->longitude !== null ? (float) $barangay->longitude : 120.9842;

        $pins = $households->map(function ($h) use ($headCoords, $memberCoords, $fallbackCenterLat, $fallbackCenterLng) {
            $isEstimated = false;
            if ($h->latitude !== null && $h->longitude !== null) {
                $lat = (float) $h->latitude;
                $lng = (float) $h->longitude;
            } elseif ($h->head_resident_id && isset($headCoords[$h->head_resident_id])) {
                $lat = $headCoords[$h->head_resident_id]['lat'];
                $lng = $headCoords[$h->head_resident_id]['lng'];
            } elseif (isset($memberCoords[$h->id])) {
                $lat = $memberCoords[$h->id]['lat'];
                $lng = $memberCoords[$h->id]['lng'];
            } else {
                $isEstimated = true;
                ['lat' => $lat, 'lng' => $lng] = $this->estimatedHouseholdPoint($h->id, $fallbackCenterLat, $fallbackCenterLng);
            }

            return [
                'id'              => $h->id,
                'resident_number' => $h->household_number,
                'full_name'       => $h->household_name
                    ?: ($h->headResident
                        ? trim(
                            $h->headResident->last_name.', '.
                            $h->headResident->first_name.
                            ($h->headResident->middle_name ? ' '.mb_substr($h->headResident->middle_name, 0, 1).'.' : '').
                            ($h->headResident->extension_name ? ' '.$h->headResident->extension_name : '')
                        )
                        : 'HH-'.$h->household_number),
                'purok'        => $h->purok,
                'member_count' => (int) $h->member_count,
                'address'      => $h->address,
                'sex'          => null,
                'status'       => 'active',
                'latitude'     => $lat,
                'longitude'    => $lng,
                'is_estimated' => $isEstimated,
            ];
        })->values();

        $total = $households->count();

        return response()->json([
            'residents' => $pins,
            'total'     => $total,
            // "mapped" is visual map availability (pins shown), including estimated fallback points.
            'mapped'    => $pins->count(),
            // Exact mapped count (real saved coordinates only) for data-quality use.
            'mapped_exact' => $mappedExactCount,
            'barangay'  => $barangay ? [
                'id'                  => $barangay->id,
                'name'                => $barangay->name,
                'latitude'            => $barangay->latitude !== null ? (float) $barangay->latitude : null,
                'longitude'           => $barangay->longitude !== null ? (float) $barangay->longitude : null,
                'boundary_geojson'    => $barangay->boundary_geojson,
                'boundary_fetched_at' => $barangay->boundary_fetched_at?->toIso8601String(),
                'boundary_source'     => $barangay->boundary_source,
            ] : null,
        ]);
    }

    /**
     * Deterministic fallback point near barangay center (for households without coords).
     *
     * @return array{lat: float, lng: float}
     */
    private function estimatedHouseholdPoint(string $householdId, float $centerLat, float $centerLng): array
    {
        $seed = crc32($householdId);
        $angle = deg2rad($seed % 360);
        // 0.00035..0.00115 (~35m..115m from center)
        $radius = 0.00035 + (($seed % 800) / 1000000);

        return [
            'lat' => $centerLat + (sin($angle) * $radius),
            'lng' => $centerLng + (cos($angle) * $radius),
        ];
    }

    /**
     * Resolve household coordinates from address text using Nominatim.
     *
     * @return array{lat: float, lng: float}|null
     */
    private function geocodeHouseholdAddress(Household $household, ?Barangay $barangay): ?array
    {
        $address = trim((string) ($household->address ?? ''));
        $purok = trim((string) ($household->purok ?? ''));
        $city = trim((string) ($barangay->city_municipality ?? ''));
        $province = trim((string) ($barangay->province ?? ''));
        $barangayName = trim((string) ($barangay->name ?? ''));

        if ($address === '' && $purok === '') {
            return null;
        }

        $parts = array_values(array_filter([
            $address,
            $purok !== '' ? "Purok {$purok}" : null,
            $barangayName !== '' ? "Barangay {$barangayName}" : null,
            $city,
            $province,
            'Philippines',
        ]));

        $query = implode(', ', $parts);
        $cacheKey = 'map:geocode:'.sha1(strtolower($query));

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($query) {
            try {
                $res = Http::withHeaders([
                    'User-Agent' => 'BCMP-kapitan.ph (support@primex.ventures)',
                    'Accept' => 'application/json',
                    'Accept-Language' => 'en',
                ])->timeout(8)->retry(1, 300)->get('https://nominatim.openstreetmap.org/search', [
                    'q' => $query,
                    'format' => 'jsonv2',
                    'countrycodes' => 'ph',
                    'limit' => 1,
                    'addressdetails' => 0,
                ]);

                if (! $res->successful()) {
                    return null;
                }

                $rows = $res->json();
                if (! is_array($rows) || empty($rows[0]['lat']) || empty($rows[0]['lon'])) {
                    return null;
                }

                return [
                    'lat' => (float) $rows[0]['lat'],
                    'lng' => (float) $rows[0]['lon'],
                ];
            } catch (\Throwable) {
                return null;
            }
        });
    }

    /**
     * GET /api/v1/map/layers
     *
     * Returns supplementary overlays for the map page:
     * - hazard_pins (flood / fire / no-build zones)
     * - evacuation_centers (active evacuation sites with capacity)
     * - establishments (registered businesses)
     *
     * Each payload is intentionally minimal to keep the response light.
     * Frontend toggles each layer independently.
     */
    public function layers(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $hazardPins = HazardPin::where('barangay_id', $barangayId)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->select(['id', 'hazard_type', 'name', 'description', 'latitude', 'longitude', 'severity', 'status'])
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'type' => $p->hazard_type,
                'name' => $p->name,
                'description' => $p->description,
                'severity' => $p->severity,
                'status' => $p->status,
                'latitude' => (float) $p->latitude,
                'longitude' => (float) $p->longitude,
            ]);

        $evacuationCenters = Evacuation::where('barangay_id', $barangayId)
            ->whereNotNull('center_latitude')
            ->whereNotNull('center_longitude')
            ->select(['id', 'evacuation_name', 'cause_type', 'evacuation_center', 'center_latitude', 'center_longitude', 'evacuee_count', 'family_count', 'status'])
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'name' => $e->evacuation_center ?: $e->evacuation_name,
                'event_name' => $e->evacuation_name,
                'cause_type' => $e->cause_type,
                'status' => $e->status,
                'evacuee_count' => (int) $e->evacuee_count,
                'family_count' => (int) $e->family_count,
                'latitude' => (float) $e->center_latitude,
                'longitude' => (float) $e->center_longitude,
            ]);

        $establishments = Establishment::where('barangay_id', $barangayId)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->select(['id', 'business_name', 'business_type', 'latitude', 'longitude', 'status'])
            ->limit(500)
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'name' => $e->business_name,
                'type' => $e->business_type,
                'status' => $e->status,
                'latitude' => (float) $e->latitude,
                'longitude' => (float) $e->longitude,
            ]);

        return response()->json([
            'hazard_pins' => $hazardPins,
            'evacuation_centers' => $evacuationCenters,
            'establishments' => $establishments,
        ]);
    }

    /**
     * GET /api/v1/map/stats
     *
     * Returns aggregate statistics for the map sidebar based on households:
     * - total / mapped / unmapped household counts
     *   A household counts as "mapped" if it has its own lat/lng OR its head
     *   resident has lat/lng.
     * - per-purok breakdown (total + mapped)
     * - by_status kept for interface compat (always active)
     */
    public function stats(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $total = Household::where('households.barangay_id', $barangayId)
            ->whereNull('households.deleted_at')
            ->whereExists(function ($q) use ($barangayId) {
                $q->select(DB::raw(1))
                    ->from('residents')
                    ->whereColumn('residents.household_id', 'households.id')
                    ->where('residents.barangay_id', $barangayId)
                    ->whereNull('residents.deleted_at')
                    ->where('residents.status', 'active');
            })
            ->count();

        // Count as exactly mapped: household has full coords, OR head resident has full coords,
        // OR any ACTIVE member has full coords.
        $exactMapped = Household::where('households.barangay_id', $barangayId)
            ->whereNull('households.deleted_at')
            ->whereExists(function ($q) use ($barangayId) {
                $q->select(DB::raw(1))
                    ->from('residents')
                    ->whereColumn('residents.household_id', 'households.id')
                    ->where('residents.barangay_id', $barangayId)
                    ->whereNull('residents.deleted_at')
                    ->where('residents.status', 'active');
            })
            ->leftJoin('residents as hr', 'hr.id', '=', 'households.head_resident_id')
            ->where(function ($q) {
                $q->where(function ($qq) {
                    $qq->whereNotNull('households.latitude')
                        ->whereNotNull('households.longitude');
                })->orWhere(function ($qq) {
                    $qq->whereNotNull('hr.latitude')
                        ->whereNotNull('hr.longitude');
                })->orWhereExists(function ($qq) {
                    $qq->select(DB::raw(1))
                        ->from('residents as rm')
                        ->whereColumn('rm.household_id', 'households.id')
                        ->whereNull('rm.deleted_at')
                        ->where('rm.status', 'active')
                        ->whereNotNull('rm.latitude')
                        ->whereNotNull('rm.longitude');
                });
            })
            ->count();

        // Per-purok: total households + how many are mapped (own or head resident coords)
        $byPurok = Household::where('households.barangay_id', $barangayId)
            ->whereNull('households.deleted_at')
            ->whereExists(function ($q) use ($barangayId) {
                $q->select(DB::raw(1))
                    ->from('residents')
                    ->whereColumn('residents.household_id', 'households.id')
                    ->where('residents.barangay_id', $barangayId)
                    ->whereNull('residents.deleted_at')
                    ->where('residents.status', 'active');
            })
            ->leftJoin('residents as hr2', 'hr2.id', '=', 'households.head_resident_id')
            ->select([
                DB::raw("COALESCE(NULLIF(TRIM(households.purok), ''), 'Unclassified') as purok_name"),
                DB::raw('COUNT(*) as total'),
                DB::raw("COUNT(CASE WHEN ((households.latitude IS NOT NULL AND households.longitude IS NOT NULL) OR (hr2.latitude IS NOT NULL AND hr2.longitude IS NOT NULL) OR EXISTS (SELECT 1 FROM residents rm2 WHERE rm2.household_id = households.id AND rm2.deleted_at IS NULL AND rm2.status = 'active' AND rm2.latitude IS NOT NULL AND rm2.longitude IS NOT NULL)) THEN 1 END) as mapped_exact"),
            ])
            ->groupBy('purok_name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'purok'  => $r->purok_name,
                'total'  => (int) $r->total,
                // Visual mapped in each purok (pins shown) includes estimated fallback.
                'mapped' => (int) $r->total,
                'mapped_exact' => (int) $r->mapped_exact,
            ]);

        // Visual mapped/unmapped/coverage should match what users see on the map.
        $mapped = $total;
        $unmapped = 0;
        $coverage = $total > 0 ? 100.0 : 0.0;

        return response()->json([
            'total'     => $total,
            'mapped'    => $mapped,
            'unmapped'  => $unmapped,
            'coverage'  => $coverage,
            // Keep exact metrics available for future UI/QA.
            'mapped_exact' => $exactMapped,
            'unmapped_exact' => $total - $exactMapped,
            'coverage_exact' => $total > 0 ? round(($exactMapped / $total) * 100, 1) : 0,
            'by_purok'  => $byPurok,
            'by_status' => [['status' => 'active', 'count' => $total]],
        ]);
    }
}
