<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Tanod\Tanod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TanodController extends Controller
{
    /**
     * List tanods with search/filter/pagination.
     *
     * GET /api/v1/tanods
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = Tanod::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('badge_number', 'ilike', "%{$search}%")
                  ->orWhere('beat_assignment', 'ilike', "%{$search}%")
                  ->orWhere('team', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($team = $request->get('team')) {
            $query->where('team', $team);
        }

        $sortBy = $request->get('sort_by', 'badge_number');
        $sortDir = $request->get('sort_dir', 'asc');
        $allowedSorts = ['badge_number', 'appointment_date', 'status', 'team', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single tanod.
     *
     * GET /api/v1/tanods/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $tanod = Tanod::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['tanod' => $tanod]);
    }

    /**
     * Create a new tanod record.
     *
     * POST /api/v1/tanods
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'resident_id' => ['required', 'uuid'],
            'official_id' => ['nullable', 'uuid'],
            'badge_number' => ['required', 'string', 'max:50'],
            'appointment_date' => ['nullable', 'date'],
            'appointed_by_id' => ['nullable', 'uuid'],
            'beat_assignment' => ['nullable', 'string', 'max:255'],
            'team' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive,suspended,retired'],
        ]);

        $tanod = Tanod::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'message' => 'Tanod created.',
            'tanod' => $tanod,
        ], 201);
    }

    /**
     * Update a tanod record.
     *
     * PUT /api/v1/tanods/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $tanod = Tanod::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'official_id' => ['nullable', 'uuid'],
            'badge_number' => ['sometimes', 'string', 'max:50'],
            'appointment_date' => ['nullable', 'date'],
            'appointed_by_id' => ['nullable', 'uuid'],
            'beat_assignment' => ['nullable', 'string', 'max:255'],
            'team' => ['nullable', 'string', 'max:100'],
            'status' => ['sometimes', 'in:active,inactive,suspended,retired'],
        ]);

        $tanod->update($validated);

        return response()->json([
            'message' => 'Tanod updated.',
            'tanod' => $tanod->fresh(),
        ]);
    }

    /**
     * Delete a tanod record.
     *
     * DELETE /api/v1/tanods/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $tanod = Tanod::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $tanod->delete();

        return response()->json(['message' => 'Tanod deleted.']);
    }
}
