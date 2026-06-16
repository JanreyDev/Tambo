<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\BarangayAddressEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Per-barangay learned autocomplete entries for the Resident form.
 *
 * Replaces the hardcoded `default*Entries` arrays that used to live in the
 * Residents page. Frontend usage:
 *
 *   GET  /address-entries?kind=purok                     → list entries for kind
 *   POST /address-entries  { kind, canonical }           → upsert + bump count
 *
 * Tenant isolation is enforced by `barangay_id = current user's barangay`.
 */
class AddressEntryController extends Controller
{
    private const ALLOWED_KINDS = [
        'purok', 'street',
        'citizenship', 'religion', 'ethnicity',
        'occupation', 'skill', 'position', 'employer',
        'course', 'school', 'place_of_birth',
        'sector_other', 'business_type', 'emergency_rel',
    ];

    /**
     * GET /api/v1/address-entries
     *
     * Optional ?kind filter. Returns all entries for the current barangay,
     * ordered by count desc (most-used first).
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kind' => 'sometimes|string|in:' . implode(',', self::ALLOWED_KINDS),
        ]);

        $barangayId = $request->user()->barangay_id;

        $query = BarangayAddressEntry::where('barangay_id', $barangayId);

        if (isset($validated['kind'])) {
            $query->where('kind', $validated['kind']);
        }

        $entries = $query
            ->orderByDesc('count')
            ->orderBy('canonical')
            ->get(['id', 'kind', 'canonical', 'count', 'aliases']);

        return response()->json(['entries' => $entries]);
    }

    /**
     * POST /api/v1/address-entries
     *
     * Upsert by (barangay_id, kind, canonical). If the entry exists, bump
     * count and optionally append a new alias. If it's new, create with count=1.
     *
     * Body: { kind: string, canonical: string, alias?: string }
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kind' => 'required|string|in:' . implode(',', self::ALLOWED_KINDS),
            'canonical' => 'required|string|max:200',
            'alias' => 'sometimes|string|max:200',
        ]);

        $barangayId = $request->user()->barangay_id;
        $canonical = trim($validated['canonical']);
        $alias = isset($validated['alias']) ? mb_strtolower(trim($validated['alias'])) : null;

        if ($canonical === '') {
            return response()->json(['message' => 'Canonical value cannot be empty.'], 422);
        }

        $entry = DB::transaction(function () use ($barangayId, $validated, $canonical, $alias) {
            $existing = BarangayAddressEntry::where('barangay_id', $barangayId)
                ->where('kind', $validated['kind'])
                ->where('canonical', $canonical)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                $existing->count = $existing->count + 1;
                if ($alias !== null && $alias !== mb_strtolower($canonical)) {
                    $aliases = $existing->aliases ?? [];
                    if (! in_array($alias, $aliases, true)) {
                        $aliases[] = $alias;
                        $existing->aliases = $aliases;
                    }
                }
                $existing->save();

                return $existing;
            }

            return BarangayAddressEntry::create([
                'barangay_id' => $barangayId,
                'kind' => $validated['kind'],
                'canonical' => $canonical,
                'count' => 1,
                'aliases' => $alias !== null && $alias !== mb_strtolower($canonical) ? [$alias] : [],
            ]);
        });

        return response()->json(['entry' => $entry], 200);
    }
}
