<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Judicial\KpCaseParty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KpCasePartyController extends Controller
{
    /**
     * List parties for KP cases.
     *
     * GET /api/v1/kp-case-parties
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = KpCaseParty::where('barangay_id', $barangayId);

        if ($caseId = $request->get('case_id')) {
            $query->where('case_id', $caseId);
        }

        if ($partyType = $request->get('party_type')) {
            $query->where('party_type', $partyType);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'asc');
        $allowedSorts = ['full_name', 'party_type', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Create a new KP case party.
     *
     * POST /api/v1/kp-case-parties
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'case_id' => ['required', 'uuid'],
            'resident_id' => ['nullable', 'uuid'],
            'party_type' => ['required', 'in:complainant,respondent'],
            'full_name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'mobile_number' => ['nullable', 'string', 'max:20'],
        ]);

        $party = KpCaseParty::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
        ]);

        return response()->json([
            'message' => 'Case party added.',
            'kp_case_party' => $party,
        ], 201);
    }

    /**
     * Update a KP case party.
     *
     * PUT /api/v1/kp-case-parties/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $party = KpCaseParty::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'resident_id' => ['nullable', 'uuid'],
            'party_type' => ['sometimes', 'in:complainant,respondent'],
            'full_name' => ['sometimes', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'mobile_number' => ['nullable', 'string', 'max:20'],
        ]);

        $party->update($validated);

        return response()->json([
            'message' => 'Case party updated.',
            'kp_case_party' => $party->fresh(),
        ]);
    }

    /**
     * Delete a KP case party.
     *
     * DELETE /api/v1/kp-case-parties/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $party = KpCaseParty::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $party->delete();

        return response()->json(['message' => 'Case party deleted.']);
    }
}
