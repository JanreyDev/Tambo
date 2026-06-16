<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Assets\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    /**
     * List suppliers with search/pagination.
     *
     * GET /api/v1/suppliers
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = Supplier::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('contact_person', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        $sortBy = $request->get('sort_by', 'name');
        $sortDir = $request->get('sort_dir', 'asc');
        $allowedSorts = ['name', 'contact_person', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single supplier.
     *
     * GET /api/v1/suppliers/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $supplier = Supplier::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['supplier' => $supplier]);
    }

    /**
     * Create a new supplier.
     *
     * POST /api/v1/suppliers
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'tin' => ['nullable', 'string', 'max:50'],
        ]);

        $supplier = Supplier::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
        ]);

        return response()->json([
            'message' => 'Supplier created.',
            'supplier' => $supplier,
        ], 201);
    }

    /**
     * Update a supplier.
     *
     * PUT /api/v1/suppliers/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $supplier = Supplier::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'tin' => ['nullable', 'string', 'max:50'],
        ]);

        $supplier->update($validated);

        return response()->json([
            'message' => 'Supplier updated.',
            'supplier' => $supplier->fresh(),
        ]);
    }

    /**
     * Delete a supplier.
     *
     * DELETE /api/v1/suppliers/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $supplier = Supplier::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $supplier->delete();

        return response()->json(['message' => 'Supplier deleted.']);
    }
}
