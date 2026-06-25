<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Admin\Barangay;
use App\Models\Tenant\Disaster\Evacuation;
use App\Models\Tenant\Disaster\HazardPin;
use App\Models\Tenant\Records\Establishment;
use App\Models\Tenant\Records\Household;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MapController extends Controller
{
    /**
     * GET /api/v1/map/residents
     *
     * Returns one pin per household that has a locatable position.
     * Location priority:
     *   1. household.latitude / longitude  (set via household form)
     *   2. Any member resident's latitude / longitude where resident.household_id = household.id
     *
     * Response key kept as "residents" for frontend compatibility.
     */
    public function residents(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        // Pull all households + their own coords
        $households = Household::where('barangay_id', $barangayId)
            ->whereNull('deleted_at')
            ->select([
                'id', 'household_number', 'household_name',
                'head_resident_id', 'purok', 'address', 'member_count',
                'latitude', 'longitude',
            ])
            ->with(['headResident:id,first_name,middle_name,last_name,extension_name'])
            ->orderBy('household_number')
            ->get();

        // For households without own coords, find the first member who has coords
        // Keyed by household_id → {lat, lng}
        $householdIds = $households->whereNull('latitude')->pluck('id');
        $memberCoords = [];
        if ($householdIds->isNotEmpty()) {
            \App\Models\Tenant\Resident::whereIn('household_id', $householdIds)
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->select(['household_id', 'latitude', 'longitude'])
                ->orderBy('household_id')
                ->get()
                ->each(function ($r) use (&$memberCoords) {
                    // Keep only the first coord found per household
                    if (!isset($memberCoords[$r->household_id])) {
                        $memberCoords[$r->household_id] = [
                            'lat' => (float) $r->latitude,
                            'lng' => (float) $r->longitude,
                        ];
                    }
                });
        }

        // Build pin list — only households that have a location
        $mapped = $households->filter(function ($h) use ($memberCoords) {
            return $h->latitude !== null || isset($memberCoords[$h->id]);
        })->map(function ($h) use ($memberCoords) {
            $lat = $h->latitude !== null
                ? (float) $h->latitude
                : $memberCoords[$h->id]['lat'];
            $lng = $h->longitude !== null
                ? (float) $h->longitude
                : $memberCoords[$h->id]['lng'];

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
            ];
        })->values();

        $total = $households->count();

        $barangay = Barangay::select(['id', 'name', 'latitude', 'longitude', 'boundary_geojson', 'boundary_fetched_at', 'boundary_source'])
            ->find($barangayId);

        return response()->json([
            'residents' => $mapped,
            'total'     => $total,
            'mapped'    => $mapped->count(),
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

        $total = Household::where('barangay_id', $barangayId)->whereNull('deleted_at')->count();

        // Count as mapped: household has own coords OR its head resident has coords
        $mapped = Household::where('households.barangay_id', $barangayId)
            ->whereNull('households.deleted_at')
            ->leftJoin('residents as hr', 'hr.id', '=', 'households.head_resident_id')
            ->where(function ($q) {
                $q->whereNotNull('households.latitude')
                  ->orWhereNotNull('hr.latitude');
            })
            ->count();

        // Per-purok: total households + how many are mapped (own or head resident coords)
        $byPurok = Household::where('households.barangay_id', $barangayId)
            ->whereNull('households.deleted_at')
            ->leftJoin('residents as hr2', 'hr2.id', '=', 'households.head_resident_id')
            ->select([
                DB::raw("COALESCE(NULLIF(TRIM(households.purok), ''), 'Unclassified') as purok_name"),
                DB::raw('COUNT(*) as total'),
                DB::raw('COUNT(CASE WHEN households.latitude IS NOT NULL OR hr2.latitude IS NOT NULL THEN 1 END) as mapped'),
            ])
            ->groupBy('purok_name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'purok'  => $r->purok_name,
                'total'  => (int) $r->total,
                'mapped' => (int) $r->mapped,
            ]);

        return response()->json([
            'total'     => $total,
            'mapped'    => $mapped,
            'unmapped'  => $total - $mapped,
            'coverage'  => $total > 0 ? round(($mapped / $total) * 100, 1) : 0,
            'by_purok'  => $byPurok,
            'by_status' => [['status' => 'active', 'count' => $total]],
        ]);
    }
}
