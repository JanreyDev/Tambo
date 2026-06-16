<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Admin\Barangay;
use App\Models\Platform\AuditLog;
use App\Models\Tenant\Records\Establishment;
use App\Models\Tenant\Records\EstablishmentTransaction;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EstablishmentController extends Controller
{
    public function __construct(
        private readonly SmsService $smsService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = Establishment::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('business_name', 'ilike', "%{$search}%")
                    ->orWhere('owner_name', 'ilike', "%{$search}%")
                    ->orWhere('establishment_number', 'ilike', "%{$search}%")
                    ->orWhere('business_type', 'ilike', "%{$search}%");
            });
        }

        if ($type = $request->get('type')) {
            $query->where('business_type', $type);
        }

        if ($status = $request->get('status')) {
            $phYear = now()->timezone('Asia/Manila')->year;

            if ($status === 'active') {
                // Active = registered this year (new doc) OR has a renewal transaction — and not closed
                $query->where('status', '!=', 'closed')
                    ->where(function ($q) use ($phYear) {
                        $q->whereRaw(
                            "EXTRACT(YEAR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Manila')) = ?",
                            [$phYear]
                        )->orWhereHas('transactions', fn ($tq) => $tq->where('transaction_type', 'renewal'));
                    });
            } elseif ($status === 'inactive') {
                // Inactive = registered before this year, NO renewal transaction, and not closed
                $query->whereRaw(
                    "EXTRACT(YEAR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Manila')) < ?",
                    [$phYear]
                )->whereDoesntHave('transactions', fn ($tq) => $tq->where('transaction_type', 'renewal'))
                    ->where('status', '!=', 'closed');
            } elseif ($status === 'closed') {
                // Closed = has a closure transaction
                $query->whereHas('transactions', fn ($tq) => $tq->where('transaction_type', 'closure'));
            } else {
                $query->where('status', $status);
            }
        }

        $allowedSorts = ['business_name', 'establishment_number', 'business_type', 'status', 'created_at', 'permit_expiry'];
        $sortBy = in_array($request->get('sort_by'), $allowedSorts, true) ? $request->get('sort_by') : 'business_name';
        $sortDir = $request->get('sort_dir', 'asc');

        // Active establishments always float to the top, regardless of secondary sort
        $query->orderByRaw("CASE WHEN status = 'active' THEN 0 ELSE 1 END")
            ->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    public function stats(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $base = Establishment::where('barangay_id', $barangayId);

        // Current year in Philippine Standard Time (UTC+8)
        $phNow = now()->timezone('Asia/Manila');
        $currentYear = $phNow->year;

        // 1. Total — all non-deleted establishments, all statuses, all years
        $total = (clone $base)->count();

        // 2. Active — registered this year (new doc) OR has a renewal transaction — and not closed
        $activeThisYear = (clone $base)
            ->where('status', '!=', 'closed')
            ->where(function ($q) use ($currentYear) {
                $q->whereRaw(
                    "EXTRACT(YEAR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Manila')) = ?",
                    [$currentYear]
                )->orWhereHas('transactions', fn ($tq) => $tq->where('transaction_type', 'renewal'));
            })
            ->count();

        // 3. Total Documents Generated — every establishment record = one issued document
        //    Counts all non-deleted records regardless of status or year (never decreases)
        $totalDocuments = $total;

        return response()->json([
            'total' => $total,
            'active' => $activeThisYear,
            'total_documents' => $totalDocuments,
            'current_year' => $currentYear,
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $establishment = Establishment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['establishment' => $establishment]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'business_name' => ['required', 'string', 'max:255'],
            'business_type' => ['required', 'string', 'max:100'],
            'owner_resident_id' => ['nullable', 'uuid'],
            'owner_name' => ['required', 'string', 'max:200'],
            'owner_contact' => ['required', 'string', 'max:20'],
            'owner_email' => ['nullable', 'string', 'max:255'],
            'owner_address' => ['nullable', 'string', 'max:500'],
            'purok' => ['nullable', 'string', 'max:100'],
            'street' => ['nullable', 'string', 'max:255'],
            'exact_address' => ['nullable', 'string'],
            'registration_type' => ['nullable', 'in:DTI,SEC'],
            'registration_number' => ['nullable', 'string', 'max:100'],
            'registration_date' => ['nullable', 'date'],
            'permit_number' => ['nullable', 'string', 'max:100'],
            'permit_expiry' => ['nullable', 'date'],
            'status' => ['nullable', 'in:active,inactive,closed,suspended'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $barangayId = $request->user()->barangay_id;
        $barangay = Barangay::findOrFail($barangayId);
        $psgcCode = $barangay->psgc_code;
        $phYear = now()->timezone('Asia/Manila')->year;

        if (! $psgcCode) {
            return response()->json([
                'message' => 'Barangay PSGC code is not configured. Contact administrator.',
            ], 422);
        }

        // Generate EST-{PSGC}-{YEAR}-{XXXX} — sequential per barangay per year
        $prefix = "EST-{$psgcCode}-{$phYear}-";
        $sequenceOrderSql = DB::connection()->getDriverName() === 'sqlite'
            ? 'CAST(SUBSTR(establishment_number, '.(strlen($prefix) + 1).') AS INTEGER) DESC'
            : "CAST(SPLIT_PART(establishment_number, '-', 4) AS INTEGER) DESC";
        $lastSeq = Establishment::where('barangay_id', $barangayId)
            ->where('establishment_number', 'like', "{$prefix}%")
            ->orderByRaw($sequenceOrderSql)
            ->value('establishment_number');

        $nextSeq = $lastSeq
            ? (int) substr($lastSeq, strrpos($lastSeq, '-') + 1) + 1
            : 1;

        $establishmentNumber = $prefix.str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

        $establishment = Establishment::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'establishment_number' => $establishmentNumber,
            'status' => $validated['status'] ?? 'active',
            'created_by' => $request->user()->id,
        ]);

        // Log initial "new" transaction
        EstablishmentTransaction::create([
            'barangay_id' => $barangayId,
            'establishment_id' => $establishment->id,
            'transaction_type' => 'new',
            'year' => $phYear,
            'created_by' => $request->user()->id,
            'created_at' => now(),
        ]);

        $this->logAudit($request, 'created', $establishment, [
            'establishment_number' => $establishmentNumber,
            'business_name' => $establishment->business_name,
            'business_type' => $establishment->business_type,
            'owner_name' => $establishment->owner_name,
            'status' => $establishment->status,
        ]);

        return response()->json([
            'message' => 'Establishment created.',
            'establishment' => $establishment,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $establishment = Establishment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'business_name' => ['sometimes', 'string', 'max:255'],
            'business_type' => ['sometimes', 'string', 'max:100'],
            'owner_resident_id' => ['nullable', 'uuid'],
            'owner_name' => ['sometimes', 'string', 'max:200'],
            'owner_contact' => ['sometimes', 'string', 'max:20'],
            'owner_email' => ['nullable', 'string', 'max:255'],
            'owner_address' => ['nullable', 'string', 'max:500'],
            'purok' => ['nullable', 'string', 'max:100'],
            'street' => ['nullable', 'string', 'max:255'],
            'exact_address' => ['nullable', 'string'],
            'registration_type' => ['nullable', 'in:DTI,SEC'],
            'registration_number' => ['nullable', 'string', 'max:100'],
            'registration_date' => ['nullable', 'date'],
            'permit_number' => ['nullable', 'string', 'max:100'],
            'permit_expiry' => ['nullable', 'date'],
            'status' => ['sometimes', 'in:active,inactive,closed,suspended'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        // Capture before-state for diff
        $before = $establishment->only(array_keys($validated));

        $validated['updated_by'] = $request->user()->id;
        $establishment->update($validated);

        $after = $establishment->fresh()->only(array_keys($validated));
        $changes = [];
        foreach ($after as $field => $newVal) {
            $oldVal = $before[$field] ?? null;
            if ((string) $oldVal !== (string) ($newVal ?? '')) {
                $changes[$field] = ['from' => $oldVal, 'to' => $newVal];
            }
        }

        $this->logAudit($request, 'updated', $establishment, $changes ?: null);

        return response()->json([
            'message' => 'Establishment updated.',
            'establishment' => $establishment->fresh(),
        ]);
    }

    public function renew(Request $request, string $id): JsonResponse
    {
        $establishment = Establishment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $phYear = now()->timezone('Asia/Manila')->year;

        $establishment->status = 'active';
        $establishment->updated_by = $request->user()->id;
        $establishment->save();

        EstablishmentTransaction::create([
            'barangay_id' => $establishment->barangay_id,
            'establishment_id' => $establishment->id,
            'transaction_type' => 'renewal',
            'year' => $phYear,
            'created_by' => $request->user()->id,
            'created_at' => now(),
        ]);

        $this->logAudit($request, 'renewed', $establishment, ['year' => $phYear, 'status' => 'active']);

        return response()->json([
            'message' => 'Establishment renewed.',
            'establishment' => $establishment->fresh(),
        ]);
    }

    public function close(Request $request, string $id): JsonResponse
    {
        $establishment = Establishment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $phYear = now()->timezone('Asia/Manila')->year;

        $establishment->status = 'closed';
        $establishment->updated_by = $request->user()->id;
        $establishment->save();

        EstablishmentTransaction::create([
            'barangay_id' => $establishment->barangay_id,
            'establishment_id' => $establishment->id,
            'transaction_type' => 'closure',
            'year' => $phYear,
            'created_by' => $request->user()->id,
            'created_at' => now(),
        ]);

        $this->logAudit($request, 'closed', $establishment, ['year' => $phYear, 'status' => 'closed']);

        return response()->json([
            'message' => 'Establishment marked as closed.',
            'establishment' => $establishment->fresh(),
        ]);
    }

    public function permit(Request $request, string $id): JsonResponse
    {
        $establishment = Establishment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $phYear = now()->timezone('Asia/Manila')->year;

        EstablishmentTransaction::create([
            'barangay_id' => $establishment->barangay_id,
            'establishment_id' => $establishment->id,
            'transaction_type' => 'new',
            'year' => $phYear,
            'created_by' => $request->user()->id,
            'created_at' => now(),
        ]);

        $this->logAudit($request, 'permit_issued', $establishment, ['year' => $phYear]);

        return response()->json([
            'message' => 'Business permit issued.',
            'establishment' => $establishment->fresh(),
        ]);
    }

    public function transactions(Request $request, string $id): JsonResponse
    {
        $establishment = Establishment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $transactions = EstablishmentTransaction::where('establishment_id', $establishment->id)
            ->with('creator:id,first_name,middle_name,last_name,extension_name')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'transaction_type', 'year', 'notes', 'created_at', 'created_by'])
            ->map(fn ($tx) => [
                'id' => $tx->id,
                'transaction_type' => $tx->transaction_type,
                'year' => $tx->year,
                'notes' => $tx->notes,
                'created_at' => $tx->created_at,
                'generated_by' => $tx->creator?->full_name ?? 'System',
            ]);

        return response()->json(['transactions' => $transactions]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $establishment = Establishment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $this->logAudit($request, 'deleted', $establishment, [
            'business_name' => $establishment->business_name,
            'establishment_number' => $establishment->establishment_number,
        ]);

        $establishment->update(['deleted_by' => $request->user()->id]);
        $establishment->delete();

        return response()->json(['message' => 'Establishment deleted.']);
    }

    public function sendSms(Request $request, string $id): JsonResponse
    {
        $establishment = Establishment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        if (empty($establishment->owner_contact)) {
            return response()->json([
                'message' => 'This establishment has no registered contact number.',
            ], 422);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:636'],
        ]);

        $userMessage = trim($validated['message']);
        $barangay = $request->user()->barangay;

        $message = SmsService::formatWithSenderHeader($userMessage, $barangay);
        $cost = SmsService::calculateCost($message);
        $segments = SmsService::calculateSegments($message);

        if (! $barangay->hasSmsCredits($cost)) {
            return response()->json([
                'message' => 'Insufficient SMS credits. Balance: ₱'.number_format((float) $barangay->sms_credit_balance, 2).', required: ₱'.number_format($cost, 2).'.',
            ], 422);
        }

        $sent = $this->smsService->send(
            phone: $establishment->owner_contact,
            message: $message,
            barangay: $barangay,
            source: 'establishment_sms',
            sourceId: $establishment->id,
        );

        if (! $sent) {
            return response()->json([
                'message' => 'SMS failed to send. Check TxtBox configuration or credits and try again.',
            ], 500);
        }

        $barangay->refresh();

        return response()->json([
            'message' => 'SMS sent successfully.',
            'segments' => $segments,
            'cost' => $cost,
            'remaining_balance' => (float) $barangay->sms_credit_balance,
        ]);
    }

    public function smsHistory(Request $request, string $id): JsonResponse
    {
        $establishment = Establishment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $perPage = min((int) $request->get('per_page', 20), 50);

        $logs = \App\Models\Platform\SmsTransaction::where('barangay_id', $request->user()->barangay_id)
            ->where('source', 'establishment_sms')
            ->where('source_id', $establishment->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($logs);
    }

    public function checkDuplicate(Request $request): JsonResponse
    {
        $request->validate([
            'business_name' => ['required', 'string', 'max:255'],
            'business_type' => ['nullable', 'string', 'max:100'],
            'exclude_id' => ['nullable', 'uuid'],
        ]);

        $barangayId = $request->user()->barangay_id;
        $businessName = trim($request->input('business_name'));
        $businessType = trim($request->input('business_type', ''));
        $excludeId = $request->input('exclude_id');

        $query = Establishment::where('barangay_id', $barangayId)
            ->whereRaw('LOWER(business_name) = LOWER(?)', [$businessName]);

        if ($businessType !== '') {
            $query->whereRaw('LOWER(business_type) = LOWER(?)', [$businessType]);
        }

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $match = $query->first();

        if (! $match) {
            return response()->json(['duplicate' => false]);
        }

        return response()->json([
            'duplicate' => true,
            'establishment' => $match,
        ]);
    }

    public function activity(Request $request, string $id): JsonResponse
    {
        $establishment = Establishment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $perPage = min((int) $request->get('per_page', 25), 50);

        $logs = AuditLog::where('resource_type', 'establishment')
            ->where('resource_id', $establishment->id)
            ->with('user:id,username,first_name,middle_name,last_name')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($logs);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private function logAudit(Request $request, string $action, Establishment $establishment, ?array $changes = null): void
    {
        AuditLog::create([
            'barangay_id' => $establishment->barangay_id,
            'user_id' => $request->user()->id,
            'action' => $action,
            'resource_type' => 'establishment',
            'resource_id' => $establishment->id,
            'changes' => $changes,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'module' => 'establishments',
        ]);
    }
}
