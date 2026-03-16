<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Judicial\BlotterRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlotterController extends Controller
{
    // Valid status flow: filed → for_hearing → for_subpoena → settled → closed
    private const STATUSES = ['filed', 'for_hearing', 'for_subpoena', 'settled', 'closed'];

    /**
     * GET /api/v1/blotters/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $query = BlotterRecord::where('barangay_id', $barangayId);

        $total       = (clone $query)->count();
        $filed       = (clone $query)->where('status', 'filed')->count();
        $forHearing  = (clone $query)->where('status', 'for_hearing')->count();
        $forSubpoena = (clone $query)->where('status', 'for_subpoena')->count();
        $settled     = (clone $query)->where('status', 'settled')->count();
        $closed      = (clone $query)->where('status', 'closed')->count();
        $thisMonth   = (clone $query)
            ->whereYear('filing_date', now()->year)
            ->whereMonth('filing_date', now()->month)
            ->count();

        return response()->json([
            'total'        => $total,
            'filed'        => $filed,
            'for_hearing'  => $forHearing,
            'for_subpoena' => $forSubpoena,
            'settled'      => $settled,
            'closed'       => $closed,
            'active'       => $filed + $forHearing + $forSubpoena,
            'this_month'   => $thisMonth,
        ]);
    }

    /**
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

        $sortBy  = $request->get('sort_by', 'filing_date');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowed = ['blotter_number', 'filing_date', 'incident_date', 'status', 'created_at'];

        if (in_array($sortBy, $allowed)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * GET /api/v1/blotters/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $blotter = BlotterRecord::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['blotter' => $blotter]);
    }

    /**
     * POST /api/v1/blotters
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'incident_type'           => ['required', 'string', 'max:200'],
            'incident_date'           => ['nullable', 'date'],
            'incident_time'           => ['nullable', 'string', 'max:10'],
            'incident_place'          => ['nullable', 'string', 'max:255'],
            'narrative'               => ['required', 'string'],
            'resolution'              => ['nullable', 'string'],
            'complainant_name'        => ['required', 'string', 'max:200'],
            'complainant_address'     => ['nullable', 'string', 'max:500'],
            'complainant_mobile'      => ['nullable', 'string', 'max:20'],
            'complainant_resident_id' => ['nullable', 'uuid'],
            'respondent_name'         => ['required', 'string', 'max:200'],
            'respondent_address'      => ['nullable', 'string', 'max:500'],
            'respondent_mobile'       => ['nullable', 'string', 'max:20'],
            'respondent_resident_id'  => ['nullable', 'uuid'],
            'officer_on_duty_id'      => ['nullable', 'uuid'],
            'status'                  => ['nullable', 'in:' . implode(',', self::STATUSES)],
        ]);

        $barangayId = $request->user()->barangay_id;

        // Auto-generate blotter number: BLT-YYYY-XXXX
        $year        = now()->format('Y');
        $lastBlotter = BlotterRecord::where('barangay_id', $barangayId)
            ->where('blotter_number', 'ilike', "BLT-{$year}-%")
            ->orderByRaw("CAST(SUBSTRING(blotter_number FROM 'BLT-\\d{4}-(\\d+)') AS INTEGER) DESC NULLS LAST")
            ->first();

        $nextSeq       = $lastBlotter
            ? ((int) preg_replace('/^BLT-\d{4}-/', '', $lastBlotter->blotter_number)) + 1
            : 1;
        $blotterNumber = "BLT-{$year}-" . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

        $blotter = BlotterRecord::create([
            ...$validated,
            'barangay_id'    => $barangayId,
            'blotter_number' => $blotterNumber,
            'filing_date'    => now()->toDateString(),
            'status'         => $validated['status'] ?? 'filed',
            'created_by'     => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Blotter record created.',
            'blotter' => $blotter,
        ], 201);
    }

    /**
     * PUT /api/v1/blotters/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $blotter = BlotterRecord::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'incident_type'           => ['sometimes', 'string', 'max:200'],
            'incident_date'           => ['nullable', 'date'],
            'incident_time'           => ['nullable', 'string', 'max:10'],
            'incident_place'          => ['nullable', 'string', 'max:255'],
            'narrative'               => ['sometimes', 'string'],
            'complainant_name'        => ['sometimes', 'string', 'max:200'],
            'complainant_address'     => ['nullable', 'string', 'max:500'],
            'complainant_mobile'      => ['nullable', 'string', 'max:20'],
            'complainant_resident_id' => ['nullable', 'uuid'],
            'respondent_name'         => ['sometimes', 'string', 'max:200'],
            'respondent_address'      => ['nullable', 'string', 'max:500'],
            'respondent_mobile'       => ['nullable', 'string', 'max:20'],
            'respondent_resident_id'  => ['nullable', 'uuid'],
            'officer_on_duty_id'      => ['nullable', 'uuid'],
            'resolution'              => ['nullable', 'string'],
            'status'                  => ['sometimes', 'in:' . implode(',', self::STATUSES)],
            'linked_kp_case_id'       => ['nullable', 'uuid'],
            'attachment_file_ids'     => ['nullable', 'array'],
        ]);

        $validated['updated_by'] = $request->user()->id;
        $blotter->update($validated);

        return response()->json([
            'message' => 'Blotter record updated.',
            'blotter' => $blotter->fresh(),
        ]);
    }

    /**
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
