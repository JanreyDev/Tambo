<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Officials\BarangayOfficial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfficialController extends Controller
{
    /**
     * List barangay officials with filters.
     *
     * GET /api/v1/officials
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = BarangayOfficial::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('position', 'ilike', "%{$search}%")
                  ->orWhere('committee', 'ilike', "%{$search}%");
            });
        }

        if ($position = $request->get('position')) {
            $query->where('position', $position);
        }

        if ($committee = $request->get('committee')) {
            $query->where('committee', $committee);
        }

        if ($request->has('is_active')) {
            $status = $request->boolean('is_active') ? 'active' : 'inactive';
            $query->where('status', $status);
        }

        $sortBy = $request->get('sort_by', 'sort_order');
        $sortDir = $request->get('sort_dir', 'asc');
        $allowedSorts = ['sort_order', 'position', 'term_start', 'term_end', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single official.
     *
     * GET /api/v1/officials/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $official = BarangayOfficial::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['official' => $official]);
    }

    /**
     * Create a new barangay official record.
     *
     * POST /api/v1/officials
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'resident_id' => ['required', 'uuid'],
            'position' => ['required', 'string', 'max:255'],
            'committee' => ['nullable', 'string', 'max:255'],
            'term_start' => ['required', 'date'],
            'term_end' => ['required', 'date', 'after:term_start'],
            'appointment_date' => ['nullable', 'date'],
            'oath_date' => ['nullable', 'date'],
            'is_elected' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
        ]);

        $official = BarangayOfficial::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'status' => $validated['status'] ?? 'active',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Official created.',
            'official' => $official,
        ], 201);
    }

    /**
     * Update an official record.
     *
     * PUT /api/v1/officials/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $official = BarangayOfficial::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'resident_id' => ['sometimes', 'uuid'],
            'position' => ['sometimes', 'string', 'max:255'],
            'committee' => ['nullable', 'string', 'max:255'],
            'term_start' => ['sometimes', 'date'],
            'term_end' => ['sometimes', 'date'],
            'appointment_date' => ['nullable', 'date'],
            'oath_date' => ['nullable', 'date'],
            'is_elected' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'status' => ['sometimes', 'in:active,inactive,suspended'],
        ]);

        $validated['updated_by'] = $request->user()->id;
        $official->update($validated);

        return response()->json([
            'message' => 'Official updated.',
            'official' => $official->fresh(),
        ]);
    }

    /**
     * Soft delete an official record.
     *
     * DELETE /api/v1/officials/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $official = BarangayOfficial::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $official->update(['deleted_by' => $request->user()->id]);
        $official->delete();

        return response()->json(['message' => 'Official deleted.']);
    }
}
