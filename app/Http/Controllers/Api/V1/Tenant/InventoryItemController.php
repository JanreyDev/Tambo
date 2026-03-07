<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Assets\InventoryItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryItemController extends Controller
{
    /**
     * List inventory items with search/filter/pagination.
     *
     * GET /api/v1/inventory-items
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = InventoryItem::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('sku', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        if ($categoryId = $request->get('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($condition = $request->get('condition')) {
            $query->where('condition', $condition);
        }

        $sortBy = $request->get('sort_by', 'name');
        $sortDir = $request->get('sort_dir', 'asc');
        $allowedSorts = ['name', 'sku', 'quantity', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single inventory item.
     *
     * GET /api/v1/inventory-items/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $item = InventoryItem::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['inventory_item' => $item]);
    }

    /**
     * Create a new inventory item.
     *
     * POST /api/v1/inventory-items
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['nullable', 'uuid'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
            'sku' => ['nullable', 'string', 'max:100'],
            'quantity' => ['required', 'integer', 'min:0'],
            'minimum_stock' => ['nullable', 'integer', 'min:0'],
            'unit' => ['nullable', 'string', 'max:50'],
            'location' => ['nullable', 'string', 'max:255'],
            'expiry_date' => ['nullable', 'date'],
            'condition' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'in:available,low_stock,out_of_stock,expired'],
        ]);

        $item = InventoryItem::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'status' => $validated['status'] ?? 'available',
        ]);

        return response()->json([
            'message' => 'Inventory item created.',
            'inventory_item' => $item,
        ], 201);
    }

    /**
     * Update an inventory item.
     *
     * PUT /api/v1/inventory-items/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $item = InventoryItem::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'category_id' => ['nullable', 'uuid'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
            'sku' => ['nullable', 'string', 'max:100'],
            'quantity' => ['sometimes', 'integer', 'min:0'],
            'minimum_stock' => ['nullable', 'integer', 'min:0'],
            'unit' => ['nullable', 'string', 'max:50'],
            'location' => ['nullable', 'string', 'max:255'],
            'expiry_date' => ['nullable', 'date'],
            'condition' => ['nullable', 'string', 'max:50'],
            'status' => ['sometimes', 'in:available,low_stock,out_of_stock,expired'],
        ]);

        $item->update($validated);

        return response()->json([
            'message' => 'Inventory item updated.',
            'inventory_item' => $item->fresh(),
        ]);
    }

    /**
     * Delete an inventory item.
     *
     * DELETE /api/v1/inventory-items/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $item = InventoryItem::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $item->delete();

        return response()->json(['message' => 'Inventory item deleted.']);
    }
}
