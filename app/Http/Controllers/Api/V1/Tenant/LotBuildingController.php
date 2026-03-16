<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Admin\Barangay;
use App\Models\Platform\AuditLog;
use App\Models\Tenant\Records\LotBuilding;
use App\Models\Tenant\Records\LotBuildingTransaction;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LotBuildingController extends Controller
{
    public function __construct(
        private readonly SmsService $smsService,
    ) {}
    // ── List ───────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = LotBuilding::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('owner_name', 'ilike', "%{$search}%")
                    ->orWhere('lot_building_number', 'ilike', "%{$search}%")
                    ->orWhere('exact_address', 'ilike', "%{$search}%")
                    ->orWhere('lot_number', 'ilike', "%{$search}%")
                    ->orWhere('purok', 'ilike', "%{$search}%")
                    ->orWhere('street', 'ilike', "%{$search}%");
            });
        }

        if ($classification = $request->get('classification')) {
            $query->where('classification', $classification);
        }

        if ($propertyClassification = $request->get('property_classification')) {
            $query->where('property_classification', $propertyClassification);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $sortBy = $request->get('sort_by', 'lot_building_number');
        $allowed = [
            'lot_building_number', 'owner_name', 'classification',
            'property_classification', 'purok', 'size', 'assessed_value',
            'status', 'created_at',
        ];
        if (! in_array($sortBy, $allowed, true)) {
            $sortBy = 'lot_building_number';
        }
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    // ── Stats ──────────────────────────────────────────────────────────

    public function stats(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $base = LotBuilding::where('barangay_id', $barangayId);

        $phYear = now()->timezone('Asia/Manila')->year;

        $total = (clone $base)->count();
        $lots = (clone $base)->where('classification', 'lot_only')->count();
        $buildings = (clone $base)->where('classification', 'building_only')->count();
        $lotAndBuilding = (clone $base)->where('classification', 'lot_and_building')->count();
        $active = (clone $base)->where('status', 'active')->count();

        $totalClearancesThisYear = LotBuildingTransaction::where('barangay_id', $barangayId)
            ->where('year', $phYear)
            ->count();

        return response()->json([
            'total'                      => $total,
            'lots'                       => $lots,
            'buildings'                  => $buildings,
            'lot_and_building'           => $lotAndBuilding,
            'active'                     => $active,
            'total_clearances_this_year' => $totalClearancesThisYear,
        ]);
    }

    // ── Show ───────────────────────────────────────────────────────────

    public function show(Request $request, string $id): JsonResponse
    {
        $record = LotBuilding::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['lot_building' => $record]);
    }

    // ── Store ──────────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'classification' => ['required', 'in:lot_only,building_only,lot_and_building'],
            'property_classification' => ['nullable', 'string', 'max:100'],
            'owner_name' => ['required', 'string', 'max:200'],
            'owner_contact' => ['nullable', 'string', 'max:20'],
            'owner_email' => ['nullable', 'email', 'max:255'],
            'owner_address' => ['nullable', 'string', 'max:500'],
            'size' => ['nullable', 'string', 'max:100'],
            'mri' => ['nullable', 'string', 'max:100'],
            'purok' => ['nullable', 'string', 'max:100'],
            'street' => ['nullable', 'string', 'max:255'],
            'exact_address' => ['nullable', 'string', 'max:500'],
            'lot_number' => ['nullable', 'string', 'max:100'],
            'block_number' => ['nullable', 'string', 'max:100'],
            'boundary_north' => ['nullable', 'string', 'max:255'],
            'boundary_south' => ['nullable', 'string', 'max:255'],
            'boundary_east' => ['nullable', 'string', 'max:255'],
            'boundary_west' => ['nullable', 'string', 'max:255'],
            'tax_declaration_number' => ['nullable', 'string', 'max:100'],
            'registration_date' => ['nullable', 'date'],
            'number_of_floors' => ['nullable', 'integer', 'min:1'],
            'building_material' => ['nullable', 'string', 'max:255'],
            'year_constructed' => ['nullable', 'integer', 'min:1800', 'max:2100'],
            'assessed_value' => ['nullable', 'numeric', 'min:0'],
            'market_value' => ['nullable', 'numeric', 'min:0'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $barangayId = $request->user()->barangay_id;

        // Generate lot_building_number: LB-{PSGC}-{YEAR}-{XXXX}
        $barangay = Barangay::findOrFail($barangayId);
        $psgcCode = $barangay->psgc_code;
        $phYear = now()->year;
        $prefix = "LB-{$psgcCode}-{$phYear}-";

        $lastSeq = LotBuilding::withTrashed()
            ->where('barangay_id', $barangayId)
            ->where('lot_building_number', 'like', "{$prefix}%")
            ->orderByRaw("CAST(SPLIT_PART(lot_building_number, '-', 4) AS INTEGER) DESC")
            ->value('lot_building_number');

        $nextSeq = $lastSeq
            ? (int) explode('-', $lastSeq)[3] + 1
            : 1;

        $lotBuildingNumber = $prefix . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

        // Duplicate safeguard: Tax Declaration # must be unique per barangay
        if (! empty($validated['tax_declaration_number'])) {
            $tdnExists = LotBuilding::where('barangay_id', $barangayId)
                ->where('tax_declaration_number', strtoupper(trim($validated['tax_declaration_number'])))
                ->exists();

            if ($tdnExists) {
                return response()->json([
                    'message' => 'A property with Tax Declaration # ' . strtoupper(trim($validated['tax_declaration_number'])) . ' is already registered in this barangay.',
                    'duplicate' => true,
                    'field' => 'tax_declaration_number',
                ], 422);
            }

            $validated['tax_declaration_number'] = strtoupper(trim($validated['tax_declaration_number']));
        }

        $record = LotBuilding::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'lot_building_number' => $lotBuildingNumber,
            'status' => 'active',
            'created_by' => $request->user()->id,
        ]);

        $this->logAudit($request, 'created', $record);

        return response()->json([
            'message' => 'Lot/building record created.',
            'lot_building' => $record,
        ], 201);
    }

    // ── Update ─────────────────────────────────────────────────────────

    public function update(Request $request, string $id): JsonResponse
    {
        $record = LotBuilding::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'classification' => ['sometimes', 'in:lot_only,building_only,lot_and_building'],
            'property_classification' => ['nullable', 'string', 'max:100'],
            'owner_name' => ['sometimes', 'string', 'max:200'],
            'owner_contact' => ['nullable', 'string', 'max:20'],
            'owner_email' => ['nullable', 'email', 'max:255'],
            'owner_address' => ['nullable', 'string', 'max:500'],
            'size' => ['nullable', 'string', 'max:100'],
            'mri' => ['nullable', 'string', 'max:100'],
            'purok' => ['nullable', 'string', 'max:100'],
            'street' => ['nullable', 'string', 'max:255'],
            'exact_address' => ['nullable', 'string', 'max:500'],
            'lot_number' => ['nullable', 'string', 'max:100'],
            'block_number' => ['nullable', 'string', 'max:100'],
            'boundary_north' => ['nullable', 'string', 'max:255'],
            'boundary_south' => ['nullable', 'string', 'max:255'],
            'boundary_east' => ['nullable', 'string', 'max:255'],
            'boundary_west' => ['nullable', 'string', 'max:255'],
            'tax_declaration_number' => ['nullable', 'string', 'max:100'],
            'registration_date' => ['nullable', 'date'],
            'number_of_floors' => ['nullable', 'integer', 'min:1'],
            'building_material' => ['nullable', 'string', 'max:255'],
            'year_constructed' => ['nullable', 'integer', 'min:1800', 'max:2100'],
            'assessed_value' => ['nullable', 'numeric', 'min:0'],
            'market_value' => ['nullable', 'numeric', 'min:0'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'status' => ['sometimes', 'in:active,inactive,demolished'],
        ]);

        // Duplicate safeguard: Tax Declaration # must be unique per barangay
        if (! empty($validated['tax_declaration_number'])) {
            $tdnExists = LotBuilding::where('barangay_id', $record->barangay_id)
                ->where('tax_declaration_number', strtoupper(trim($validated['tax_declaration_number'])))
                ->where('id', '!=', $record->id)
                ->exists();

            if ($tdnExists) {
                return response()->json([
                    'message' => 'A property with Tax Declaration # ' . strtoupper(trim($validated['tax_declaration_number'])) . ' is already registered in this barangay.',
                    'duplicate' => true,
                    'field' => 'tax_declaration_number',
                ], 422);
            }

            $validated['tax_declaration_number'] = strtoupper(trim($validated['tax_declaration_number']));
        }

        // Capture before values for audit
        $before = $record->only(array_keys($validated));

        $validated['updated_by'] = $request->user()->id;
        $record->update($validated);

        // Build changes diff
        $after = $record->fresh()->only(array_keys($before));
        $changes = [];
        foreach ($before as $key => $oldVal) {
            $newVal = $after[$key] ?? null;
            if ((string) ($oldVal ?? '') !== (string) ($newVal ?? '')) {
                $changes[$key] = ['from' => $oldVal, 'to' => $newVal];
            }
        }

        if (! empty($changes)) {
            $this->logAudit($request, 'updated', $record, $changes);
        }

        return response()->json([
            'message' => 'Record updated.',
            'lot_building' => $record->fresh(),
        ]);
    }

    // ── Destroy ────────────────────────────────────────────────────────

    public function destroy(Request $request, string $id): JsonResponse
    {
        $record = LotBuilding::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $this->logAudit($request, 'deleted', $record);

        $record->update(['deleted_by' => $request->user()->id]);
        $record->delete();

        return response()->json(['message' => 'Record deleted.']);
    }

    // ── Activity ───────────────────────────────────────────────────────

    public function activity(Request $request, string $id): JsonResponse
    {
        $record = LotBuilding::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $logs = AuditLog::where('resource_type', 'lot_building')
            ->where('resource_id', $record->id)
            ->with('user:id,username,first_name,last_name')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($logs);
    }

    // ── Clearance ──────────────────────────────────────────────────────

    public function clearance(Request $request, string $id): JsonResponse
    {
        $record = LotBuilding::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'transaction_type' => [
                'required',
                'in:lot_clearance,building_clearance,fencing_clearance,excavation_clearance,demolition_clearance,renovation_clearance',
            ],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $phYear = now()->timezone('Asia/Manila')->year;

        LotBuildingTransaction::create([
            'barangay_id'     => $record->barangay_id,
            'lot_building_id' => $record->id,
            'transaction_type' => $validated['transaction_type'],
            'year'             => $phYear,
            'notes'            => $validated['notes'] ?? null,
            'created_by'       => $request->user()->id,
            'created_at'       => now(),
        ]);

        $this->logAudit($request, 'clearance_issued', $record, [
            'transaction_type' => $validated['transaction_type'],
            'year'             => $phYear,
        ]);

        return response()->json([
            'message'      => 'Clearance issued.',
            'lot_building' => $record->fresh(),
        ]);
    }

    // ── Transactions ───────────────────────────────────────────────────

    public function transactions(Request $request, string $id): JsonResponse
    {
        $record = LotBuilding::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $transactions = LotBuildingTransaction::where('lot_building_id', $record->id)
            ->with('creator:id,first_name,middle_name,last_name,extension_name')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'transaction_type', 'year', 'notes', 'created_at', 'created_by'])
            ->map(fn ($tx) => [
                'id'               => $tx->id,
                'transaction_type' => $tx->transaction_type,
                'year'             => $tx->year,
                'notes'            => $tx->notes,
                'created_at'       => $tx->created_at,
                'generated_by'     => $tx->creator?->full_name ?? 'System',
            ]);

        return response()->json(['transactions' => $transactions]);
    }

    // ── Check Duplicate ────────────────────────────────────────────────

    public function checkDuplicate(Request $request): JsonResponse
    {
        $request->validate([
            'tax_declaration_number' => ['nullable', 'string', 'max:100'],
            'owner_name'             => ['nullable', 'string', 'max:200'],
            'exact_address'          => ['nullable', 'string', 'max:500'],
            'exclude_id'             => ['nullable', 'uuid'],
        ]);

        $barangayId = $request->user()->barangay_id;
        $excludeId  = $request->input('exclude_id');
        $tdn        = strtoupper(trim($request->input('tax_declaration_number', '')));
        $ownerName  = trim($request->input('owner_name', ''));
        $address    = trim($request->input('exact_address', ''));

        // Check 1: Tax Declaration Number (strongest — government-issued)
        if ($tdn !== '') {
            $query = LotBuilding::where('barangay_id', $barangayId)
                ->whereRaw('UPPER(TRIM(tax_declaration_number)) = ?', [$tdn]);

            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }

            $match = $query->first();

            if ($match) {
                return response()->json([
                    'duplicate'    => true,
                    'reason'       => 'tax_declaration_number',
                    'message'      => "Tax Declaration # {$tdn} is already registered as {$match->lot_building_number}.",
                    'lot_building' => $match->only(['id', 'lot_building_number', 'owner_name', 'classification']),
                ]);
            }
        }

        // Check 2: Same owner name + same address (catches records without a TD#)
        if ($ownerName !== '' && $address !== '') {
            $query = LotBuilding::where('barangay_id', $barangayId)
                ->whereRaw('LOWER(TRIM(owner_name)) = LOWER(?)', [$ownerName])
                ->whereRaw('LOWER(TRIM(exact_address)) = LOWER(?)', [$address]);

            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }

            $match = $query->first();

            if ($match) {
                return response()->json([
                    'duplicate'    => true,
                    'reason'       => 'owner_address',
                    'message'      => "A property at this address registered under the same owner already exists ({$match->lot_building_number}).",
                    'lot_building' => $match->only(['id', 'lot_building_number', 'owner_name', 'classification']),
                ]);
            }
        }

        return response()->json(['duplicate' => false]);
    }

    // ── SMS ────────────────────────────────────────────────────────────

    public function sendSms(Request $request, string $id): JsonResponse
    {
        $record = LotBuilding::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        if (empty($record->owner_contact)) {
            return response()->json([
                'message' => 'This lot/building record has no registered contact number.',
            ], 422);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:636'],
        ]);

        $userMessage = trim($validated['message']);
        $barangay    = $request->user()->barangay;

        $message  = SmsService::formatWithSenderHeader($userMessage, $barangay);
        $cost     = SmsService::calculateCost($message);
        $segments = SmsService::calculateSegments($message);

        if (! $barangay->hasSmsCredits($cost)) {
            return response()->json([
                'message' => 'Insufficient SMS credits. Balance: ₱'.number_format((float) $barangay->sms_credit_balance, 2).', required: ₱'.number_format($cost, 2).'.',
            ], 422);
        }

        $sent = $this->smsService->send(
            phone: $record->owner_contact,
            message: $message,
            barangay: $barangay,
            source: 'lot_building_sms',
            sourceId: $record->id,
        );

        if (! $sent) {
            return response()->json([
                'message' => 'SMS failed to send. Check TxtBox configuration or credits and try again.',
            ], 500);
        }

        $barangay->refresh();

        return response()->json([
            'message'           => 'SMS sent successfully.',
            'segments'          => $segments,
            'cost'              => $cost,
            'remaining_balance' => (float) $barangay->sms_credit_balance,
        ]);
    }

    public function smsHistory(Request $request, string $id): JsonResponse
    {
        $record = LotBuilding::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $perPage = min((int) $request->get('per_page', 20), 50);

        $logs = \App\Models\Platform\SmsTransaction::where('barangay_id', $request->user()->barangay_id)
            ->where('source', 'lot_building_sms')
            ->where('source_id', $record->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($logs);
    }

    // ── Audit helper ───────────────────────────────────────────────────

    private function logAudit(Request $request, string $action, LotBuilding $record, ?array $changes = null): void
    {
        AuditLog::create([
            'barangay_id' => $record->barangay_id,
            'user_id' => $request->user()->id,
            'action' => $action,
            'resource_type' => 'lot_building',
            'resource_id' => $record->id,
            'changes' => $changes,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'module' => 'lots_buildings',
        ]);
    }
}
