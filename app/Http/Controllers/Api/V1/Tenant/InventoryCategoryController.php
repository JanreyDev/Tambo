<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Assets\InventoryCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryCategoryController extends Controller
{
    /**
     * List all inventory categories for the barangay.
     *
     * GET /api/v1/inventory-categories
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = InventoryCategory::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where('name', 'ilike', "%{$search}%");
        }

        $sortBy = $request->get('sort_by', 'name');
        $sortDir = $request->get('sort_dir', 'asc');
        $allowedSorts = ['name', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Create a new inventory category.
     *
     * POST /api/v1/inventory-categories
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $category = InventoryCategory::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
        ]);

        return response()->json([
            'message' => 'Inventory category created.',
            'inventory_category' => $category,
        ], 201);
    }

    /**
     * Update an inventory category.
     *
     * PUT /api/v1/inventory-categories/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $category = InventoryCategory::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Inventory category updated.',
            'inventory_category' => $category->fresh(),
        ]);
    }

    /**
     * Delete an inventory category.
     *
     * DELETE /api/v1/inventory-categories/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $category = InventoryCategory::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $category->delete();

        return response()->json(['message' => 'Inventory category deleted.']);
    }
}
