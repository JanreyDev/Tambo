<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Officials\Council;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouncilController extends Controller
{
    /**
     * List councils for the current barangay.
     *
     * GET /api/v1/councils
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = Council::where('barangay_id', $barangayId);

        if ($councilType = $request->get('council_type')) {
            $query->where('council_type', $councilType);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['council_type', 'term', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Create a new council.
     *
     * POST /api/v1/councils
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'council_type' => ['required', 'string', 'max:100'],
            'term' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive'],
            'meeting_schedule' => ['nullable', 'string', 'max:255'],
            'members' => ['nullable', 'array'],
        ]);

        $council = Council::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'message' => 'Council created.',
            'council' => $council,
        ], 201);
    }

    /**
     * Update a council.
     *
     * PUT /api/v1/councils/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $council = Council::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'council_type' => ['sometimes', 'string', 'max:100'],
            'term' => ['nullable', 'string', 'max:100'],
            'status' => ['sometimes', 'in:active,inactive'],
            'meeting_schedule' => ['nullable', 'string', 'max:255'],
            'members' => ['nullable', 'array'],
        ]);

        $council->update($validated);

        return response()->json([
            'message' => 'Council updated.',
            'council' => $council->fresh(),
        ]);
    }

    /**
     * Delete a council.
     *
     * DELETE /api/v1/councils/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $council = Council::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $council->delete();

        return response()->json(['message' => 'Council deleted.']);
    }
}
