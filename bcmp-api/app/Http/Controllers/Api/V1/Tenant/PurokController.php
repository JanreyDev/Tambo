<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Officials\Purok;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurokController extends Controller
{
    /**
     * List all puroks for the current barangay.
     *
     * GET /api/v1/puroks
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = Purok::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where('name', 'ilike', "%{$search}%");
        }

        $sortBy = $request->get('sort_by', 'name');
        $sortDir = $request->get('sort_dir', 'asc');
        $allowedSorts = ['name', 'resident_count', 'household_count', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Create a new purok.
     *
     * POST /api/v1/puroks
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'leader_resident_id' => ['nullable', 'uuid'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $purok = Purok::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
        ]);

        return response()->json([
            'message' => 'Purok created.',
            'purok' => $purok,
        ], 201);
    }

    /**
     * Update a purok.
     *
     * PUT /api/v1/puroks/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $purok = Purok::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'leader_resident_id' => ['nullable', 'uuid'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $purok->update($validated);

        return response()->json([
            'message' => 'Purok updated.',
            'purok' => $purok->fresh(),
        ]);
    }

    /**
     * Delete a purok.
     *
     * DELETE /api/v1/puroks/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $purok = Purok::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $purok->delete();

        return response()->json(['message' => 'Purok deleted.']);
    }
}
