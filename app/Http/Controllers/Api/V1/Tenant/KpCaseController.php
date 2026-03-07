<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Judicial\KpCase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KpCaseController extends Controller
{
    /**
     * List KP cases with search/filter/pagination.
     *
     * GET /api/v1/kp-cases
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = KpCase::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('case_number', 'ilike', "%{$search}%")
                    ->orWhere('nature', 'ilike', "%{$search}%")
                    ->orWhere('nature_of_complaint', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($caseLevel = $request->get('case_level')) {
            $query->where('case_level', $caseLevel);
        }

        $sortBy = $request->get('sort_by', 'filing_date');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['case_number', 'filing_date', 'status', 'case_level', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single KP case with parties and hearings.
     *
     * GET /api/v1/kp-cases/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $kpCase = KpCase::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['kp_case' => $kpCase]);
    }

    /**
     * Create a new KP case.
     *
     * POST /api/v1/kp-cases
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'case_level' => ['nullable', 'string', 'max:50'],
            'nature' => ['nullable', 'string', 'max:255'],
            'nature_of_complaint' => ['nullable', 'string'],
            'rpc_article' => ['nullable', 'string', 'max:100'],
            'case_description' => ['nullable', 'string'],
            'complainant_type' => ['nullable', 'string', 'max:50'],
            'respondent_type' => ['nullable', 'string', 'max:50'],
            'filing_date' => ['required', 'date'],
            'presiding_officer_id' => ['nullable', 'uuid'],
            'lupon_secretary_id' => ['nullable', 'uuid'],
            'status' => ['nullable', 'in:filed,mediation,conciliation,arbitration,settled,dismissed,elevated'],
        ]);

        $barangayId = $request->user()->barangay_id;

        // Auto-generate case number
        $year = now()->format('Y');
        $lastCase = KpCase::where('barangay_id', $barangayId)
            ->where('case_number', 'ilike', "KP-{$year}-%")
            ->orderByRaw("CAST(SUBSTRING(case_number FROM 'KP-\\d{4}-(\\d+)') AS INTEGER) DESC NULLS LAST")
            ->first();

        $nextSeq = $lastCase
            ? ((int) preg_replace('/^KP-\d{4}-/', '', $lastCase->case_number)) + 1
            : 1;
        $caseNumber = "KP-{$year}-".str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

        $kpCase = KpCase::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'case_number' => $caseNumber,
            'status' => $validated['status'] ?? 'filed',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'KP case created.',
            'kp_case' => $kpCase,
        ], 201);
    }

    /**
     * Update a KP case.
     *
     * PUT /api/v1/kp-cases/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $kpCase = KpCase::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'case_level' => ['nullable', 'string', 'max:50'],
            'nature' => ['nullable', 'string', 'max:255'],
            'nature_of_complaint' => ['nullable', 'string'],
            'rpc_article' => ['nullable', 'string', 'max:100'],
            'case_description' => ['nullable', 'string'],
            'presiding_officer_id' => ['nullable', 'uuid'],
            'lupon_secretary_id' => ['nullable', 'uuid'],
            'pangkat_chairman_id' => ['nullable', 'uuid'],
            'pangkat_members' => ['nullable', 'array'],
            'first_meeting_date' => ['nullable', 'date'],
            'mediation_deadline' => ['nullable', 'date'],
            'pangkat_constituted_date' => ['nullable', 'date'],
            'pangkat_convene_date' => ['nullable', 'date'],
            'conciliation_deadline' => ['nullable', 'date'],
            'conciliation_extended_deadline' => ['nullable', 'date'],
            'action_taken' => ['nullable', 'string'],
            'settlement_text' => ['nullable', 'string'],
            'settlement_date' => ['nullable', 'date'],
            'arbitration_award' => ['nullable', 'string'],
            'arbitration_date' => ['nullable', 'date'],
            'repudiation_deadline' => ['nullable', 'date'],
            'execution_date' => ['nullable', 'date'],
            'certification_to_file_action' => ['boolean'],
            'cfa_date' => ['nullable', 'date'],
            'cfa_reason' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:filed,mediation,conciliation,arbitration,settled,dismissed,elevated'],
            'remarks' => ['nullable', 'string'],
        ]);

        $validated['updated_by'] = $request->user()->id;
        $kpCase->update($validated);

        return response()->json([
            'message' => 'KP case updated.',
            'kp_case' => $kpCase->fresh(),
        ]);
    }

    /**
     * Soft delete a KP case.
     *
     * DELETE /api/v1/kp-cases/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $kpCase = KpCase::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $kpCase->update(['deleted_by' => $request->user()->id]);
        $kpCase->delete();

        return response()->json(['message' => 'KP case deleted.']);
    }
}
