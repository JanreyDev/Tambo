<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Judicial\VawcCase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VawcCaseController extends Controller
{
    /**
     * List VAWC cases — NO victim names in list response (RA 9262 compliance).
     *
     * GET /api/v1/vawc-cases
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = VawcCase::where('barangay_id', $barangayId)
            ->select([
                'id',
                'barangay_id',
                'case_number',
                'incident_type',
                'filing_date',
                'incident_date',
                'status',
                'bpo_issued',
                'tpo_referred',
                'ppo_referred',
                'referred_to_pnp',
                'referred_to_dswd',
                'vaw_desk_officer_id',
                'logbook_type',
                'created_at',
                'updated_at',
            ]);

        if ($search = $request->get('search')) {
            $query->where('case_number', 'ilike', "%{$search}%");
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($incidentType = $request->get('incident_type')) {
            $query->where('incident_type', $incidentType);
        }

        $sortBy = $request->get('sort_by', 'filing_date');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['case_number', 'filing_date', 'incident_date', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single VAWC case with full details (requires authorization).
     * Access is logged per RA 9262 requirements.
     *
     * GET /api/v1/vawc-cases/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $vawcCase = VawcCase::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        // Log access for audit trail (RA 9262)
        $accessLog = $vawcCase->access_log ?? [];
        $accessLog[] = [
            'user_id' => $request->user()->id,
            'accessed_at' => now()->toIso8601String(),
            'ip_address' => $request->ip(),
        ];
        $vawcCase->update(['access_log' => $accessLog]);

        return response()->json(['vawc_case' => $vawcCase]);
    }

    /**
     * Create a new VAWC case.
     *
     * POST /api/v1/vawc-cases
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'incident_type' => ['required', 'string', 'max:255'],
            'filing_date' => ['required', 'date'],
            'incident_date' => ['required', 'date'],
            'incident_time' => ['nullable', 'string', 'max:10'],
            'incident_place' => ['nullable', 'string', 'max:500'],
            'narrative_encrypted' => ['nullable', 'string'],
            'victim_name_encrypted' => ['required', 'string', 'max:500'],
            'victim_dob' => ['nullable', 'date'],
            'victim_address_encrypted' => ['nullable', 'string', 'max:500'],
            'victim_phone_encrypted' => ['nullable', 'string', 'max:100'],
            'victim_occupation' => ['nullable', 'string', 'max:255'],
            'victim_income_range' => ['nullable', 'string', 'max:100'],
            'victim_civil_status' => ['nullable', 'string', 'max:50'],
            'victim_resident_id' => ['nullable', 'uuid'],
            'respondent_name_encrypted' => ['required', 'string', 'max:500'],
            'respondent_dob' => ['nullable', 'date'],
            'respondent_address_encrypted' => ['nullable', 'string', 'max:500'],
            'respondent_phone_encrypted' => ['nullable', 'string', 'max:100'],
            'respondent_occupation' => ['nullable', 'string', 'max:255'],
            'respondent_civil_status' => ['nullable', 'string', 'max:50'],
            'respondent_relationship' => ['required', 'string', 'max:255'],
            'children_info_encrypted' => ['nullable', 'string'],
            'bpo_issued' => ['boolean'],
            'bpo_issued_date' => ['nullable', 'date'],
            'bpo_expiry_date' => ['nullable', 'date'],
            'tpo_referred' => ['boolean'],
            'tpo_date' => ['nullable', 'date'],
            'ppo_referred' => ['boolean'],
            'ppo_date' => ['nullable', 'date'],
            'referred_to_pnp' => ['boolean'],
            'pnp_referral_time' => ['nullable', 'date'],
            'referred_to_dswd' => ['boolean'],
            'dswd_referral_time' => ['nullable', 'date'],
            'other_referrals' => ['nullable', 'array'],
            'vaw_desk_officer_id' => ['nullable', 'uuid'],
            'logbook_type' => ['nullable', 'string', 'max:50'],
            'logbook_page_number' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'in:filed,under_investigation,protection_order,resolved,dismissed,referred'],
        ]);

        $barangayId = $request->user()->barangay_id;

        // Auto-generate case number
        $year = now()->format('Y');
        $lastCase = VawcCase::where('barangay_id', $barangayId)
            ->where('case_number', 'ilike', "VAWC-{$year}-%")
            ->orderByRaw("CAST(SUBSTRING(case_number FROM 'VAWC-\\d{4}-(\\d+)') AS INTEGER) DESC NULLS LAST")
            ->first();

        $nextSeq = $lastCase
            ? ((int) preg_replace('/^VAWC-\d{4}-/', '', $lastCase->case_number)) + 1
            : 1;
        $caseNumber = "VAWC-{$year}-".str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

        $vawcCase = VawcCase::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'case_number' => $caseNumber,
            'status' => $validated['status'] ?? 'under_investigation',
            'access_log' => [
                [
                    'user_id' => $request->user()->id,
                    'action' => 'created',
                    'accessed_at' => now()->toIso8601String(),
                    'ip_address' => $request->ip(),
                ],
            ],
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'VAWC case created.',
            'vawc_case' => $vawcCase,
        ], 201);
    }

    /**
     * Update a VAWC case.
     *
     * PUT /api/v1/vawc-cases/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $vawcCase = VawcCase::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'incident_type' => ['sometimes', 'string', 'max:255'],
            'incident_date' => ['sometimes', 'date'],
            'incident_time' => ['nullable', 'string', 'max:10'],
            'incident_place' => ['nullable', 'string', 'max:500'],
            'narrative_encrypted' => ['nullable', 'string'],
            'victim_name_encrypted' => ['sometimes', 'string', 'max:500'],
            'victim_dob' => ['nullable', 'date'],
            'victim_address_encrypted' => ['nullable', 'string', 'max:500'],
            'victim_phone_encrypted' => ['nullable', 'string', 'max:100'],
            'victim_occupation' => ['nullable', 'string', 'max:255'],
            'victim_income_range' => ['nullable', 'string', 'max:100'],
            'victim_civil_status' => ['nullable', 'string', 'max:50'],
            'respondent_name_encrypted' => ['sometimes', 'string', 'max:500'],
            'respondent_dob' => ['nullable', 'date'],
            'respondent_address_encrypted' => ['nullable', 'string', 'max:500'],
            'respondent_phone_encrypted' => ['nullable', 'string', 'max:100'],
            'respondent_occupation' => ['nullable', 'string', 'max:255'],
            'respondent_civil_status' => ['nullable', 'string', 'max:50'],
            'respondent_relationship' => ['sometimes', 'string', 'max:255'],
            'children_info_encrypted' => ['nullable', 'string'],
            'bpo_issued' => ['boolean'],
            'bpo_issued_date' => ['nullable', 'date'],
            'bpo_expiry_date' => ['nullable', 'date'],
            'tpo_referred' => ['boolean'],
            'tpo_date' => ['nullable', 'date'],
            'ppo_referred' => ['boolean'],
            'ppo_date' => ['nullable', 'date'],
            'referred_to_pnp' => ['boolean'],
            'pnp_referral_time' => ['nullable', 'date'],
            'referred_to_dswd' => ['boolean'],
            'dswd_referral_time' => ['nullable', 'date'],
            'other_referrals' => ['nullable', 'array'],
            'vaw_desk_officer_id' => ['nullable', 'uuid'],
            'logbook_type' => ['nullable', 'string', 'max:50'],
            'logbook_page_number' => ['nullable', 'integer', 'min:1'],
            'status' => ['sometimes', 'in:filed,under_investigation,protection_order,resolved,dismissed,referred'],
        ]);

        // Log modification access
        $accessLog = $vawcCase->access_log ?? [];
        $accessLog[] = [
            'user_id' => $request->user()->id,
            'action' => 'updated',
            'accessed_at' => now()->toIso8601String(),
            'ip_address' => $request->ip(),
        ];
        $validated['access_log'] = $accessLog;
        $validated['updated_by'] = $request->user()->id;

        $vawcCase->update($validated);

        return response()->json([
            'message' => 'VAWC case updated.',
            'vawc_case' => $vawcCase->fresh(),
        ]);
    }

    /**
     * Soft delete a VAWC case.
     *
     * DELETE /api/v1/vawc-cases/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $vawcCase = VawcCase::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $vawcCase->update(['deleted_by' => $request->user()->id]);
        $vawcCase->delete();

        return response()->json(['message' => 'VAWC case deleted.']);
    }
}
