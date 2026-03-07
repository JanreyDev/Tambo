<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Records\Household;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HouseholdController extends Controller
{
    /**
     * List households for the current barangay with search/filter/pagination.
     *
     * GET /api/v1/households
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = Household::where('barangay_id', $barangayId);

        // Search by household_number or head name
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('household_number', 'ilike', "%{$search}%")
                    ->orWhere('household_name', 'ilike', "%{$search}%");
            });
        }

        // Filter by purok
        if ($purok = $request->get('purok')) {
            $query->where('purok', $purok);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'household_number');
        $sortDir = $request->get('sort_dir', 'asc');
        $allowedSorts = ['household_number', 'household_name', 'purok', 'member_count', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single household with residents loaded.
     *
     * GET /api/v1/households/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $household = Household::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['household' => $household]);
    }

    /**
     * Create a new household.
     *
     * POST /api/v1/households
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'household_number' => ['required', 'string', 'max:50'],
            'household_name' => ['nullable', 'string', 'max:255'],
            'head_resident_id' => ['nullable', 'uuid'],
            'household_type' => ['nullable', 'string', 'max:100'],
            'tenure_status' => ['nullable', 'string', 'max:100'],
            'housing_unit' => ['nullable', 'string', 'max:255'],
            'purok' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'member_count' => ['nullable', 'integer', 'min:0'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $household = Household::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Household created.',
            'household' => $household,
        ], 201);
    }

    /**
     * Update a household.
     *
     * PUT /api/v1/households/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $household = Household::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'household_number' => ['sometimes', 'string', 'max:50'],
            'household_name' => ['nullable', 'string', 'max:255'],
            'head_resident_id' => ['nullable', 'uuid'],
            'household_type' => ['nullable', 'string', 'max:100'],
            'tenure_status' => ['nullable', 'string', 'max:100'],
            'housing_unit' => ['nullable', 'string', 'max:255'],
            'purok' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'member_count' => ['nullable', 'integer', 'min:0'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $validated['updated_by'] = $request->user()->id;
        $household->update($validated);

        return response()->json([
            'message' => 'Household updated.',
            'household' => $household->fresh(),
        ]);
    }

    /**
     * Soft delete a household.
     *
     * DELETE /api/v1/households/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $household = Household::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $household->update(['deleted_by' => $request->user()->id]);
        $household->delete();

        return response()->json(['message' => 'Household deleted.']);
    }
}
