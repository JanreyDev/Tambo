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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Log;

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
            'total' => $total,
            'lots' => $lots,
            'buildings' => $buildings,
            'lot_and_building' => $lotAndBuilding,
            'active' => $active,
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
        $sequenceOrderSql = DB::connection()->getDriverName() === 'sqlite'
            ? 'CAST(SUBSTR(lot_building_number, '.(strlen($prefix) + 1).') AS INTEGER) DESC'
            : "CAST(SPLIT_PART(lot_building_number, '-', 4) AS INTEGER) DESC";

        $lastSeq = LotBuilding::withTrashed()
            ->where('barangay_id', $barangayId)
            ->where('lot_building_number', 'like', "{$prefix}%")
            ->orderByRaw($sequenceOrderSql)
            ->value('lot_building_number');

        $nextSeq = $lastSeq
            ? (int) explode('-', $lastSeq)[3] + 1
            : 1;

        $lotBuildingNumber = $prefix.str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

        // Duplicate safeguard: Tax Declaration # must be unique per barangay
        if (! empty($validated['tax_declaration_number'])) {
            $tdnExists = LotBuilding::where('barangay_id', $barangayId)
                ->where('tax_declaration_number', strtoupper(trim($validated['tax_declaration_number'])))
                ->exists();

            if ($tdnExists) {
                return response()->json([
                    'message' => 'A property with Tax Declaration # '.strtoupper(trim($validated['tax_declaration_number'])).' is already registered in this barangay.',
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
                    'message' => 'A property with Tax Declaration # '.strtoupper(trim($validated['tax_declaration_number'])).' is already registered in this barangay.',
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
            'barangay_id' => $record->barangay_id,
            'lot_building_id' => $record->id,
            'transaction_type' => $validated['transaction_type'],
            'year' => $phYear,
            'notes' => $validated['notes'] ?? null,
            'created_by' => $request->user()->id,
            'created_at' => now(),
        ]);

        $this->logAudit($request, 'clearance_issued', $record, [
            'transaction_type' => $validated['transaction_type'],
            'year' => $phYear,
        ]);

        return response()->json([
            'message' => 'Clearance issued.',
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
                'id' => $tx->id,
                'transaction_type' => $tx->transaction_type,
                'year' => $tx->year,
                'notes' => $tx->notes,
                'created_at' => $tx->created_at,
                'generated_by' => $tx->creator?->full_name ?? 'System',
            ]);

        return response()->json(['transactions' => $transactions]);
    }

    // ── Check Duplicate ────────────────────────────────────────────────

    public function checkDuplicate(Request $request): JsonResponse
    {
        $request->validate([
            'tax_declaration_number' => ['nullable', 'string', 'max:100'],
            'owner_name' => ['nullable', 'string', 'max:200'],
            'exact_address' => ['nullable', 'string', 'max:500'],
            'exclude_id' => ['nullable', 'uuid'],
        ]);

        $barangayId = $request->user()->barangay_id;
        $excludeId = $request->input('exclude_id');
        $tdn = strtoupper(trim($request->input('tax_declaration_number', '')));
        $ownerName = trim($request->input('owner_name', ''));
        $address = trim($request->input('exact_address', ''));

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
                    'duplicate' => true,
                    'reason' => 'tax_declaration_number',
                    'message' => "Tax Declaration # {$tdn} is already registered as {$match->lot_building_number}.",
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
                    'duplicate' => true,
                    'reason' => 'owner_address',
                    'message' => "A property at this address registered under the same owner already exists ({$match->lot_building_number}).",
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
            'message' => 'SMS sent successfully.',
            'segments' => $segments,
            'cost' => $cost,
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

    public function export(Request $request): StreamedResponse
    {
        $barangayId = $request->user()->barangay_id;
        $barangay = Barangay::findOrFail($barangayId);

        $query = LotBuilding::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('owner_name', 'ilike', "%{$search}%")
                    ->orWhere('lot_building_number', 'ilike', "%{$search}%")
                    ->orWhere('exact_address', 'ilike', "%{$search}%");
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

        $query->orderBy('lot_building_number');

        $headers = [
            'Lot/Building Number',
            'Classification',
            'Property Classification',
            'Owner Name',
            'Owner Contact',
            'Owner Email',
            'Owner Address',
            'Size',
            'MRI',
            'Purok',
            'Street',
            'Exact Address',
            'Lot Number',
            'Block Number',
            'Boundary North',
            'Boundary South',
            'Boundary East',
            'Boundary West',
            'Tax Declaration Number',
            'Registration Date',
            'Number of Floors',
            'Building Material',
            'Year Constructed',
            'Assessed Value',
            'Market Value',
            'Status',
            'Latitude',
            'Longitude',
        ];

        $filename = Str::slug($barangay->name).'-lots-buildings-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($query, $headers) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $headers);

            $query->chunk(500, function ($records) use ($handle) {
                foreach ($records as $r) {
                    fputcsv($handle, [
                        $r->lot_building_number,
                        $r->classification,
                        $r->property_classification,
                        $r->owner_name,
                        $r->owner_contact,
                        $r->owner_email,
                        $r->owner_address,
                        $r->size,
                        $r->mri,
                        $r->purok,
                        $r->street,
                        $r->exact_address,
                        $r->lot_number,
                        $r->block_number,
                        $r->boundary_north,
                        $r->boundary_south,
                        $r->boundary_east,
                        $r->boundary_west,
                        $r->tax_declaration_number,
                        $r->registration_date ? $r->registration_date->format('Y-m-d') : '',
                        $r->number_of_floors,
                        $r->building_material,
                        $r->year_constructed,
                        $r->assessed_value,
                        $r->market_value,
                        $r->status,
                        $r->latitude,
                        $r->longitude,
                    ]);
                }
            });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    public function importPreview(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        if (!$handle) {
            return response()->json(['message' => 'Failed to read file.'], 422);
        }

        $rawHeaders = fgetcsv($handle);
        if (!$rawHeaders || count($rawHeaders) < 2) {
            fclose($handle);
            return response()->json(['message' => 'Invalid CSV. Must have at least 2 columns.'], 422);
        }

        $rawHeaders[0] = preg_replace('/^\x{FEFF}/u', '', $rawHeaders[0]);

        $sampleRows = [];
        $totalRows = 0;
        while (($row = fgetcsv($handle)) !== false) {
            if (!array_filter($row)) continue;
            $totalRows++;
            if (count($sampleRows) < 5) {
                $sampleRows[] = $row;
            }
        }
        fclose($handle);

        $autoMap = $this->autoDetectMapping($rawHeaders);

        return response()->json([
            'headers' => $rawHeaders,
            'sample_rows' => $sampleRows,
            'total_rows' => $totalRows,
            'auto_mapping' => $autoMap,
            'required_fields' => ['classification', 'owner_name'],
            'optional_fields' => ['property_classification', 'owner_contact', 'exact_address', 'purok', 'street', 'tax_declaration_number'],
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
            'mapping' => ['required', 'array'],
            'mapping.classification' => ['required', 'integer', 'min:0'],
            'mapping.owner_name' => ['required', 'integer', 'min:0'],
            'mapping.property_classification' => ['nullable', 'integer', 'min:0'],
            'mapping.owner_contact' => ['nullable', 'integer', 'min:0'],
            'mapping.owner_email' => ['nullable', 'integer', 'min:0'],
            'mapping.owner_address' => ['nullable', 'integer', 'min:0'],
            'mapping.size' => ['nullable', 'integer', 'min:0'],
            'mapping.mri' => ['nullable', 'integer', 'min:0'],
            'mapping.purok' => ['nullable', 'integer', 'min:0'],
            'mapping.street' => ['nullable', 'integer', 'min:0'],
            'mapping.exact_address' => ['nullable', 'integer', 'min:0'],
            'mapping.lot_number' => ['nullable', 'integer', 'min:0'],
            'mapping.block_number' => ['nullable', 'integer', 'min:0'],
            'mapping.boundary_north' => ['nullable', 'integer', 'min:0'],
            'mapping.boundary_south' => ['nullable', 'integer', 'min:0'],
            'mapping.boundary_east' => ['nullable', 'integer', 'min:0'],
            'mapping.boundary_west' => ['nullable', 'integer', 'min:0'],
            'mapping.tax_declaration_number' => ['nullable', 'integer', 'min:0'],
            'mapping.registration_date' => ['nullable', 'integer', 'min:0'],
            'mapping.number_of_floors' => ['nullable', 'integer', 'min:0'],
            'mapping.building_material' => ['nullable', 'integer', 'min:0'],
            'mapping.year_constructed' => ['nullable', 'integer', 'min:0'],
            'mapping.assessed_value' => ['nullable', 'integer', 'min:0'],
            'mapping.market_value' => ['nullable', 'integer', 'min:0'],
            'mapping.status' => ['nullable', 'integer', 'min:0'],
            'mapping.latitude' => ['nullable', 'integer', 'min:0'],
            'mapping.longitude' => ['nullable', 'integer', 'min:0'],
        ]);

        $barangayId = $request->user()->barangay_id;
        $barangay = Barangay::findOrFail($barangayId);
        $psgcCode = $barangay->psgc_code;

        if (!$psgcCode) {
            return response()->json(['message' => 'Barangay PSGC code is not configured.'], 422);
        }

        $mapping = $request->input('mapping');
        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        if (!$handle) {
            return response()->json(['message' => 'Failed to read file.'], 422);
        }

        $rawHeaders = fgetcsv($handle);
        if ($rawHeaders) {
            $rawHeaders[0] = preg_replace('/^\x{FEFF}/u', '', $rawHeaders[0]);
        }

        $imported = 0;
        $skipped = 0;
        $errors = [];
        $rowNum = 1;

        $prefix = "LND-{$psgcCode}-";
        $sequenceOrderSql = DB::connection()->getDriverName() === 'sqlite'
            ? 'CAST(SUBSTR(lot_building_number, '.(strlen($prefix) + 1).') AS INTEGER) DESC'
            : "CAST(SPLIT_PART(lot_building_number, '-', 3) AS INTEGER) DESC";
        $lastSeq = LotBuilding::where('barangay_id', $barangayId)
            ->where('lot_building_number', 'like', "{$prefix}%")
            ->orderByRaw($sequenceOrderSql)
            ->value('lot_building_number');

        $nextSeq = $lastSeq
            ? (int) explode('-', $lastSeq)[3] + 1
            : 1;

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;
                if (!array_filter($row)) continue;

                $classification = isset($mapping['classification']) ? trim($row[$mapping['classification']] ?? '') : '';
                $ownerName = isset($mapping['owner_name']) ? trim($row[$mapping['owner_name']] ?? '') : '';
                $propertyClassification = isset($mapping['property_classification']) ? trim($row[$mapping['property_classification']] ?? '') : '';
                $ownerContact = isset($mapping['owner_contact']) ? trim($row[$mapping['owner_contact']] ?? '') : '';
                $ownerEmail = isset($mapping['owner_email']) ? trim($row[$mapping['owner_email']] ?? '') : '';
                $ownerAddress = isset($mapping['owner_address']) ? trim($row[$mapping['owner_address']] ?? '') : '';
                $size = isset($mapping['size']) ? trim($row[$mapping['size']] ?? '') : '';
                $mri = isset($mapping['mri']) ? trim($row[$mapping['mri']] ?? '') : '';
                $purok = isset($mapping['purok']) ? trim($row[$mapping['purok']] ?? '') : '';
                $street = isset($mapping['street']) ? trim($row[$mapping['street']] ?? '') : '';
                $exactAddress = isset($mapping['exact_address']) ? trim($row[$mapping['exact_address']] ?? '') : '';
                $lotNumber = isset($mapping['lot_number']) ? trim($row[$mapping['lot_number']] ?? '') : '';
                $blockNumber = isset($mapping['block_number']) ? trim($row[$mapping['block_number']] ?? '') : '';
                $boundaryNorth = isset($mapping['boundary_north']) ? trim($row[$mapping['boundary_north']] ?? '') : '';
                $boundarySouth = isset($mapping['boundary_south']) ? trim($row[$mapping['boundary_south']] ?? '') : '';
                $boundaryEast = isset($mapping['boundary_east']) ? trim($row[$mapping['boundary_east']] ?? '') : '';
                $boundaryWest = isset($mapping['boundary_west']) ? trim($row[$mapping['boundary_west']] ?? '') : '';
                $taxDeclNumber = isset($mapping['tax_declaration_number']) ? trim($row[$mapping['tax_declaration_number']] ?? '') : '';
                $regDateRaw = isset($mapping['registration_date']) ? trim($row[$mapping['registration_date']] ?? '') : '';
                $numFloors = isset($mapping['number_of_floors']) ? trim($row[$mapping['number_of_floors']] ?? '') : null;
                $buildMaterial = isset($mapping['building_material']) ? trim($row[$mapping['building_material']] ?? '') : '';
                $yearConstructed = isset($mapping['year_constructed']) ? trim($row[$mapping['year_constructed']] ?? '') : null;
                $assessedValue = isset($mapping['assessed_value']) ? trim($row[$mapping['assessed_value']] ?? '') : null;
                $marketValue = isset($mapping['market_value']) ? trim($row[$mapping['market_value']] ?? '') : null;
                $status = isset($mapping['status']) ? trim($row[$mapping['status']] ?? '') : '';
                $latitude = isset($mapping['latitude']) ? trim($row[$mapping['latitude']] ?? '') : null;
                $longitude = isset($mapping['longitude']) ? trim($row[$mapping['longitude']] ?? '') : null;

                if (!$classification || !$ownerName) {
                    $skipped++;
                    $errors[] = "Row {$rowNum}: Missing classification or owner name.";
                    continue;
                }

                // Map classification values
                $classificationNormalized = strtolower(str_replace(' ', '_', trim($classification)));
                if (!in_array($classificationNormalized, ['lot_only', 'building_only', 'lot_and_building'], true)) {
                    $skipped++;
                    $errors[] = "Row {$rowNum}: Invalid classification '{$classification}'. Must be lot_only, building_only, or lot_and_building.";
                    continue;
                }

                // Safeguard Tax Declaration (unique per barangay)
                if ($taxDeclNumber) {
                    $tdnExists = LotBuilding::where('barangay_id', $barangayId)
                        ->where('tax_declaration_number', strtoupper(trim($taxDeclNumber)))
                        ->exists();
                    if ($tdnExists) {
                        $skipped++;
                        $errors[] = "Row {$rowNum}: Tax Declaration # {$taxDeclNumber} already exists.";
                        continue;
                    }
                }

                $regDate = null;
                if ($regDateRaw) {
                    try {
                        $regDate = \Carbon\Carbon::parse($regDateRaw)->format('Y-m-d');
                    } catch (\Throwable) {}
                }

                $lotBuildNum = $prefix.str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);
                $nextSeq++;

                LotBuilding::create([
                    'barangay_id' => $barangayId,
                    'lot_building_number' => $lotBuildNum,
                    'classification' => $classificationNormalized,
                    'property_classification' => $propertyClassification ? strtolower(trim($propertyClassification)) : null,
                    'owner_name' => mb_strtoupper($ownerName),
                    'owner_contact' => $ownerContact,
                    'owner_email' => $ownerEmail,
                    'owner_address' => $ownerAddress ? mb_strtoupper($ownerAddress) : null,
                    'size' => $size,
                    'mri' => $mri,
                    'purok' => $purok ? mb_strtoupper($purok) : null,
                    'street' => $street ? mb_strtoupper($street) : null,
                    'exact_address' => $exactAddress ? mb_strtoupper($exactAddress) : null,
                    'lot_number' => $lotNumber,
                    'block_number' => $blockNumber,
                    'boundary_north' => $boundaryNorth ? mb_strtoupper($boundaryNorth) : null,
                    'boundary_south' => $boundarySouth ? mb_strtoupper($boundarySouth) : null,
                    'boundary_east' => $boundaryEast ? mb_strtoupper($boundaryEast) : null,
                    'boundary_west' => $boundaryWest ? mb_strtoupper($boundaryWest) : null,
                    'tax_declaration_number' => $taxDeclNumber ? strtoupper(trim($taxDeclNumber)) : null,
                    'registration_date' => $regDate,
                    'number_of_floors' => $numFloors ? (int) $numFloors : null,
                    'building_material' => $buildMaterial,
                    'year_constructed' => $yearConstructed ? (int) $yearConstructed : null,
                    'assessed_value' => $assessedValue,
                    'market_value' => $marketValue,
                    'status' => $status ? strtolower($status) : 'active',
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'created_by' => $request->user()->id,
                ]);

                $imported++;
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Lot/Building CSV import failed', ['exception' => $e]);
            return response()->json(['message' => 'Import failed: ' . $e->getMessage()], 500);
        }

        fclose($handle);

        return response()->json([
            'message' => 'Import completed.',
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
    }

    private function autoDetectMapping(array $headers): array
    {
        $mapping = [];
        $fields = [
            'classification' => ['classification', 'type', 'lot_only', 'building_only'],
            'property_classification' => ['property classification', 'property_classification', 'property type', 'use'],
            'owner_name' => ['owner name', 'owner_name', 'owner', 'proprietor', 'registered owner'],
            'owner_contact' => ['owner contact', 'contact', 'phone', 'telephone', 'mobile'],
            'owner_email' => ['owner email', 'email', 'email address'],
            'owner_address' => ['owner address', 'owner_address'],
            'size' => ['size', 'area', 'lot area'],
            'mri' => ['mri'],
            'purok' => ['purok', 'zone'],
            'street' => ['street'],
            'exact_address' => ['exact address', 'address', 'location'],
            'lot_number' => ['lot number', 'lot_number', 'lot #', 'lot'],
            'block_number' => ['block number', 'block_number', 'block #', 'block'],
            'boundary_north' => ['boundary north', 'boundary_north', 'north boundary', 'north'],
            'boundary_south' => ['boundary south', 'boundary_south', 'south boundary', 'south'],
            'boundary_east' => ['boundary east', 'boundary_east', 'east boundary', 'east'],
            'boundary_west' => ['boundary west', 'boundary_west', 'west boundary', 'west'],
            'tax_declaration_number' => ['tax declaration number', 'tax_declaration_number', 'tax decl #', 'tax declaration', 'tdn'],
            'registration_date' => ['registration date', 'registration_date'],
            'number_of_floors' => ['number of floors', 'number_of_floors', 'floors'],
            'building_material' => ['building material', 'building_material', 'material'],
            'year_constructed' => ['year constructed', 'year_constructed', 'year'],
            'assessed_value' => ['assessed value', 'assessed_value', 'assessed'],
            'market_value' => ['market value', 'market_value', 'market'],
            'status' => ['status'],
            'latitude' => ['latitude', 'lat'],
            'longitude' => ['longitude', 'lng', 'lon'],
        ];

        foreach ($headers as $idx => $header) {
            $normalized = strtolower(trim($header));
            foreach ($fields as $field => $keywords) {
                if (in_array($normalized, $keywords, true)) {
                    $mapping[$field] = $idx;
                    break;
                }
            }
        }

        return $mapping;
    }
}
