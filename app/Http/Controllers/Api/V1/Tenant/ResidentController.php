<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Resident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResidentController extends Controller
{
    /**
     * List residents for the current barangay with search/filter/pagination.
     *
     * GET /api/v1/residents
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = Resident::where('barangay_id', $barangayId);

        // Search
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'ilike', "%{$search}%")
                  ->orWhere('last_name', 'ilike', "%{$search}%")
                  ->orWhere('middle_name', 'ilike', "%{$search}%")
                  ->orWhere('resident_number', 'ilike', "%{$search}%")
                  ->orWhere('mobile_number', 'ilike', "%{$search}%");
            });
        }

        // Filters
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($purok = $request->get('purok')) {
            $query->where('purok', $purok);
        }

        if ($sex = $request->get('sex')) {
            $query->where('sex', $sex);
        }

        if ($request->has('is_voter')) {
            $query->where('is_voter', $request->boolean('is_voter'));
        }

        // Sort
        $sortBy = $request->get('sort_by', 'last_name');
        $sortDir = $request->get('sort_dir', 'asc');
        $allowedSorts = ['last_name', 'first_name', 'created_at', 'date_of_birth', 'resident_number'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);
        $residents = $query->paginate($perPage);

        return response()->json($residents);
    }

    /**
     * Get a single resident with full details.
     *
     * GET /api/v1/residents/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $resident = Resident::where('barangay_id', $request->user()->barangay_id)
            ->with(['household', 'sectoralTags'])
            ->findOrFail($id);

        return response()->json(['resident' => $resident]);
    }

    /**
     * Create a new resident.
     *
     * POST /api/v1/residents
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'extension_name' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'place_of_birth' => ['nullable', 'string', 'max:255'],
            'sex' => ['required', 'in:male,female'],
            'civil_status' => ['nullable', 'string'],
            'citizenship' => ['nullable', 'string', 'max:100'],
            'religion' => ['nullable', 'string', 'max:100'],
            'blood_type' => ['nullable', 'string', 'max:10'],
            'email' => ['nullable', 'email', 'max:255'],
            'mobile_number' => ['nullable', 'string', 'max:20'],
            'purok' => ['nullable', 'string', 'max:255'],
            'street' => ['nullable', 'string', 'max:255'],
            'house_block_lot' => ['nullable', 'string', 'max:255'],
            'is_voter' => ['boolean'],
            'occupation' => ['nullable', 'string', 'max:255'],
            'highest_education' => ['nullable', 'string', 'max:255'],
        ]);

        $barangayId = $request->user()->barangay_id;

        // Generate resident number
        $lastNumber = Resident::where('barangay_id', $barangayId)
            ->max('resident_number');
        $nextNumber = $lastNumber
            ? str_pad((string) ((int) $lastNumber + 1), 6, '0', STR_PAD_LEFT)
            : '000001';

        $resident = Resident::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'resident_number' => $nextNumber,
            'registration_date' => now()->toDateString(),
            'status' => 'active',
            'created_by' => $request->user()->id,
        ]);

        // Calculate and update profile completion
        $resident->update([
            'profile_completion_pct' => $resident->calculateProfileCompletion(),
        ]);

        return response()->json([
            'message' => 'Resident created.',
            'resident' => $resident,
        ], 201);
    }

    /**
     * Update a resident.
     *
     * PUT /api/v1/residents/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $resident = Resident::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'extension_name' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['sometimes', 'date', 'before:today'],
            'place_of_birth' => ['nullable', 'string', 'max:255'],
            'sex' => ['sometimes', 'in:male,female'],
            'civil_status' => ['nullable', 'string'],
            'citizenship' => ['nullable', 'string', 'max:100'],
            'religion' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'mobile_number' => ['nullable', 'string', 'max:20'],
            'purok' => ['nullable', 'string', 'max:255'],
            'street' => ['nullable', 'string', 'max:255'],
            'house_block_lot' => ['nullable', 'string', 'max:255'],
            'is_voter' => ['boolean'],
            'occupation' => ['nullable', 'string', 'max:255'],
            'highest_education' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'in:active,inactive,deceased,transferred'],
        ]);

        $validated['updated_by'] = $request->user()->id;

        $resident->update($validated);

        // Recalculate profile completion
        $resident->update([
            'profile_completion_pct' => $resident->calculateProfileCompletion(),
        ]);

        return response()->json([
            'message' => 'Resident updated.',
            'resident' => $resident->fresh(),
        ]);
    }

    /**
     * Soft delete a resident.
     *
     * DELETE /api/v1/residents/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $resident = Resident::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $resident->update(['deleted_by' => $request->user()->id]);
        $resident->delete();

        return response()->json(['message' => 'Resident deleted.']);
    }
}
