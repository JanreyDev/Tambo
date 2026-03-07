<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Disaster\HazardPin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HazardPinController extends Controller
{
    /**
     * List all hazard pins for the barangay.
     *
     * GET /api/v1/hazard-pins
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = HazardPin::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        if ($hazardType = $request->get('hazard_type')) {
            $query->where('hazard_type', $hazardType);
        }

        if ($severity = $request->get('severity')) {
            $query->where('severity', $severity);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['name', 'hazard_type', 'severity', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single hazard pin.
     *
     * GET /api/v1/hazard-pins/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $pin = HazardPin::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['hazard_pin' => $pin]);
    }

    /**
     * Create a new hazard pin.
     *
     * POST /api/v1/hazard-pins
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hazard_type' => ['required', 'string', 'max:100'],
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'severity' => ['nullable', 'in:low,medium,high,critical'],
            'status' => ['nullable', 'in:active,resolved,monitoring'],
            'reported_by_id' => ['nullable', 'uuid'],
            'photo_file_ids' => ['nullable', 'array'],
        ]);

        $pin = HazardPin::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'status' => $validated['status'] ?? 'active',
            'reported_by_id' => $validated['reported_by_id'] ?? $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Hazard pin created.',
            'hazard_pin' => $pin,
        ], 201);
    }

    /**
     * Update a hazard pin.
     *
     * PUT /api/v1/hazard-pins/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $pin = HazardPin::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'hazard_type' => ['sometimes', 'string', 'max:100'],
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'latitude' => ['sometimes', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'numeric', 'between:-180,180'],
            'severity' => ['nullable', 'in:low,medium,high,critical'],
            'status' => ['sometimes', 'in:active,resolved,monitoring'],
            'photo_file_ids' => ['nullable', 'array'],
        ]);

        $pin->update($validated);

        return response()->json([
            'message' => 'Hazard pin updated.',
            'hazard_pin' => $pin->fresh(),
        ]);
    }

    /**
     * Delete a hazard pin.
     *
     * DELETE /api/v1/hazard-pins/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $pin = HazardPin::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $pin->delete();

        return response()->json(['message' => 'Hazard pin deleted.']);
    }
}
