<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Tanod\TanodIncidentReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TanodIncidentReportController extends Controller
{
    /**
     * List tanod incident reports with search/filter/pagination.
     *
     * GET /api/v1/tanod-incident-reports
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = TanodIncidentReport::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('incident_number', 'ilike', "%{$search}%")
                  ->orWhere('what', 'ilike', "%{$search}%")
                  ->orWhere('incident_location', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $sortBy = $request->get('sort_by', 'incident_date');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['incident_number', 'incident_date', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single incident report.
     *
     * GET /api/v1/tanod-incident-reports/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $report = TanodIncidentReport::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['tanod_incident_report' => $report]);
    }

    /**
     * Create a new tanod incident report.
     *
     * POST /api/v1/tanod-incident-reports
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reporting_tanod_id' => ['required', 'uuid'],
            'incident_date' => ['required', 'date'],
            'incident_time' => ['nullable', 'string', 'max:10'],
            'incident_location' => ['nullable', 'string', 'max:500'],
            'who' => ['nullable', 'string'],
            'what' => ['required', 'string'],
            'when_details' => ['nullable', 'string'],
            'where_details' => ['nullable', 'string'],
            'why' => ['nullable', 'string'],
            'how' => ['nullable', 'string'],
            'actions_taken' => ['nullable', 'string'],
            'referred_to' => ['nullable', 'string', 'max:255'],
            'linked_blotter_id' => ['nullable', 'uuid'],
            'linked_vawc_case_id' => ['nullable', 'uuid'],
            'witness_info' => ['nullable', 'array'],
            'evidence_file_ids' => ['nullable', 'array'],
            'status' => ['nullable', 'in:filed,under_review,resolved,escalated'],
        ]);

        $barangayId = $request->user()->barangay_id;

        // Auto-generate incident number
        $year = now()->format('Y');
        $lastReport = TanodIncidentReport::where('barangay_id', $barangayId)
            ->where('incident_number', 'ilike', "TIR-{$year}-%")
            ->orderByRaw("CAST(SUBSTRING(incident_number FROM 'TIR-\\d{4}-(\\d+)') AS INTEGER) DESC NULLS LAST")
            ->first();

        $nextSeq = $lastReport
            ? ((int) preg_replace('/^TIR-\d{4}-/', '', $lastReport->incident_number)) + 1
            : 1;
        $incidentNumber = "TIR-{$year}-" . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

        $report = TanodIncidentReport::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'incident_number' => $incidentNumber,
            'status' => $validated['status'] ?? 'filed',
        ]);

        return response()->json([
            'message' => 'Incident report created.',
            'tanod_incident_report' => $report,
        ], 201);
    }

    /**
     * Update an incident report.
     *
     * PUT /api/v1/tanod-incident-reports/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $report = TanodIncidentReport::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'incident_date' => ['sometimes', 'date'],
            'incident_time' => ['nullable', 'string', 'max:10'],
            'incident_location' => ['nullable', 'string', 'max:500'],
            'who' => ['nullable', 'string'],
            'what' => ['sometimes', 'string'],
            'when_details' => ['nullable', 'string'],
            'where_details' => ['nullable', 'string'],
            'why' => ['nullable', 'string'],
            'how' => ['nullable', 'string'],
            'actions_taken' => ['nullable', 'string'],
            'referred_to' => ['nullable', 'string', 'max:255'],
            'linked_blotter_id' => ['nullable', 'uuid'],
            'linked_vawc_case_id' => ['nullable', 'uuid'],
            'witness_info' => ['nullable', 'array'],
            'evidence_file_ids' => ['nullable', 'array'],
            'status' => ['sometimes', 'in:filed,under_review,resolved,escalated'],
        ]);

        $report->update($validated);

        return response()->json([
            'message' => 'Incident report updated.',
            'tanod_incident_report' => $report->fresh(),
        ]);
    }

    /**
     * Delete an incident report.
     *
     * DELETE /api/v1/tanod-incident-reports/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $report = TanodIncidentReport::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $report->delete();

        return response()->json(['message' => 'Incident report deleted.']);
    }
}
