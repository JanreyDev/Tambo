<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Assets\Asset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    /**
     * List assets with search/filter/pagination.
     *
     * GET /api/v1/assets
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = Asset::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'ilike', "%{$search}%")
                    ->orWhere('asset_id_tag', 'ilike', "%{$search}%")
                    ->orWhere('uacs_code', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($classification = $request->get('classification')) {
            $query->where('classification', $classification);
        }

        if ($condition = $request->get('condition')) {
            $query->where('condition', $condition);
        }

        $sortBy = $request->get('sort_by', 'asset_id_tag');
        $sortDir = $request->get('sort_dir', 'asc');
        $allowedSorts = ['asset_id_tag', 'description', 'total_value', 'acquisition_date', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single asset.
     *
     * GET /api/v1/assets/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $asset = Asset::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['asset' => $asset]);
    }

    /**
     * Create a new asset record.
     *
     * POST /api/v1/assets
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'air_id' => ['nullable', 'uuid'],
            'asset_id_tag' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string', 'max:500'],
            'classification' => ['nullable', 'string', 'max:100'],
            'uacs_code' => ['nullable', 'string', 'max:50'],
            'quantity' => ['required', 'integer', 'min:1'],
            'unit' => ['nullable', 'string', 'max:50'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'total_value' => ['nullable', 'numeric', 'min:0'],
            'acquisition_date' => ['nullable', 'date'],
            'condition' => ['nullable', 'in:new,good,fair,poor,condemned'],
            'location' => ['nullable', 'string', 'max:255'],
            'assigned_to_id' => ['nullable', 'uuid'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'status' => ['nullable', 'in:active,under_repair,disposed,lost'],
        ]);

        $asset = Asset::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'status' => $validated['status'] ?? 'active',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Asset created.',
            'asset' => $asset,
        ], 201);
    }

    /**
     * Update an asset.
     *
     * PUT /api/v1/assets/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $asset = Asset::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'asset_id_tag' => ['sometimes', 'string', 'max:100'],
            'description' => ['sometimes', 'string', 'max:500'],
            'classification' => ['nullable', 'string', 'max:100'],
            'uacs_code' => ['nullable', 'string', 'max:50'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
            'unit' => ['nullable', 'string', 'max:50'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'total_value' => ['nullable', 'numeric', 'min:0'],
            'acquisition_date' => ['nullable', 'date'],
            'condition' => ['nullable', 'in:new,good,fair,poor,condemned'],
            'location' => ['nullable', 'string', 'max:255'],
            'assigned_to_id' => ['nullable', 'uuid'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'status' => ['sometimes', 'in:active,under_repair,disposed,lost'],
            'disposal_date' => ['nullable', 'date'],
            'disposal_method' => ['nullable', 'string', 'max:255'],
        ]);

        $validated['updated_by'] = $request->user()->id;
        $asset->update($validated);

        return response()->json([
            'message' => 'Asset updated.',
            'asset' => $asset->fresh(),
        ]);
    }

    /**
     * Soft delete an asset.
     *
     * DELETE /api/v1/assets/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $asset = Asset::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $asset->update(['deleted_by' => $request->user()->id]);
        $asset->delete();

        return response()->json(['message' => 'Asset deleted.']);
    }
}
