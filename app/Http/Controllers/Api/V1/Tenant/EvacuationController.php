<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Disaster\Evacuation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EvacuationController extends Controller
{
    /**
     * List evacuations with filters.
     *
     * GET /api/v1/evacuations
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = Evacuation::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('evacuation_name', 'ilike', "%{$search}%")
                    ->orWhere('evacuation_center', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($causeType = $request->get('cause_type')) {
            $query->where('cause_type', $causeType);
        }

        $sortBy = $request->get('sort_by', 'start_date');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['evacuation_name', 'start_date', 'status', 'evacuee_count', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single evacuation record.
     *
     * GET /api/v1/evacuations/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $evacuation = Evacuation::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['evacuation' => $evacuation]);
    }

    /**
     * Create a new evacuation record.
     *
     * POST /api/v1/evacuations
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'evacuation_name' => ['required', 'string', 'max:255'],
            'cause_type' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'evacuation_center' => ['required', 'string', 'max:255'],
            'center_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'center_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'evacuee_count' => ['nullable', 'integer', 'min:0'],
            'family_count' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'in:active,closed,standby'],
            'remarks' => ['nullable', 'string'],
        ]);

        $evacuation = Evacuation::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'message' => 'Evacuation record created.',
            'evacuation' => $evacuation,
        ], 201);
    }

    /**
     * Update an evacuation record.
     *
     * PUT /api/v1/evacuations/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $evacuation = Evacuation::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'evacuation_name' => ['sometimes', 'string', 'max:255'],
            'cause_type' => ['sometimes', 'string', 'max:100'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['nullable', 'date'],
            'evacuation_center' => ['sometimes', 'string', 'max:255'],
            'center_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'center_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'evacuee_count' => ['nullable', 'integer', 'min:0'],
            'family_count' => ['nullable', 'integer', 'min:0'],
            'status' => ['sometimes', 'in:active,closed,standby'],
            'remarks' => ['nullable', 'string'],
        ]);

        $evacuation->update($validated);

        return response()->json([
            'message' => 'Evacuation record updated.',
            'evacuation' => $evacuation->fresh(),
        ]);
    }

    /**
     * Delete an evacuation record.
     *
     * DELETE /api/v1/evacuations/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $evacuation = Evacuation::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $evacuation->delete();

        return response()->json(['message' => 'Evacuation record deleted.']);
    }
}
