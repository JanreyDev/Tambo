<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Judicial\KpCaseParty;
use App\Models\Tenant\Resident;
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

        if (in_array($sortBy, ['full_name', 'party_type', 'created_at'])) {
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
        $mode = $request->input('party_mode', 'individual');

        $rules = [
            'case_id' => ['required', 'uuid'],
            'resident_id' => ['nullable', 'uuid'],
            'party_type' => ['required', 'in:complainant,respondent'],
            'party_mode' => ['required', 'in:individual,group'],
            'address' => ['nullable', 'string', 'max:500'],
            'mobile_number' => ['nullable', 'string', 'max:20'],
        ];

        if ($mode === 'individual') {
            $rules['first_name'] = ['required', 'string', 'max:100'];
            $rules['middle_name'] = ['nullable', 'string', 'max:100'];
            $rules['last_name'] = ['required', 'string', 'max:100'];
        } else {
            // group — full_name stores the raw comma-separated names (e.g. "JUAN SANTOS, et al.")
            $rules['full_name'] = ['required', 'string', 'max:500'];
        }

        $validated = $request->validate($rules);
        $barangayId = $request->user()->barangay_id;

        // Derive full_name for individual mode (used for display + search)
        if ($mode === 'individual') {
            $parts = array_filter([
                strtoupper(trim($validated['first_name'])),
                isset($validated['middle_name']) ? strtoupper(trim($validated['middle_name'])) : null,
                strtoupper(trim($validated['last_name'])),
            ]);
            $validated['full_name'] = implode(' ', $parts);
        }

        $party = KpCaseParty::create([
            ...$validated,
            'barangay_id' => $barangayId,
        ]);

        // Auto-match resident by name (individual mode only — group names can't map to a single resident)
        if ($mode === 'individual' && empty($party->resident_id)) {
            $firstName = strtoupper(trim($validated['first_name']));
            $lastName = strtoupper(trim($validated['last_name']));

            $matched = Resident::where('barangay_id', $barangayId)
                ->whereRaw('UPPER(first_name) = ?', [$firstName])
                ->whereRaw('UPPER(last_name) = ?', [$lastName])
                ->first();

            if ($matched) {
                $party->update(['resident_id' => $matched->id]);
            }
        }

        return response()->json([
            'message' => 'Case party added.',
            'kp_case_party' => $party->fresh(),
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

        $mode = $request->input('party_mode', $party->party_mode ?? 'individual');
        $rules = [
            'resident_id' => ['nullable', 'uuid'],
            'party_type' => ['sometimes', 'in:complainant,respondent'],
            'party_mode' => ['sometimes', 'in:individual,group'],
            'address' => ['nullable', 'string', 'max:500'],
            'mobile_number' => ['nullable', 'string', 'max:20'],
        ];

        if ($mode === 'individual') {
            $rules['first_name'] = ['sometimes', 'string', 'max:100'];
            $rules['middle_name'] = ['nullable', 'string', 'max:100'];
            $rules['last_name'] = ['sometimes', 'string', 'max:100'];
        } else {
            $rules['full_name'] = ['sometimes', 'string', 'max:500'];
        }

        $validated = $request->validate($rules);

        // Re-derive full_name when individual name fields change
        if ($mode === 'individual') {
            $fn = strtoupper(trim($validated['first_name'] ?? $party->first_name ?? ''));
            $mn = strtoupper(trim($validated['middle_name'] ?? $party->middle_name ?? ''));
            $ln = strtoupper(trim($validated['last_name'] ?? $party->last_name ?? ''));
            $validated['full_name'] = trim(implode(' ', array_filter([$fn, $mn ?: null, $ln])));
        }

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
