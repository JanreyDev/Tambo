<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Officials\CouncilSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouncilSessionController extends Controller
{
    /**
     * List council sessions with filters.
     *
     * GET /api/v1/council-sessions
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = CouncilSession::where('barangay_id', $barangayId);

        if ($councilId = $request->get('council_id')) {
            $query->where('council_id', $councilId);
        }

        if ($sessionType = $request->get('session_type')) {
            $query->where('session_type', $sessionType);
        }

        $sortBy = $request->get('sort_by', 'date');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['date', 'session_number', 'session_type', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Create a new council session.
     *
     * POST /api/v1/council-sessions
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'council_id' => ['required', 'uuid'],
            'session_type' => ['required', 'string', 'max:100'],
            'session_number' => ['nullable', 'integer', 'min:1'],
            'date' => ['required', 'date'],
            'time_start' => ['nullable', 'string', 'max:10'],
            'time_end' => ['nullable', 'string', 'max:10'],
            'venue' => ['nullable', 'string', 'max:255'],
            'agenda' => ['nullable', 'string'],
            'minutes' => ['nullable', 'string'],
            'attendees' => ['nullable', 'array'],
            'quorum_met' => ['boolean'],
            'presiding_officer_id' => ['nullable', 'uuid'],
            'secretary_id' => ['nullable', 'uuid'],
        ]);

        $session = CouncilSession::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
        ]);

        return response()->json([
            'message' => 'Council session created.',
            'council_session' => $session,
        ], 201);
    }

    /**
     * Update a council session.
     *
     * PUT /api/v1/council-sessions/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $session = CouncilSession::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'session_type' => ['sometimes', 'string', 'max:100'],
            'session_number' => ['nullable', 'integer', 'min:1'],
            'date' => ['sometimes', 'date'],
            'time_start' => ['nullable', 'string', 'max:10'],
            'time_end' => ['nullable', 'string', 'max:10'],
            'venue' => ['nullable', 'string', 'max:255'],
            'agenda' => ['nullable', 'string'],
            'minutes' => ['nullable', 'string'],
            'attendees' => ['nullable', 'array'],
            'quorum_met' => ['boolean'],
            'presiding_officer_id' => ['nullable', 'uuid'],
            'secretary_id' => ['nullable', 'uuid'],
        ]);

        $session->update($validated);

        return response()->json([
            'message' => 'Council session updated.',
            'council_session' => $session->fresh(),
        ]);
    }

    /**
     * Delete a council session.
     *
     * DELETE /api/v1/council-sessions/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $session = CouncilSession::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $session->delete();

        return response()->json(['message' => 'Council session deleted.']);
    }
}
