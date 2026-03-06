<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Records\LotBuilding;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LotBuildingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = LotBuilding::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('owner_name', 'ilike', "%{$search}%")
                  ->orWhere('record_number', 'ilike', "%{$search}%")
                  ->orWhere('address', 'ilike', "%{$search}%")
                  ->orWhere('lot_number', 'ilike', "%{$search}%");
            });
        }

        if ($recordType = $request->get('record_type')) {
            $query->where('record_type', $recordType);
        }

        if ($classification = $request->get('classification')) {
            $query->where('classification', $classification);
        }

        $sortBy = $request->get('sort_by', 'record_number');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $record = LotBuilding::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['lot_building' => $record]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'record_type' => ['required', 'in:lot,building,both'],
            'owner_name' => ['required', 'string', 'max:255'],
            'owner_contact_number' => ['nullable', 'string', 'max:20'],
            'owner_email' => ['nullable', 'email', 'max:255'],
            'owner_address' => ['nullable', 'string', 'max:500'],
            'address' => ['nullable', 'string', 'max:500'],
            'purok' => ['nullable', 'string', 'max:255'],
            'street' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'lot_number' => ['nullable', 'string', 'max:100'],
            'block_number' => ['nullable', 'string', 'max:100'],
            'land_area_sqm' => ['nullable', 'numeric', 'min:0'],
            'classification' => ['nullable', 'string', 'max:100'],
            'landmark_north' => ['nullable', 'string', 'max:255'],
            'landmark_south' => ['nullable', 'string', 'max:255'],
            'landmark_east' => ['nullable', 'string', 'max:255'],
            'landmark_west' => ['nullable', 'string', 'max:255'],
            'number_of_floors' => ['nullable', 'integer', 'min:1'],
            'building_material' => ['nullable', 'string', 'max:255'],
            'year_constructed' => ['nullable', 'integer', 'min:1800', 'max:2100'],
        ]);

        $barangayId = $request->user()->barangay_id;

        $lastNumber = LotBuilding::where('barangay_id', $barangayId)
            ->max('record_number');
        $nextNumber = $lastNumber
            ? str_pad((string) ((int) $lastNumber + 1), 6, '0', STR_PAD_LEFT)
            : '000001';

        $record = LotBuilding::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'record_number' => $nextNumber,
            'status' => 'active',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Lot/building record created.',
            'lot_building' => $record,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $record = LotBuilding::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'record_type' => ['sometimes', 'in:lot,building,both'],
            'owner_name' => ['sometimes', 'string', 'max:255'],
            'owner_contact_number' => ['nullable', 'string', 'max:20'],
            'owner_email' => ['nullable', 'email', 'max:255'],
            'owner_address' => ['nullable', 'string', 'max:500'],
            'address' => ['nullable', 'string', 'max:500'],
            'purok' => ['nullable', 'string', 'max:255'],
            'street' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'classification' => ['nullable', 'string', 'max:100'],
            'landmark_north' => ['nullable', 'string', 'max:255'],
            'landmark_south' => ['nullable', 'string', 'max:255'],
            'landmark_east' => ['nullable', 'string', 'max:255'],
            'landmark_west' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);

        $validated['updated_by'] = $request->user()->id;
        $record->update($validated);

        return response()->json([
            'message' => 'Record updated.',
            'lot_building' => $record->fresh(),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $record = LotBuilding::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $record->update(['deleted_by' => $request->user()->id]);
        $record->delete();

        return response()->json(['message' => 'Record deleted.']);
    }
}
