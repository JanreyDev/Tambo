<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Admin\Barangay;
use App\Models\Platform\AuditLog;
use App\Models\Tenant\Judicial\KpCase;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KpCaseController extends Controller
{
    public function __construct(private readonly SmsService $smsService) {}

    /**
     * List KP cases with search/filter/pagination.
     *
     * GET /api/v1/kp-cases
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = KpCase::where('barangay_id', $barangayId)
            ->with('parties');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('case_number', 'ilike', "%{$search}%")
                    ->orWhere('nature', 'ilike', "%{$search}%")
                    ->orWhere('nature_of_complaint', 'ilike', "%{$search}%")
                    ->orWhereHas('parties', fn ($pq) => $pq->where('full_name', 'ilike', "%{$search}%"));
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($caseLevel = $request->get('case_level')) {
            $query->where('case_level', $caseLevel);
        }

        if ($dateFrom = $request->get('filing_date_from')) {
            $query->where('filing_date', '>=', $dateFrom);
        }

        if ($dateTo = $request->get('filing_date_to')) {
            $query->where('filing_date', '<=', $dateTo);
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
     * Get KP case stats.
     *
     * GET /api/v1/kp-cases/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $year = $request->get('year') ? (int) $request->get('year') : now()->year;

        $base = KpCase::where('barangay_id', $barangayId)
            ->whereYear('filing_date', $year);

        $total = (clone $base)->count();
        $active = (clone $base)->whereNotIn('status', ['settled', 'dismissed', 'closed', 'cfa_issued'])->count();
        $settled = (clone $base)->where('status', 'settled')->count();
        $mediation = (clone $base)->where('case_level', 'mediation')->whereNotIn('status', ['settled', 'dismissed', 'closed', 'cfa_issued'])->count();
        $conciliation = (clone $base)->where('case_level', 'conciliation')->whereNotIn('status', ['settled', 'dismissed', 'closed', 'cfa_issued'])->count();
        $cfaIssued = (clone $base)->where('status', 'cfa_issued')->count();
        $arbitration = (clone $base)->where('status', 'arbitration')->count();
        $dismissed = (clone $base)->where('status', 'dismissed')->count();

        // Overdue: mediation deadline passed but still in mediation
        $overdueMediation = (clone $base)
            ->where('case_level', 'mediation')
            ->whereNotIn('status', ['settled', 'dismissed', 'closed', 'cfa_issued'])
            ->whereNotNull('mediation_deadline')
            ->where('mediation_deadline', '<', now()->toDateString())
            ->count();

        $overdueConciliation = (clone $base)
            ->where('case_level', 'conciliation')
            ->whereNotIn('status', ['settled', 'dismissed', 'closed', 'cfa_issued'])
            ->where(function ($q) {
                $q->where(function ($q2) {
                    $q2->whereNotNull('conciliation_extended_deadline')
                        ->where('conciliation_extended_deadline', '<', now()->toDateString());
                })->orWhere(function ($q2) {
                    $q2->whereNull('conciliation_extended_deadline')
                        ->whereNotNull('conciliation_deadline')
                        ->where('conciliation_deadline', '<', now()->toDateString());
                });
            })
            ->count();

        return response()->json([
            'year' => $year,
            'total' => $total,
            'active' => $active,
            'settled' => $settled,
            'mediation' => $mediation,
            'conciliation' => $conciliation,
            'arbitration' => $arbitration,
            'cfa_issued' => $cfaIssued,
            'dismissed' => $dismissed,
            'overdue_mediation' => $overdueMediation,
            'overdue_conciliation' => $overdueConciliation,
        ]);
    }

    /**
     * Get a single KP case with parties and hearings.
     *
     * GET /api/v1/kp-cases/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $kpCase = KpCase::where('barangay_id', $request->user()->barangay_id)
            ->with(['parties', 'hearings' => fn ($q) => $q->orderBy('hearing_date', 'desc')])
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
            'remarks' => ['nullable', 'string'],
            'complainant_type' => ['nullable', 'string', 'max:50'],
            'respondent_type' => ['nullable', 'string', 'max:50'],
            'filing_date' => ['required', 'date'],
            'presiding_officer_id' => ['nullable', 'uuid'],
            'lupon_secretary_id' => ['nullable', 'uuid'],
            'status' => ['nullable', 'in:filed,mediation,conciliation,arbitration,settled,cfa_issued,dismissed,closed,elevated'],
        ]);

        $barangayId = $request->user()->barangay_id;

        // Case number uses the filing_date year — not today's date.
        // Handles late entries: December cases filed in January still get KP-{prev_year}-XXXX.
        // created_at is the audit trail for when it was actually entered.
        $year = \Carbon\Carbon::parse($validated['filing_date'])->format('Y');
        $casePrefix = "KP-{$year}-";
        $sequenceOrderSql = DB::connection()->getDriverName() === 'sqlite'
            ? 'CAST(SUBSTR(case_number, '.(strlen($casePrefix) + 1).') AS INTEGER) DESC'
            : "CAST(SUBSTRING(case_number FROM 'KP-\\d{4}-(\\d+)') AS INTEGER) DESC NULLS LAST";
        $lastCase = KpCase::where('barangay_id', $barangayId)
            ->where('case_number', 'like', "{$casePrefix}%")
            ->orderByRaw($sequenceOrderSql)
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

        $this->logAudit($request, 'created', $kpCase);

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
            'status' => ['sometimes', 'in:filed,mediation,conciliation,arbitration,settled,cfa_issued,dismissed,closed,elevated'],
            'remarks' => ['nullable', 'string'],
        ]);

        $old = $kpCase->only(array_keys($validated));
        $validated['updated_by'] = $request->user()->id;
        $kpCase->update($validated);

        $changes = array_filter(
            array_map(fn ($k) => isset($old[$k]) && $old[$k] != $kpCase->$k
                ? ['from' => $old[$k], 'to' => $kpCase->$k] : null, array_keys($validated)),
            fn ($v) => $v !== null
        );
        // Use distinct action for status transitions so the activity log is clear.
        $action = array_key_exists('status', $changes) ? 'status_changed' : 'updated';
        $this->logAudit($request, $action, $kpCase, $changes ?: null);

        return response()->json([
            'message' => 'KP case updated.',
            'kp_case' => $kpCase->fresh(),
        ]);
    }

    /**
     * Log a document generation event (print is client-side, so frontend calls this).
     *
     * POST /api/v1/kp-cases/{id}/log-document
     */
    public function logDocument(Request $request, string $id): JsonResponse
    {
        $kpCase = KpCase::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'form_number' => ['required', 'integer', 'min:1', 'max:28'],
            'form_name' => ['required', 'string', 'max:255'],
        ]);

        $this->logAudit($request, 'document_generated', $kpCase, [
            'form_number' => $validated['form_number'],
            'form_name' => $validated['form_name'],
        ]);

        return response()->json(['message' => 'Document logged.']);
    }

    /**
     * Send SMS to one or both parties.
     *
     * POST /api/v1/kp-cases/{id}/sms
     */
    public function sendSms(Request $request, string $id): JsonResponse
    {
        $kpCase = KpCase::where('barangay_id', $request->user()->barangay_id)
            ->with('parties')
            ->findOrFail($id);

        $validated = $request->validate([
            'recipient' => ['required', 'in:complainant,respondent,both'],
            'message' => ['required', 'string', 'max:636'],
        ]);

        $barangay = $request->user()->barangay;
        $message = SmsService::formatWithSenderHeader(trim($validated['message']), $barangay);
        $cost = SmsService::calculateCost($message);
        $segments = SmsService::calculateSegments($message);

        // Resolve target parties
        $targets = $kpCase->parties->filter(function ($p) use ($validated) {
            return $validated['recipient'] === 'both'
                || $p->party_type === $validated['recipient'];
        })->filter(fn ($p) => ! empty($p->mobile_number));

        if ($targets->isEmpty()) {
            return response()->json(['message' => 'No mobile number found for the selected recipient(s).'], 422);
        }

        $totalCost = $cost * $targets->count();

        if (! $barangay->hasSmsCredits($totalCost)) {
            return response()->json([
                'message' => 'Insufficient SMS credits. Balance: ₱'.number_format((float) $barangay->sms_credit_balance, 2).', required: ₱'.number_format($totalCost, 2).'.',
            ], 422);
        }

        $sentCount = 0;
        foreach ($targets as $party) {
            $sent = $this->smsService->send(
                phone: $party->mobile_number,
                message: $message,
                barangay: $barangay,
                source: 'kp_case_sms',
                sourceId: $kpCase->id,
            );
            if ($sent) {
                $sentCount++;
            }
        }

        $this->logAudit($request, 'sms_sent', $kpCase, [
            'recipient' => $validated['recipient'],
            'segments' => $segments,
            'cost' => $totalCost,
            'sent' => $sentCount,
            'total' => $targets->count(),
        ]);

        $barangay->refresh();

        return response()->json([
            'message' => "SMS sent to {$sentCount} of {$targets->count()} recipient(s).",
            'sent' => $sentCount,
            'cost' => $totalCost,
            'remaining_balance' => (float) $barangay->sms_credit_balance,
        ]);
    }

    /**
     * Get SMS history for a KP case.
     *
     * GET /api/v1/kp-cases/{id}/sms-history
     */
    public function smsHistory(Request $request, string $id): JsonResponse
    {
        $kpCase = KpCase::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $perPage = min((int) $request->get('per_page', 20), 50);

        $logs = \App\Models\Platform\SmsTransaction::where('barangay_id', $request->user()->barangay_id)
            ->where('source', 'kp_case_sms')
            ->where('source_id', $kpCase->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Get activity log for a KP case.
     *
     * GET /api/v1/kp-cases/{id}/activity
     */
    public function activity(Request $request, string $id): JsonResponse
    {
        $kpCase = KpCase::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $perPage = min((int) $request->get('per_page', 30), 100);

        $logs = AuditLog::where('barangay_id', $request->user()->barangay_id)
            ->where('resource_type', 'kp_case')
            ->where('resource_id', $kpCase->id)
            ->with('user:id,first_name,last_name,username')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Generate an official KP case document (summons, notice, settlement, CFA, summary).
     *
     * POST /api/v1/kp-cases/{id}/generate-document
     */
    public function generateDocument(Request $request, string $id): JsonResponse
    {
        $kpCase = KpCase::with('parties')->where('barangay_id', $request->user()->barangay_id)->findOrFail($id);

        $validated = $request->validate([
            'document_type' => ['required', 'in:summons,notice_of_hearing,settlement_agreement,certification_to_file_action,case_summary'],
        ]);

        $documentType = $validated['document_type'];
        $templateNames = [
            'summons' => 'KP Summons',
            'notice_of_hearing' => 'KP Notice of Hearing',
            'settlement_agreement' => 'KP Settlement Agreement',
            'certification_to_file_action' => 'KP Certification to File Action',
            'case_summary' => 'KP Case Summary',
        ];

        $complainants = $kpCase->parties->where('role', 'complainant')->pluck('full_name')->filter()->join(', ');
        $respondents = $kpCase->parties->where('role', 'respondent')->pluck('full_name')->filter()->join(', ');
        $primaryParty = $kpCase->parties->where('role', 'complainant')->first();

        $barangayId = $request->user()->barangay_id;

        // Generate document number — same pattern as IssuedDocumentController
        $lastDoc = \App\Models\Tenant\Documents\IssuedDocument::where('barangay_id', $barangayId)
            ->max('document_number');
        $nextSeq = $lastDoc ? ((int) $lastDoc) + 1 : 1;
        $documentNumber = str_pad((string) $nextSeq, 8, '0', STR_PAD_LEFT);

        $issuedDoc = \App\Models\Tenant\Documents\IssuedDocument::create([
            'barangay_id' => $barangayId,
            'document_number' => $documentNumber,
            'constituent_type' => 'kp_case',
            'constituent_id' => $kpCase->id,
            'constituent_name' => $primaryParty?->full_name ?? ($complainants ?: 'Unknown'),
            'constituent_number' => $kpCase->case_number,
            'template_name' => $templateNames[$documentType],
            'purpose' => 'KP Case '.$kpCase->case_number,
            'issued_date' => now()->toDateString(),
            'status' => 'issued',
            'custom_field_values' => [
                'document_type' => $documentType,
                'case_number' => $kpCase->case_number,
                'filing_date' => $kpCase->filing_date?->format('F d, Y'),
                'case_level' => $kpCase->case_level,
                'nature' => $kpCase->nature ?? $kpCase->nature_of_complaint,
                'nature_of_complaint' => $kpCase->nature_of_complaint,
                'complainants' => $complainants ?: '—',
                'respondents' => $respondents ?: '—',
                'status' => $kpCase->status,
                'settlement_text' => $kpCase->settlement_text,
                'cfa_reason' => $kpCase->cfa_reason,
                'settlement_date' => $kpCase->settlement_date?->format('F d, Y'),
                'cfa_date' => $kpCase->cfa_date?->format('F d, Y'),
                'is_confidential' => false,
            ],
            'created_by' => $request->user()->id,
        ]);

        $barangay = Barangay::findOrFail($barangayId);
        app(\App\Services\DocumentPdfService::class)->generateCaseDocumentAndStore($issuedDoc, $barangay, $request->user());

        $this->logAudit($request, 'document_generated', $kpCase, [
            'document_number' => $documentNumber,
            'document_type' => $documentType,
            'template_name' => $templateNames[$documentType],
        ]);

        return response()->json(['document' => $issuedDoc->fresh()], 201);
    }

    private function logAudit(Request $request, string $action, KpCase $kpCase, ?array $changes = null): void
    {
        AuditLog::create([
            'barangay_id' => $kpCase->barangay_id,
            'user_id' => $request->user()->id,
            'action' => $action,
            'resource_type' => 'kp_case',
            'resource_id' => $kpCase->id,
            'changes' => $changes,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'module' => 'judicial',
        ]);
    }
}
