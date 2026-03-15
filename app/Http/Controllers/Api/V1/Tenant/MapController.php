<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Resident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MapController extends Controller
{
    /**
     * GET /api/v1/map/residents
     *
     * Returns all residents that have latitude + longitude set.
     * Lightweight payload — only fields needed to render a map pin.
     */
    public function residents(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $mapped = Resident::where('barangay_id', $barangayId)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->select([
                'id', 'resident_number',
                'first_name', 'middle_name', 'last_name', 'extension_name',
                'purok', 'sex', 'status',
                'latitude', 'longitude',
            ])
            ->orderBy('last_name')
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'resident_number' => $r->resident_number,
                'full_name' => trim(
                    $r->last_name.', '.
                    $r->first_name.
                    ($r->middle_name ? ' '.mb_substr($r->middle_name, 0, 1).'.' : '').
                    ($r->extension_name ? ' '.$r->extension_name : '')
                ),
                'purok' => $r->purok,
                'sex' => $r->sex,
                'status' => $r->status?->value,
                'latitude' => (float) $r->latitude,
                'longitude' => (float) $r->longitude,
            ]);

        $total = Resident::where('barangay_id', $barangayId)->count();

        return response()->json([
            'residents' => $mapped,
            'total' => $total,
            'mapped' => $mapped->count(),
        ]);
    }

    /**
     * GET /api/v1/map/stats
     *
     * Returns aggregate statistics for the map sidebar:
     * - total / mapped / unmapped counts
     * - per-purok breakdown (total + mapped)
     * - per-status breakdown
     */
    public function stats(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $total = Resident::where('barangay_id', $barangayId)->count();
        $mapped = Resident::where('barangay_id', $barangayId)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->count();

        // Per-purok: total residents + how many are mapped
        $byPurok = Resident::where('barangay_id', $barangayId)
            ->select([
                DB::raw("COALESCE(NULLIF(TRIM(purok), ''), 'Unclassified') as purok_name"),
                DB::raw('COUNT(*) as total'),
                DB::raw('COUNT(latitude) as mapped'),
            ])
            ->groupBy('purok_name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'purok' => $r->purok_name,
                'total' => (int) $r->total,
                'mapped' => (int) $r->mapped,
            ]);

        // Per-status
        $byStatus = Resident::where('barangay_id', $barangayId)
            ->select([
                DB::raw("COALESCE(NULLIF(TRIM(status::text), ''), 'unknown') as status_value"),
                DB::raw('COUNT(*) as count'),
            ])
            ->groupBy('status_value')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($r) => [
                'status' => $r->status_value,
                'count' => (int) $r->count,
            ]);

        return response()->json([
            'total' => $total,
            'mapped' => $mapped,
            'unmapped' => $total - $mapped,
            'coverage' => $total > 0 ? round(($mapped / $total) * 100, 1) : 0,
            'by_purok' => $byPurok,
            'by_status' => $byStatus,
        ]);
    }
}
