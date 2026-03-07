<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Judicial\KpCaseHearing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KpCaseHearingController extends Controller
{
    /**
     * List hearings for KP cases.
     *
     * GET /api/v1/kp-case-hearings
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = KpCaseHearing::where('barangay_id', $barangayId);

        if ($caseId = $request->get('case_id')) {
            $query->where('case_id', $caseId);
        }

        if ($hearingType = $request->get('hearing_type')) {
            $query->where('hearing_type', $hearingType);
        }

        $sortBy = $request->get('sort_by', 'hearing_date');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['hearing_date', 'hearing_type', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Create a new KP case hearing.
     *
     * POST /api/v1/kp-case-hearings
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'case_id' => ['required', 'uuid'],
            'hearing_type' => ['required', 'string', 'max:100'],
            'hearing_date' => ['required', 'date'],
            'hearing_time' => ['nullable', 'string', 'max:10'],
            'venue' => ['nullable', 'string', 'max:255'],
            'minutes' => ['nullable', 'string'],
            'attendees' => ['nullable', 'array'],
            'outcome' => ['nullable', 'string', 'max:500'],
            'next_hearing_date' => ['nullable', 'date'],
        ]);

        $hearing = KpCaseHearing::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
        ]);

        return response()->json([
            'message' => 'Case hearing created.',
            'kp_case_hearing' => $hearing,
        ], 201);
    }

    /**
     * Update a KP case hearing.
     *
     * PUT /api/v1/kp-case-hearings/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $hearing = KpCaseHearing::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'hearing_type' => ['sometimes', 'string', 'max:100'],
            'hearing_date' => ['sometimes', 'date'],
            'hearing_time' => ['nullable', 'string', 'max:10'],
            'venue' => ['nullable', 'string', 'max:255'],
            'minutes' => ['nullable', 'string'],
            'attendees' => ['nullable', 'array'],
            'outcome' => ['nullable', 'string', 'max:500'],
            'next_hearing_date' => ['nullable', 'date'],
        ]);

        $hearing->update($validated);

        return response()->json([
            'message' => 'Case hearing updated.',
            'kp_case_hearing' => $hearing->fresh(),
        ]);
    }

    /**
     * Delete a KP case hearing.
     *
     * DELETE /api/v1/kp-case-hearings/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $hearing = KpCaseHearing::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $hearing->delete();

        return response()->json(['message' => 'Case hearing deleted.']);
    }
}
