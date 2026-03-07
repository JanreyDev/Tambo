<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Judicial\BlotterRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlotterController extends Controller
{
    /**
     * List blotter records with search/filter/pagination.
     *
     * GET /api/v1/blotters
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = BlotterRecord::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('blotter_number', 'ilike', "%{$search}%")
                  ->orWhere('complainant_name', 'ilike', "%{$search}%")
                  ->orWhere('respondent_name', 'ilike', "%{$search}%")
                  ->orWhere('incident_type', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($incidentType = $request->get('incident_type')) {
            $query->where('incident_type', $incidentType);
        }

        $sortBy = $request->get('sort_by', 'filing_date');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['blotter_number', 'filing_date', 'incident_date', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single blotter record.
     *
     * GET /api/v1/blotters/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $blotter = BlotterRecord::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['blotter' => $blotter]);
    }

    /**
     * Create a new blotter record.
     *
     * POST /api/v1/blotters
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'incident_type' => ['required', 'string', 'max:255'],
            'incident_date' => ['required', 'date'],
            'incident_time' => ['nullable', 'string', 'max:10'],
            'incident_place' => ['nullable', 'string', 'max:500'],
            'narrative' => ['required', 'string'],
            'complainant_name' => ['required', 'string', 'max:255'],
            'complainant_address' => ['nullable', 'string', 'max:500'],
            'complainant_mobile' => ['nullable', 'string', 'max:20'],
            'complainant_resident_id' => ['nullable', 'uuid'],
            'respondent_name' => ['required', 'string', 'max:255'],
            'respondent_address' => ['nullable', 'string', 'max:500'],
            'respondent_mobile' => ['nullable', 'string', 'max:20'],
            'respondent_resident_id' => ['nullable', 'uuid'],
            'officer_on_duty_id' => ['nullable', 'uuid'],
            'status' => ['nullable', 'in:pending,under_investigation,resolved,dismissed,elevated'],
        ]);

        $barangayId = $request->user()->barangay_id;

        // Auto-generate blotter number
        $year = now()->format('Y');
        $lastBlotter = BlotterRecord::where('barangay_id', $barangayId)
            ->where('blotter_number', 'ilike', "BLT-{$year}-%")
            ->orderByRaw("CAST(SUBSTRING(blotter_number FROM 'BLT-\\d{4}-(\\d+)') AS INTEGER) DESC NULLS LAST")
            ->first();

        $nextSeq = $lastBlotter
            ? ((int) preg_replace('/^BLT-\d{4}-/', '', $lastBlotter->blotter_number)) + 1
            : 1;
        $blotterNumber = "BLT-{$year}-" . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

        $blotter = BlotterRecord::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'blotter_number' => $blotterNumber,
            'filing_date' => now()->toDateString(),
            'status' => $validated['status'] ?? 'pending',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Blotter record created.',
            'blotter' => $blotter,
        ], 201);
    }

    /**
     * Update a blotter record.
     *
     * PUT /api/v1/blotters/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $blotter = BlotterRecord::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'incident_type' => ['sometimes', 'string', 'max:255'],
            'incident_date' => ['sometimes', 'date'],
            'incident_time' => ['nullable', 'string', 'max:10'],
            'incident_place' => ['nullable', 'string', 'max:500'],
            'narrative' => ['sometimes', 'string'],
            'complainant_name' => ['sometimes', 'string', 'max:255'],
            'complainant_address' => ['nullable', 'string', 'max:500'],
            'complainant_mobile' => ['nullable', 'string', 'max:20'],
            'complainant_resident_id' => ['nullable', 'uuid'],
            'respondent_name' => ['sometimes', 'string', 'max:255'],
            'respondent_address' => ['nullable', 'string', 'max:500'],
            'respondent_mobile' => ['nullable', 'string', 'max:20'],
            'respondent_resident_id' => ['nullable', 'uuid'],
            'officer_on_duty_id' => ['nullable', 'uuid'],
            'resolution' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:pending,under_investigation,resolved,dismissed,elevated'],
            'linked_kp_case_id' => ['nullable', 'uuid'],
            'attachment_file_ids' => ['nullable', 'array'],
        ]);

        $validated['updated_by'] = $request->user()->id;
        $blotter->update($validated);

        return response()->json([
            'message' => 'Blotter record updated.',
            'blotter' => $blotter->fresh(),
        ]);
    }

    /**
     * Soft delete a blotter record.
     *
     * DELETE /api/v1/blotters/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $blotter = BlotterRecord::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $blotter->update(['deleted_by' => $request->user()->id]);
        $blotter->delete();

        return response()->json(['message' => 'Blotter record deleted.']);
    }
}
