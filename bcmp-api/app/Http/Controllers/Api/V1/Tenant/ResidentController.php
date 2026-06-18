<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Admin\Barangay;
use App\Models\Platform\AuditLog;
use App\Models\Tenant\Documents\IssuedDocument;
use App\Models\Tenant\Judicial\BlotterRecord;
use App\Models\Tenant\Judicial\KpCaseParty;
use App\Models\Tenant\Records\Household;
use App\Models\Tenant\Records\ImportBatch;
use App\Models\Tenant\Records\ResidentCrossBarangayFlag;
use App\Models\Tenant\Records\ResidentSectoralTag;
use App\Models\Tenant\Resident;
use App\Models\Tenant\Voter;
use App\Services\FileUploadService;
use App\Services\ResidentPdfService;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ResidentController extends Controller
{
    public function __construct(
        private readonly SmsService $smsService,
        private readonly FileUploadService $fileUploadService,
    ) {}

    /**
     * List residents with search/filter/pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $archivedOnly = $request->boolean('archived_only');

        $query = ($archivedOnly ? Resident::onlyTrashed() : Resident::query())
            ->where('barangay_id', $barangayId)
            ->with(['sectoralTags', 'crossBarangayFlags', 'photoFile']);

        // Search
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'ilike', "%{$search}%")
                    ->orWhere('last_name', 'ilike', "%{$search}%")
                    ->orWhere('middle_name', 'ilike', "%{$search}%")
                    ->orWhere('resident_number', 'ilike', "%{$search}%")
                    ->orWhere('mobile_number', 'ilike', "%{$search}%");
            });
        }

        // Filters
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($purok = $request->get('purok')) {
            $query->where('purok', $purok);
        }

        if ($sex = $request->get('sex')) {
            $query->where('sex', $sex);
        }

        if ($request->has('is_voter')) {
            $query->where('is_voter', $request->boolean('is_voter'));
        }

        if ($civilStatus = $request->get('civil_status')) {
            $query->where('civil_status', $civilStatus);
        }

        if ($residentType = $request->get('resident_type')) {
            $query->where('resident_type', $residentType);
        }

        if ($request->has('is_head_of_household')) {
            $query->where('is_head_of_household', $request->boolean('is_head_of_household'));
        }

        if ($citizenship = $request->get('citizenship')) {
            $query->where('citizenship', 'ilike', "%{$citizenship}%");
        }

        if ($religion = $request->get('religion')) {
            $query->where('religion', 'ilike', "%{$religion}%");
        }

        if ($ethnicity = $request->get('ethnicity')) {
            $query->where('ethnicity', 'ilike', "%{$ethnicity}%");
        }

        if ($sector = $request->get('sector')) {
            $query->whereHas('sectoralTags', function ($q) use ($sector) {
                $q->where('sector', $sector);
            });
        }

        // Sort
        $sortBy = $request->get('sort_by', 'last_name');
        $sortDir = $request->get('sort_dir', 'asc');
        $allowedSorts = ['last_name', 'first_name', 'created_at', 'date_of_birth', 'resident_number'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);
        $residents = $query->paginate($perPage);

        // Pre-load barangay names for cross-barangay flags
        $crossBarangayIds = $residents->getCollection()
            ->flatMap(fn ($r) => $r->crossBarangayFlags->pluck('other_barangay_id'))
            ->unique()
            ->values();
        $barangayNames = $crossBarangayIds->isNotEmpty()
            ? Barangay::whereIn('id', $crossBarangayIds)->pluck('name', 'id')
            : collect();

        // Batch-load case records (KP cases + blotter) for all residents on this page
        $residentIds = $residents->getCollection()->pluck('id')->all();
        $kpPartiesByResident = collect();
        $blottersByResident = collect();

        if (! empty($residentIds)) {
            $kpPartiesByResident = KpCaseParty::whereIn('kp_case_parties.resident_id', $residentIds)
                ->join('kp_cases', 'kp_cases.id', '=', 'kp_case_parties.case_id')
                ->whereNull('kp_cases.deleted_at')
                ->select([
                    'kp_case_parties.resident_id',
                    'kp_case_parties.party_type',
                    'kp_cases.case_number',
                    'kp_cases.nature_of_complaint',
                    'kp_cases.status',
                    'kp_cases.filing_date',
                ])
                ->get()
                ->groupBy('resident_id');

            $complainants = BlotterRecord::whereIn('complainant_resident_id', $residentIds)
                ->whereNull('deleted_at')
                ->selectRaw("complainant_resident_id as resident_id, blotter_number, incident_type, status, filing_date, 'complainant' as role")
                ->get();

            $respondents = BlotterRecord::whereIn('respondent_resident_id', $residentIds)
                ->whereNull('deleted_at')
                ->selectRaw("respondent_resident_id as resident_id, blotter_number, incident_type, status, filing_date, 'respondent' as role")
                ->get();

            $blottersByResident = $complainants->concat($respondents)->groupBy('resident_id');
        }

        $residents->getCollection()->transform(function ($resident) use ($barangayNames, $kpPartiesByResident, $blottersByResident) {
            $resident->photo_url = $resident->photoFile?->is_public
                ? $this->fileUploadService->getPublicUrl($resident->photoFile)
                : null;

            // Format cross-barangay flags with barangay name
            $resident->cross_barangay_flags = $resident->crossBarangayFlags
                ->map(fn ($flag) => [
                    'id' => $flag->id,
                    'barangay_name' => $barangayNames->get($flag->other_barangay_id, 'Unknown Barangay'),
                    'detected_at' => $flag->detected_at?->toDateString(),
                    'acknowledged_at' => $flag->acknowledged_at?->toDateString(),
                ])
                ->values()
                ->all();

            // Build case_records with real data for the red flag tooltip
            $caseRecords = collect();

            foreach ($kpPartiesByResident->get($resident->id, collect()) as $party) {
                $caseRecords->push([
                    'source' => 'kp_case',
                    'case_number' => $party->case_number,
                    'description' => Str::limit($party->nature_of_complaint ?? '', 50),
                    'status' => $party->status,
                    'party_type' => $party->party_type,
                    'filing_date' => is_string($party->filing_date) ? $party->filing_date : $party->filing_date?->toDateString(),
                ]);
            }

            foreach ($blottersByResident->get($resident->id, collect()) as $blotter) {
                $caseRecords->push([
                    'source' => 'blotter',
                    'case_number' => $blotter->blotter_number,
                    'description' => Str::limit($blotter->incident_type ?? '', 50),
                    'status' => $blotter->status,
                    'party_type' => $blotter->role,
                    'filing_date' => is_string($blotter->filing_date) ? $blotter->filing_date : $blotter->filing_date?->toDateString(),
                ]);
            }

            $resident->case_records = $caseRecords->values()->all();

            return $resident;
        });

        return response()->json($residents);
    }

    /**
     * Get a single resident with full details.
     * Gov ID fields are decrypted server-side and returned as plain names.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $resident = Resident::withTrashed()
            ->where('barangay_id', $request->user()->barangay_id)
            ->with(['household', 'sectoralTags', 'crossBarangayFlags', 'photoFile'])
            ->findOrFail($id);

        $resident->photo_url = $resident->photoFile?->is_public
            ? $this->fileUploadService->getPublicUrl($resident->photoFile)
            : null;

        // Decrypt government IDs for display (stored encrypted, returned plain)
        $govIdMap = [
            'philhealth_number' => 'philhealth_number_encrypted',
            'sss_gsis_number' => 'sss_gsis_number_encrypted',
            'pagibig_number' => 'pagibig_number_encrypted',
            'tin_number' => 'tin_number_encrypted',
            'pwd_id' => 'pwd_id_encrypted',
            'senior_citizen_id' => 'senior_citizen_id_encrypted',
        ];

        $data = $resident->toArray();
        foreach ($govIdMap as $plainField => $encryptedField) {
            $data[$plainField] = null;
            if (! empty($data[$encryptedField])) {
                try {
                    $data[$plainField] = decrypt($data[$encryptedField]);
                } catch (\Throwable) {
                    // Value was stored unencrypted (legacy) — return as-is
                    $data[$plainField] = $data[$encryptedField];
                }
            }
            unset($data[$encryptedField]);
        }

        // Log profile view (fire-and-forget)
        AuditLog::create([
            'barangay_id' => $request->user()->barangay_id,
            'user_id' => $request->user()->id,
            'action' => 'viewed',
            'resource_type' => 'resident',
            'resource_id' => $resident->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'module' => 'residents',
        ]);

        return response()->json(['resident' => $data]);
    }

    /**
     * Create a new resident.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->storeRules());

        $barangayId = $request->user()->barangay_id;
        $barangay = Barangay::findOrFail($barangayId);
        $psgcCode = $barangay->psgc_code;

        if (! $psgcCode) {
            return response()->json([
                'message' => 'Barangay PSGC code is not configured. Contact administrator.',
            ], 422);
        }

        // Check for same-barangay duplicate (fname + lname + dob match = block)
        // If middle_name is provided on both sides, require it to also match.
        $dupQuery = Resident::where('barangay_id', $barangayId)
            ->whereRaw('LOWER(first_name) = ?', [mb_strtolower(trim($validated['first_name']))])
            ->whereRaw('LOWER(last_name) = ?', [mb_strtolower(trim($validated['last_name']))])
            ->where('date_of_birth', $validated['date_of_birth'])
            ->whereNull('deleted_at');

        $incomingMiddle = mb_strtolower(trim($validated['middle_name'] ?? ''));
        if ($incomingMiddle !== '') {
            $dupQuery->where(function ($q) use ($incomingMiddle) {
                $q->whereRaw('LOWER(COALESCE(middle_name, \'\')) = ?', [$incomingMiddle])
                    ->orWhereNull('middle_name')
                    ->orWhereRaw('middle_name = \'\'');
            });
        }

        $exactDuplicate = $dupQuery->exists();

        if ($exactDuplicate) {
            return response()->json([
                'message' => 'A resident with the same name and date of birth already exists in this barangay.',
            ], 409);
        }

        return DB::transaction(function () use ($validated, $barangayId, $psgcCode, $request) {
            // Generate resident number: RES-{PSGC}-{XXXX}
            $residentNumber = Resident::generateResidentNumber($barangayId, $psgcCode);

            // Map frontend gov ID field names to encrypted columns
            $govIdMapping = [
                'philhealth_number' => 'philhealth_number_encrypted',
                'sss_gsis_number' => 'sss_gsis_number_encrypted',
                'pagibig_number' => 'pagibig_number_encrypted',
                'tin_number' => 'tin_number_encrypted',
                'pwd_id' => 'pwd_id_encrypted',
                'senior_citizen_id' => 'senior_citizen_id_encrypted',
            ];

            $residentData = collect($validated)
                ->except([
                    'sectors', 'education_entries', 'work_entries',
                    'business_entries', 'pet_entries', 'assistance_entries',
                    'relative_entries',
                    // Gov ID plain names (mapped to encrypted columns)
                    'philhealth_number', 'sss_gsis_number', 'pagibig_number',
                    'tin_number', 'pwd_id', 'senior_citizen_id',
                ])
                ->toArray();

            // Map gov IDs to encrypted columns
            foreach ($govIdMapping as $plainField => $encryptedField) {
                if (! empty($validated[$plainField])) {
                    $residentData[$encryptedField] = encrypt($validated[$plainField]);
                }
            }

            // Build JSONB arrays from entry arrays
            if (! empty($validated['education_entries'])) {
                $residentData['education_details'] = $validated['education_entries'];
            }
            if (! empty($validated['work_entries'])) {
                $residentData['work_history'] = $validated['work_entries'];
            }
            if (! empty($validated['business_entries'])) {
                $residentData['business_details'] = $validated['business_entries'];
            }
            if (! empty($validated['pet_entries'])) {
                $residentData['pet_records'] = $validated['pet_entries'];
            }
            if (! empty($validated['assistance_entries'])) {
                $residentData['assistance_history'] = $validated['assistance_entries'];
            }
            if (! empty($validated['relative_entries'])) {
                $residentData['relative_links'] = $validated['relative_entries'];
            }

            $resident = Resident::create([
                ...$residentData,
                'barangay_id' => $barangayId,
                'resident_number' => $residentNumber,
                'registration_date' => now()->toDateString(),
                'status' => 'active',
                'created_by' => $request->user()->id,
            ]);

            // Create sectoral tags
            if (! empty($validated['sectors'])) {
                foreach ($validated['sectors'] as $sector) {
                    ResidentSectoralTag::create([
                        'resident_id' => $resident->id,
                        'barangay_id' => $barangayId,
                        'sector' => $sector,
                    ]);
                }
            }

            // Auto-create household when is_head_of_household
            if (! empty($residentData['is_head_of_household'])) {
                $lastHousehold = Household::where('barangay_id', $barangayId)
                    ->orderByRaw("CAST(SUBSTRING(household_number FROM '\d+$') AS INTEGER) DESC")
                    ->first();

                $nextHhSeq = $lastHousehold
                    ? ((int) preg_replace('/\D/', '', $lastHousehold->household_number)) + 1
                    : 1;

                $household = Household::create([
                    'barangay_id' => $barangayId,
                    'household_number' => sprintf('HH-%04d', $nextHhSeq),
                    'head_resident_id' => $resident->id,
                    'purok' => $resident->purok,
                    'member_count' => 1,
                ]);

                $resident->update(['household_id' => $household->id]);
            }

            // Calculate and update profile completion
            $resident->update([
                'profile_completion_pct' => $resident->calculateProfileCompletion(),
            ]);

            // Cross-barangay duplicate detection (gray flag)
            $this->detectCrossBarangayDuplicates($resident);

            // Auto-link voter record if name matches (sets is_voter + precinct)
            $this->autoLinkVoter($resident);

            // Auto-link cases where name matches (sets red flag source)
            $this->autoLinkCases($resident);

            Log::info('Resident created', [
                'resident_id' => $resident->id,
                'resident_number' => $residentNumber,
                'barangay_id' => $barangayId,
                'created_by' => $request->user()->id,
            ]);

            $this->logAudit($request, 'created', $resident, [
                'description' => 'New resident registered',
                'resident_number' => $residentNumber,
            ]);

            // Send SMS notification if enabled in barangay settings
            $barangay = Barangay::find($barangayId);
            $notifPrefs = $barangay?->notification_preferences ?? [];

            if (! empty($notifPrefs['sms_new_resident']) && $resident->mobile_number) {
                try {
                    // Build full name: FIRST_NAME M. LAST_NAME EXT
                    $middleInitial = $resident->middle_name ? mb_strtoupper(mb_substr($resident->middle_name, 0, 1)).'.' : '';
                    $extension = $resident->extension_name ? ' '.mb_strtoupper($resident->extension_name) : '';
                    $fullName = mb_strtoupper(trim(
                        ($resident->first_name ?? '').' '.$middleInitial.' '.($resident->last_name ?? '').$extension
                    ));
                    $barangayName = mb_strtoupper(trim($barangay->name ?? ''));

                    $message = SmsService::formatWithSenderHeader(
                        "Magandang araw po, {$fullName}! Kayo po ay matagumpay na narehistro bilang residente ng Barangay {$barangayName}. Ang inyong resident number ay {$residentNumber}. Ang inyong personal na impormasyon ay protektado sa ilalim ng RA 10173 (Data Privacy Act). Para sa mga katanungan, makipag-ugnayan po sa inyong barangay hall. Maraming salamat po!",
                        $barangay,
                    );
                    $this->smsService->send(
                        phone: $resident->mobile_number,
                        message: $message,
                        barangay: $barangay,
                        source: 'new_resident_registration',
                        sourceId: $resident->id,
                    );
                } catch (\Throwable $e) {
                    // Never let SMS failure block resident creation
                    Log::warning('SMS notification failed for new resident', [
                        'resident_id' => $resident->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return response()->json([
                'message' => 'Resident registered successfully.',
                'resident' => $resident->load('sectoralTags'),
                'resident_number' => $residentNumber,
            ], 201);
        });
    }

    /**
     * Update a resident.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $resident = Resident::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate($this->updateRules());

        // Map gov IDs
        $govIdMapping = [
            'philhealth_number' => 'philhealth_number_encrypted',
            'sss_gsis_number' => 'sss_gsis_number_encrypted',
            'pagibig_number' => 'pagibig_number_encrypted',
            'tin_number' => 'tin_number_encrypted',
            'pwd_id' => 'pwd_id_encrypted',
            'senior_citizen_id' => 'senior_citizen_id_encrypted',
        ];

        $updateData = collect($validated)
            ->except([
                'sectors', 'education_entries', 'work_entries',
                'business_entries', 'pet_entries', 'assistance_entries',
                'relative_entries',
                'philhealth_number', 'sss_gsis_number', 'pagibig_number',
                'tin_number', 'pwd_id', 'senior_citizen_id',
            ])
            ->toArray();

        foreach ($govIdMapping as $plainField => $encryptedField) {
            if (array_key_exists($plainField, $validated)) {
                $updateData[$encryptedField] = ! empty($validated[$plainField])
                    ? encrypt($validated[$plainField])
                    : null;
            }
        }

        // JSONB arrays
        if (array_key_exists('education_entries', $validated)) {
            $updateData['education_details'] = $validated['education_entries'];
        }
        if (array_key_exists('work_entries', $validated)) {
            $updateData['work_history'] = $validated['work_entries'];
        }
        if (array_key_exists('business_entries', $validated)) {
            $updateData['business_details'] = $validated['business_entries'];
        }
        if (array_key_exists('pet_entries', $validated)) {
            $updateData['pet_records'] = $validated['pet_entries'];
        }
        if (array_key_exists('assistance_entries', $validated)) {
            $updateData['assistance_history'] = $validated['assistance_entries'];
        }
        if (array_key_exists('relative_entries', $validated)) {
            $updateData['relative_links'] = $validated['relative_entries'];
        }

        $updateData['updated_by'] = $request->user()->id;

        // Capture changes for audit log
        $originalValues = [];
        $newValues = [];
        $readableFields = [
            'first_name', 'last_name', 'middle_name', 'extension_name', 'date_of_birth',
            'sex', 'civil_status', 'citizenship', 'religion', 'ethnicity',
            'mobile_number', 'email', 'purok', 'street', 'house_block_lot',
            'resident_type', 'is_head_of_household', 'is_voter', 'voter_precinct',
            'is_organ_donor', 'blood_type', 'occupation', 'monthly_income',
            'latitude', 'longitude',
        ];

        foreach ($updateData as $key => $value) {
            if (in_array($key, $readableFields) && $resident->getOriginal($key) != $value) {
                $originalValues[$key] = $resident->getOriginal($key);
                $newValues[$key] = $value;
            }
        }

        // Check JSONB array fields
        $jsonbFields = [
            'education_details' => 'education_entries',
            'work_history' => 'work_entries',
            'business_details' => 'business_entries',
            'pet_records' => 'pet_entries',
            'assistance_history' => 'assistance_entries',
            'relative_links' => 'relative_entries',
        ];
        foreach ($jsonbFields as $dbField => $frontendField) {
            if (array_key_exists($dbField, $updateData)) {
                $oldCount = is_array($resident->getOriginal($dbField)) ? count($resident->getOriginal($dbField)) : 0;
                $newCount = is_array($updateData[$dbField]) ? count($updateData[$dbField]) : 0;
                if ($oldCount !== $newCount) {
                    $originalValues[$dbField] = "{$oldCount} records";
                    $newValues[$dbField] = "{$newCount} records";
                }
            }
        }

        $resident->update($updateData);

        // Update sectoral tags if provided
        if (array_key_exists('sectors', $validated)) {
            $resident->sectoralTags()->delete();
            foreach ($validated['sectors'] as $sector) {
                ResidentSectoralTag::create([
                    'resident_id' => $resident->id,
                    'barangay_id' => $resident->barangay_id,
                    'sector' => $sector,
                ]);
            }
        }

        // Recalculate profile completion
        $resident->update([
            'profile_completion_pct' => $resident->calculateProfileCompletion(),
        ]);

        if (! empty($originalValues)) {
            $this->logAudit($request, 'updated', $resident, [
                'description' => 'Profile updated',
                'fields_changed' => array_keys($originalValues),
                'old' => $originalValues,
                'new' => $newValues,
            ]);
        }

        return response()->json([
            'message' => 'Resident updated.',
            'resident' => $resident->fresh()->load('sectoralTags'),
        ]);
    }

    /**
     * Soft delete a resident.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $resident = Resident::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $resident->update(['deleted_by' => $request->user()->id]);
        $resident->delete();

        $this->logAudit($request, 'deleted', $resident, [
            'description' => 'Resident record deleted (soft)',
            'resident_number' => $resident->resident_number,
            'name' => trim($resident->first_name.' '.$resident->last_name),
        ]);

        return response()->json(['message' => 'Resident deleted.']);
    }

    /**
     * Get activity/audit log for a specific resident.
     */
    public function activity(Request $request, string $id): JsonResponse
    {
        $resident = Resident::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $perPage = min((int) $request->get('per_page', 20), 50);

        $logs = AuditLog::where('resource_type', 'resident')
            ->where('resource_id', $resident->id)
            ->with('user:id,username,first_name,last_name')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Check for duplicate residents within the same barangay.
     * Called before form submission to warn the user.
     */
    public function checkDuplicate(Request $request): JsonResponse
    {
        $request->validate([
            'first_name' => ['required', 'string'],
            'last_name' => ['required', 'string'],
            'middle_name' => ['nullable', 'string'],
            'date_of_birth' => ['required', 'date'],
        ]);

        $barangayId = $request->user()->barangay_id;
        $firstName = trim($request->input('first_name'));
        $lastName = trim($request->input('last_name'));
        $middleName = trim($request->input('middle_name', ''));
        $dob = $request->input('date_of_birth');

        // Find matches: case-insensitive name + exact DOB
        $matches = Resident::where('barangay_id', $barangayId)
            ->whereNull('deleted_at')
            ->where(function ($q) use ($firstName, $lastName, $middleName, $dob) {
                $q->where(function ($inner) use ($firstName, $lastName, $dob) {
                    // Exact match: same first + last + DOB
                    $inner->where('first_name', 'ilike', $firstName)
                        ->where('last_name', 'ilike', $lastName)
                        ->where('date_of_birth', $dob);
                })->orWhere(function ($inner) use ($firstName, $lastName, $middleName) {
                    // Fuzzy match: similar first + last + DOB (catches typos)
                    $inner->whereRaw('LOWER(first_name) = LOWER(?)', [$firstName])
                        ->whereRaw('LOWER(last_name) = LOWER(?)', [$lastName]);
                    if ($middleName) {
                        $inner->whereRaw('LOWER(middle_name) = LOWER(?)', [$middleName]);
                    }
                });
            })
            ->select([
                'id', 'resident_number', 'first_name', 'middle_name', 'last_name',
                'extension_name', 'date_of_birth', 'sex', 'purok', 'status',
                'photo_file_id', 'mobile_number',
            ])
            ->limit(5)
            ->get()
            ->map(function ($resident) {
                return [
                    'id' => $resident->id,
                    'resident_number' => $resident->resident_number,
                    'full_name' => $resident->full_name,
                    'first_name' => $resident->first_name,
                    'middle_name' => $resident->middle_name,
                    'last_name' => $resident->last_name,
                    'date_of_birth' => $resident->date_of_birth?->toDateString(),
                    'age' => $resident->age,
                    'sex' => $resident->sex,
                    'purok' => $resident->purok,
                    'status' => $resident->status?->value,
                    'photo_file_id' => $resident->photo_file_id,
                    'mobile_number' => $resident->mobile_number,
                ];
            });

        return response()->json([
            'has_duplicates' => $matches->isNotEmpty(),
            'matches' => $matches,
        ]);
    }

    /**
     * Detect cross-barangay duplicates (gray flag).
     * Checks if a resident exists in other barangays.
     */
    private function detectCrossBarangayDuplicates(Resident $resident): void
    {
        if (! $resident->first_name || ! $resident->last_name || ! $resident->date_of_birth) {
            return;
        }

        $crossMatches = Resident::where('barangay_id', '!=', $resident->barangay_id)
            ->whereNull('deleted_at')
            ->whereRaw('LOWER(first_name) = LOWER(?)', [$resident->first_name])
            ->whereRaw('LOWER(last_name) = LOWER(?)', [$resident->last_name])
            ->where('date_of_birth', $resident->date_of_birth)
            ->select(['id', 'barangay_id'])
            ->get();

        foreach ($crossMatches as $match) {
            // Create flag for the new resident
            ResidentCrossBarangayFlag::updateOrCreate(
                [
                    'resident_id' => $resident->id,
                    'other_barangay_id' => $match->barangay_id,
                ],
                [
                    'match_confidence' => 0.95,
                    'detected_at' => now(),
                ]
            );

            // Create flag for the existing resident too
            ResidentCrossBarangayFlag::updateOrCreate(
                [
                    'resident_id' => $match->id,
                    'other_barangay_id' => $resident->barangay_id,
                ],
                [
                    'match_confidence' => 0.95,
                    'detected_at' => now(),
                ]
            );
        }
    }

    /**
     * Auto-link voter record on new resident registration.
     * If a voter with matching last_name + first_name exists (same barangay, not yet linked),
     * link it and mark the resident as a registered voter.
     */
    private function autoLinkVoter(Resident $resident): void
    {
        if (! $resident->first_name || ! $resident->last_name) {
            return;
        }

        $voter = Voter::where('barangay_id', $resident->barangay_id)
            ->whereNull('resident_id')
            ->whereRaw('LOWER(last_name) = LOWER(?)', [$resident->last_name])
            ->whereRaw('LOWER(first_name) = LOWER(?)', [$resident->first_name])
            ->first();

        if ($voter) {
            $voter->update(['resident_id' => $resident->id]);
            $resident->update([
                'is_voter' => true,
                'voter_precinct_number' => $voter->precinct_number,
            ]);

            Log::info('Voter auto-linked on resident registration', [
                'resident_id' => $resident->id,
                'voter_id' => $voter->id,
                'precinct' => $voter->precinct_number,
            ]);
        }
    }

    /**
     * Auto-link existing case records (blotter, KP) on new resident registration.
     * Updates unlinked records where the complainant/respondent/party name matches.
     */
    private function autoLinkCases(Resident $resident): void
    {
        if (! $resident->first_name || ! $resident->last_name) {
            return;
        }

        $firstName = $resident->first_name;
        $lastName = $resident->last_name;

        // Blotter — complainant
        $blotterComplainant = BlotterRecord::where('barangay_id', $resident->barangay_id)
            ->whereNull('complainant_resident_id')
            ->whereRaw('LOWER(complainant_name) LIKE LOWER(?)', ["%{$lastName}%"])
            ->whereRaw('LOWER(complainant_name) LIKE LOWER(?)', ["%{$firstName}%"])
            ->update(['complainant_resident_id' => $resident->id]);

        // Blotter — respondent
        $blotterRespondent = BlotterRecord::where('barangay_id', $resident->barangay_id)
            ->whereNull('respondent_resident_id')
            ->whereRaw('LOWER(respondent_name) LIKE LOWER(?)', ["%{$lastName}%"])
            ->whereRaw('LOWER(respondent_name) LIKE LOWER(?)', ["%{$firstName}%"])
            ->update(['respondent_resident_id' => $resident->id]);

        // KP case parties
        $kpParties = KpCaseParty::where('barangay_id', $resident->barangay_id)
            ->whereNull('resident_id')
            ->whereRaw('LOWER(full_name) LIKE LOWER(?)', ["%{$lastName}%"])
            ->whereRaw('LOWER(full_name) LIKE LOWER(?)', ["%{$firstName}%"])
            ->update(['resident_id' => $resident->id]);

        if ($blotterComplainant + $blotterRespondent + $kpParties > 0) {
            Log::info('Cases auto-linked on resident registration', [
                'resident_id' => $resident->id,
                'blotter_complainant' => $blotterComplainant,
                'blotter_respondent' => $blotterRespondent,
                'kp_parties' => $kpParties,
            ]);
        }
    }

    // ── Validation Rules ──

    private function storeRules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'extension_name' => ['nullable', 'string', 'max:10'],
            'mothers_maiden_name' => ['nullable', 'string', 'max:200'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'place_of_birth' => ['required', 'string', 'max:255'],
            'sex' => ['required', 'in:male,female,lesbian,gay,bisexual,transgender,queer,intersex,other,prefer not to say'],
            'civil_status' => ['required', 'string', 'max:20'],
            'citizenship' => ['nullable', 'string', 'max:50'],
            'blood_type' => ['nullable', 'string', 'max:5'],
            'height_cm' => ['nullable', 'numeric', 'min:30', 'max:250'],
            'weight_kg' => ['nullable', 'numeric', 'min:1', 'max:500'],
            'complexion' => ['nullable', 'string', 'max:30'],
            'religion' => ['nullable', 'string', 'max:100'],
            'ethnicity' => ['nullable', 'string', 'max:100'],
            'resident_type' => ['required', 'in:permanent,transient,transferee'],
            'housing_type' => ['nullable', 'string', 'max:50'],
            'date_of_occupancy' => ['nullable', 'date_format:Y-m-d'],

            // Contact
            'email' => ['nullable', 'email', 'max:255'],
            'mobile_number' => ['nullable', 'string', 'max:20'],

            // Address
            'purok' => ['nullable', 'string', 'max:100'],
            'sitio' => ['nullable', 'string', 'max:100'],
            'house_block_lot' => ['nullable', 'string', 'max:255'],
            'street' => ['nullable', 'string', 'max:255'],
            'zip_code' => ['nullable', 'string', 'max:10'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],

            // Voter
            'is_voter' => ['nullable', 'boolean'],
            'is_resident_voter' => ['nullable', 'boolean'],
            'voter_precinct_number' => ['nullable', 'string', 'max:50'],
            'last_voted_year' => ['nullable', 'integer', 'min:1990', 'max:'.date('Y')],

            // Contact
            'telephone' => ['nullable', 'string', 'max:20'],

            // Government IDs (plain values -- encrypted on save)
            'philhealth_number' => ['nullable', 'string', 'max:50'],
            'philhealth_expiry' => ['nullable', 'date'],
            'sss_gsis_number' => ['nullable', 'string', 'max:50'],
            'sss_gsis_expiry' => ['nullable', 'date'],
            'pagibig_number' => ['nullable', 'string', 'max:50'],
            'pagibig_expiry' => ['nullable', 'date'],
            'tin_number' => ['nullable', 'string', 'max:50'],
            'tin_expiry' => ['nullable', 'date'],
            'pwd_id' => ['nullable', 'string', 'max:50'],
            'pwd_id_expiry' => ['nullable', 'date'],
            'senior_citizen_id' => ['nullable', 'string', 'max:50'],

            // Education
            'highest_education' => ['nullable', 'string', 'max:100'],
            'education_entries' => ['nullable', 'array'],
            'education_entries.*.level' => ['required_with:education_entries', 'string'],
            'education_entries.*.school' => ['nullable', 'string'],
            'education_entries.*.course' => ['nullable', 'string'],
            'education_entries.*.start_year' => ['nullable', 'string'],
            'education_entries.*.end_year' => ['nullable', 'string'],
            'education_entries.*.currently_studying' => ['nullable', 'boolean'],

            // Employment
            'occupation' => ['nullable', 'string', 'max:200'],
            'employer' => ['nullable', 'string', 'max:200'],
            'monthly_income_range' => ['nullable', 'string', 'max:50'],
            'source_of_income' => ['nullable', 'string', 'max:200'],
            'livelihood_type' => ['nullable', 'string', 'max:50'],
            'skills' => ['nullable', 'string', 'max:2000'],

            // Work history
            'work_entries' => ['nullable', 'array'],
            'work_entries.*.position' => ['required_with:work_entries', 'string'],
            'work_entries.*.company' => ['nullable', 'string'],
            'work_entries.*.employment_type' => ['nullable', 'string'],
            'work_entries.*.start_year' => ['nullable', 'string'],
            'work_entries.*.end_year' => ['nullable', 'string'],
            'work_entries.*.description' => ['nullable', 'string'],

            // Business
            'business_entries' => ['nullable', 'array'],
            'business_entries.*.business_name' => ['required_with:business_entries', 'string'],
            'business_entries.*.business_type' => ['nullable', 'string'],
            'business_entries.*.business_address' => ['nullable', 'string'],
            'business_entries.*.business_permit_no' => ['nullable', 'string'],
            'business_entries.*.dti_sec_no' => ['nullable', 'string'],
            'business_entries.*.monthly_income' => ['nullable', 'string'],
            'business_entries.*.start_year' => ['nullable', 'string'],
            'business_entries.*.status' => ['nullable', 'string'],
            'business_entries.*.description' => ['nullable', 'string'],

            // Pets
            'pet_entries' => ['nullable', 'array'],
            'pet_entries.*.name' => ['required_with:pet_entries', 'string'],
            'pet_entries.*.pet_type' => ['nullable', 'string'],
            'pet_entries.*.sex' => ['nullable', 'string'],
            'pet_entries.*.date_of_birth' => ['nullable', 'string'],
            'pet_entries.*.remarks' => ['nullable', 'string'],

            // Assistance
            'assistance_entries' => ['nullable', 'array'],
            'assistance_entries.*.date' => ['required_with:assistance_entries', 'string'],
            'assistance_entries.*.type' => ['nullable', 'string'],
            'assistance_entries.*.description' => ['nullable', 'string'],
            'assistance_entries.*.amount' => ['nullable', 'string'],
            'assistance_entries.*.source' => ['nullable', 'string'],
            'assistance_entries.*.status' => ['nullable', 'string'],
            'assistance_entries.*.remarks' => ['nullable', 'string'],

            // Relatives
            'relative_entries' => ['nullable', 'array'],
            'relative_entries.*.resident_id' => ['nullable', 'string'],
            'relative_entries.*.resident_name' => ['nullable', 'string'],
            'relative_entries.*.relationship' => ['required_with:relative_entries', 'string'],

            // Health
            'health_history' => ['nullable', 'string', 'max:5000'],
            'is_organ_donor' => ['nullable', 'boolean'],

            // Barangay role
            'barangay_position' => ['nullable', 'string', 'max:100'],
            'barangay_role_start' => ['nullable', 'date'],
            'barangay_role_end' => ['nullable', 'date'],

            // Sectors
            'sectors' => ['nullable', 'array'],
            'sectors.*' => ['string', 'max:50'],
            'sector_other' => ['nullable', 'string', 'max:255'],
            'other_remarks' => ['nullable', 'string', 'max:5000'],

            // Registration source (set by census / import / office form)
            'registration_source' => ['nullable', 'in:form,census,import'],

            // Household
            'is_head_of_household' => ['nullable', 'boolean'],
            'relationship_to_head' => ['nullable', 'string', 'max:50'],

            // Emergency
            'emergency_contact_name' => ['nullable', 'string', 'max:200'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'emergency_contact_address' => ['nullable', 'string', 'max:1000'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:50'],

            // Guardian for minors
            'guardian_name' => ['nullable', 'string', 'max:200'],
            'guardian_relationship' => ['nullable', 'string', 'max:50'],
            'guardian_phone' => ['nullable', 'string', 'max:20'],

            // Biometric file references (upload via POST /api/v1/files first)
            'photo_file_id' => ['nullable', 'uuid', 'exists:files,id'],
            'signature_file_id' => ['nullable', 'uuid', 'exists:files,id'],
            'left_thumbmark_file_id' => ['nullable', 'uuid', 'exists:files,id'],
            'right_thumbmark_file_id' => ['nullable', 'uuid', 'exists:files,id'],
        ];
    }

    private function updateRules(): array
    {
        $rules = $this->storeRules();

        // Make required fields optional for updates
        $rules['first_name'] = ['sometimes', 'string', 'max:100'];
        $rules['last_name'] = ['sometimes', 'string', 'max:100'];
        $rules['date_of_birth'] = ['sometimes', 'date', 'before:today'];
        $rules['place_of_birth'] = ['sometimes', 'string', 'max:255'];
        $rules['sex'] = ['sometimes', 'in:male,female,lesbian,gay,bisexual,transgender,queer,intersex,other,prefer not to say'];
        $rules['civil_status'] = ['sometimes', 'string', 'max:20'];
        $rules['resident_type'] = ['sometimes', 'in:permanent,transient,transferee'];
        $rules['status'] = ['sometimes', 'in:active,inactive,deceased,transferred'];

        return $rules;
    }

    /**
     * Export residents as CSV.
     * Columns: Resident Number, Name, DOB, Sex, Civil Status, Address, Contact
     *
     * GET /api/v1/residents/export
     */
    public function export(Request $request): StreamedResponse
    {
        $barangayId = $request->user()->barangay_id;
        $barangay = Barangay::findOrFail($barangayId);

        $query = Resident::where('barangay_id', $barangayId);

        // Apply same filters as index
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'ilike', "%{$search}%")
                    ->orWhere('last_name', 'ilike', "%{$search}%")
                    ->orWhere('middle_name', 'ilike', "%{$search}%")
                    ->orWhere('resident_number', 'ilike', "%{$search}%")
                    ->orWhere('mobile_number', 'ilike', "%{$search}%");
            });
        }
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }
        if ($purok = $request->get('purok')) {
            $query->where('purok', $purok);
        }
        if ($sex = $request->get('sex')) {
            $query->where('sex', $sex);
        }
        if ($request->has('is_voter')) {
            $query->where('is_voter', $request->boolean('is_voter'));
        }
        if ($civilStatus = $request->get('civil_status')) {
            $query->where('civil_status', $civilStatus);
        }
        if ($residentType = $request->get('resident_type')) {
            $query->where('resident_type', $residentType);
        }
        if ($request->has('is_head_of_household')) {
            $query->where('is_head_of_household', $request->boolean('is_head_of_household'));
        }
        if ($citizenship = $request->get('citizenship')) {
            $query->where('citizenship', 'ilike', "%{$citizenship}%");
        }
        if ($religion = $request->get('religion')) {
            $query->where('religion', 'ilike', "%{$religion}%");
        }
        if ($ethnicity = $request->get('ethnicity')) {
            $query->where('ethnicity', 'ilike', "%{$ethnicity}%");
        }
        if ($sector = $request->get('sector')) {
            $query->whereHas('sectoralTags', function ($q) use ($sector) {
                $q->where('sector', $sector);
            });
        }

        $query->orderBy('last_name')->orderBy('first_name');

        $headers = [
            'Resident Number',
            'Last Name', 'First Name', 'Middle Name',
            'Date of Birth', 'Sex', 'Civil Status',
            'Purok', 'Street', 'House/Block/Lot',
            'Mobile Number', 'Email',
        ];

        $filename = Str::slug($barangay->name).'-residents-'.now()->format('Y-m-d').'.csv';

        Log::info('Resident CSV export', [
            'barangay_id' => $barangayId,
            'user_id' => $request->user()->id,
            'filters' => $request->only(['search', 'status', 'purok', 'sex', 'is_voter']),
        ]);

        return response()->streamDownload(function () use ($query, $headers) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF"); // UTF-8 BOM for Excel
            fputcsv($handle, $headers);

            $query->chunk(500, function ($residents) use ($handle) {
                foreach ($residents as $r) {
                    fputcsv($handle, [
                        $r->resident_number,
                        $r->last_name,
                        $r->first_name,
                        $r->middle_name,
                        $r->date_of_birth?->format('m/d/Y'),
                        ucfirst($r->sex ?? ''),
                        $r->civil_status,
                        $r->purok,
                        $r->street,
                        $r->house_block_lot,
                        $r->mobile_number,
                        $r->email,
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Preview CSV headers for column mapping verification.
     * Returns the CSV headers + first 5 sample rows so the user can confirm mapping.
     *
     * POST /api/v1/residents/import/preview
     */
    public function importPreview(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');

        if (! $handle) {
            return response()->json(['message' => 'Failed to read file.'], 422);
        }

        $rawHeaders = fgetcsv($handle);
        if (! $rawHeaders || count($rawHeaders) < 2) {
            fclose($handle);

            return response()->json(['message' => 'Invalid CSV. Must have at least 2 columns.'], 422);
        }

        // Strip UTF-8 BOM
        $rawHeaders[0] = preg_replace('/^\x{FEFF}/u', '', $rawHeaders[0]);

        // Read first 5 data rows for preview
        $sampleRows = [];
        $totalRows = 0;
        while (($row = fgetcsv($handle)) !== false) {
            if (! array_filter($row)) {
                continue;
            }
            $totalRows++;
            if (count($sampleRows) < 5) {
                $sampleRows[] = $row;
            }
        }
        // Count remaining rows
        while (($row = fgetcsv($handle)) !== false) {
            if (array_filter($row)) {
                $totalRows++;
            }
        }

        fclose($handle);

        // Auto-detect mapping
        $autoMap = $this->autoDetectMapping($rawHeaders);

        return response()->json([
            'headers' => $rawHeaders,
            'sample_rows' => $sampleRows,
            'total_rows' => $totalRows,
            'auto_mapping' => $autoMap,
            'required_fields' => ['first_name', 'last_name'],
            'optional_fields' => ['middle_name', 'date_of_birth'],
        ]);
    }

    /**
     * Import residents from CSV with explicit column mapping.
     * Only imports: first_name, last_name, middle_name, date_of_birth.
     *
     * POST /api/v1/residents/import
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
            'mapping' => ['required', 'array'],
            'mapping.first_name' => ['required', 'integer', 'min:0'],
            'mapping.last_name' => ['required', 'integer', 'min:0'],
            'mapping.middle_name' => ['nullable', 'integer', 'min:0'],
            'mapping.date_of_birth' => ['nullable', 'integer', 'min:0'],
        ]);

        $barangayId = $request->user()->barangay_id;
        $barangay = Barangay::findOrFail($barangayId);
        $psgcCode = $barangay->psgc_code;

        if (! $psgcCode) {
            return response()->json(['message' => 'Barangay PSGC code is not configured.'], 422);
        }

        $mapping = $request->input('mapping');
        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');

        if (! $handle) {
            return response()->json(['message' => 'Failed to read file.'], 422);
        }

        // Skip header row
        $rawHeaders = fgetcsv($handle);
        if ($rawHeaders) {
            $rawHeaders[0] = preg_replace('/^\x{FEFF}/u', '', $rawHeaders[0]);
        }

        // Create import batch record
        $batch = ImportBatch::create([
            'barangay_id' => $barangayId,
            'imported_by' => $request->user()->id,
            'filename' => $file->getClientOriginalName(),
            'column_mapping' => $mapping,
            'status' => 'completed',
        ]);

        $imported = 0;
        $skipped = 0;
        $errors = [];
        $rowNum = 1;

        // Get the highest existing sequence number once (not per row)
        $residentPrefix = "RES-{$psgcCode}-";
        $sequenceOrderSql = DB::connection()->getDriverName() === 'sqlite'
            ? 'CAST(SUBSTR(resident_number, '.(strlen($residentPrefix) + 1).') AS INTEGER) DESC'
            : "CAST(SPLIT_PART(resident_number, '-', 3) AS INTEGER) DESC";
        $lastNumber = Resident::where('barangay_id', $barangayId)
            ->where('resident_number', 'like', "{$residentPrefix}%")
            ->orderByRaw($sequenceOrderSql)
            ->value('resident_number');
        $nextSeq = 1;
        if ($lastNumber) {
            $parts = explode('-', $lastNumber);
            $nextSeq = ((int) end($parts)) + 1;
        }

        DB::beginTransaction();

        try {
            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;

                if (! array_filter($row)) {
                    continue;
                }

                // Extract values using explicit mapping
                $firstName = isset($mapping['first_name']) ? trim($row[$mapping['first_name']] ?? '') : '';
                $lastName = isset($mapping['last_name']) ? trim($row[$mapping['last_name']] ?? '') : '';
                $middleName = isset($mapping['middle_name']) ? trim($row[$mapping['middle_name']] ?? '') : '';
                $dobRaw = isset($mapping['date_of_birth']) ? trim($row[$mapping['date_of_birth']] ?? '') : '';

                // Validate required
                if (! $firstName || ! $lastName) {
                    $skipped++;
                    $errors[] = "Row {$rowNum}: Missing first name or last name.";

                    continue;
                }

                // Parse date of birth
                $dob = null;
                if ($dobRaw) {
                    try {
                        $dob = \Carbon\Carbon::parse($dobRaw)->format('Y-m-d');
                    } catch (\Throwable) {
                        $errors[] = "Row {$rowNum}: Invalid date '{$dobRaw}' — imported without DOB.";
                    }
                }

                // Check duplicate
                $dupeQuery = Resident::where('barangay_id', $barangayId)
                    ->whereRaw('LOWER(first_name) = ?', [mb_strtolower($firstName)])
                    ->whereRaw('LOWER(last_name) = ?', [mb_strtolower($lastName)]);
                if ($dob) {
                    $dupeQuery->where('date_of_birth', $dob);
                }
                if ($dupeQuery->exists()) {
                    $skipped++;
                    $errors[] = "Row {$rowNum}: {$firstName} {$lastName} already exists.";

                    continue;
                }

                $residentNumber = sprintf('RES-%s-%04d', $psgcCode, $nextSeq);
                $nextSeq++;

                Resident::create([
                    'barangay_id' => $barangayId,
                    'resident_number' => $residentNumber,
                    'registration_date' => now(),
                    'registration_source' => 'import',
                    'import_batch_id' => $batch->id,
                    'first_name' => mb_strtoupper($firstName),
                    'last_name' => mb_strtoupper($lastName),
                    'middle_name' => $middleName ? mb_strtoupper($middleName) : null,
                    'date_of_birth' => $dob,
                    'status' => 'active',
                    'resident_type' => 'permanent',
                ]);

                $imported++;
            }

            // Update batch record
            $batch->update([
                'total_rows' => $rowNum - 1,
                'imported_count' => $imported,
                'skipped_count' => $skipped,
                'errors' => $errors ?: null,
            ]);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            fclose($handle);
            $batch->update(['status' => 'failed']);

            Log::error('Resident CSV import failed', [
                'barangay_id' => $barangayId,
                'batch_id' => $batch->id,
                'error' => $e->getMessage(),
                'row' => $rowNum,
            ]);

            return response()->json([
                'message' => "Import failed at row {$rowNum}: ".$e->getMessage(),
            ], 500);
        }

        fclose($handle);

        Log::info('Resident CSV import completed', [
            'barangay_id' => $barangayId,
            'batch_id' => $batch->id,
            'user_id' => $request->user()->id,
            'imported' => $imported,
            'skipped' => $skipped,
        ]);

        return response()->json([
            'message' => "{$imported} residents imported."
                .($skipped > 0 ? " {$skipped} skipped (duplicates or missing data)." : ''),
            'batch_id' => $batch->id,
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, 20),
        ]);
    }

    /**
     * List import batches for the current barangay.
     *
     * GET /api/v1/residents/import/batches
     */
    public function importBatches(Request $request): JsonResponse
    {
        $batches = ImportBatch::where('barangay_id', $request->user()->barangay_id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json(['data' => $batches]);
    }

    /**
     * Rollback (delete) all residents from an import batch.
     *
     * DELETE /api/v1/residents/import/batches/{batchId}
     */
    public function rollbackImport(Request $request, string $batchId): JsonResponse
    {
        $batch = ImportBatch::where('barangay_id', $request->user()->barangay_id)
            ->where('status', 'completed')
            ->findOrFail($batchId);

        $count = Resident::where('import_batch_id', $batch->id)->count();

        DB::transaction(function () use ($batch, $request) {
            // Hard delete imported residents (they were bulk-imported, not manually entered)
            Resident::where('import_batch_id', $batch->id)->delete();

            $batch->update([
                'status' => 'rolled_back',
                'rolled_back_at' => now(),
                'rolled_back_by' => $request->user()->id,
            ]);
        });

        Log::info('Import batch rolled back', [
            'batch_id' => $batch->id,
            'barangay_id' => $batch->barangay_id,
            'user_id' => $request->user()->id,
            'residents_deleted' => $count,
        ]);

        return response()->json([
            'message' => "{$count} imported residents removed.",
        ]);
    }

    /**
     * Auto-detect CSV column → field mapping by header name.
     */
    private function autoDetectMapping(array $headers): array
    {
        $map = [];
        $normalize = fn (string $h): string => mb_strtolower(
            preg_replace('/[\s\/\-\_\.]+/', '_', trim($h))
        );

        $aliases = [
            'first_name' => ['first_name', 'firstname', 'given_name', 'first', 'fname'],
            'last_name' => ['last_name', 'lastname', 'surname', 'family_name', 'last', 'lname'],
            'middle_name' => ['middle_name', 'middlename', 'middle', 'mname'],
            'date_of_birth' => ['date_of_birth', 'dob', 'birthdate', 'birth_date', 'birthday'],
        ];

        foreach ($headers as $idx => $header) {
            $n = $normalize($header);
            foreach ($aliases as $field => $aliasList) {
                if (in_array($n, $aliasList, true)) {
                    $map[$field] = $idx;
                    break;
                }
            }
        }

        return $map;
    }

    /**
     * Log an audit entry for resident operations.
     */
    /**
     * Generate and return a PDF record card for a resident.
     *
     * GET /api/v1/residents/{id}/print
     *
     * Also records the print action in:
     *   - audit_logs       → surfaces in the resident's Activity tab
     *   - issued_documents → surfaces in the resident's Documents tab
     */
    public function printRecord(Request $request, string $id): Response
    {
        $barangayId = $request->user()->barangay_id;

        $resident = Resident::where('barangay_id', $barangayId)
            ->with(['sectoralTags', 'photoFile'])
            ->findOrFail($id);

        $barangay = Barangay::findOrFail($barangayId);

        // ── Generate PDF ──
        $pdfService = new ResidentPdfService;
        $pdfBytes = $pdfService->generate($resident, $barangay, $request->user());

        // ── Log to audit trail (Activity tab) ──
        $this->logAudit($request, 'printed', $resident, [
            'description' => 'Resident record card printed as PDF',
            'resident_number' => $resident->resident_number,
        ]);

        // ── Record in issued_documents (Documents tab) ──
        DB::transaction(function () use ($barangayId, $resident, $request) {
            // Sequential document number per barangay — zero-padded to 8 digits
            $lastRaw = IssuedDocument::where('barangay_id', $barangayId)->max('document_number');
            $lastNum = is_numeric($lastRaw) ? (int) $lastRaw : 0;
            $nextNum = str_pad((string) ($lastNum + 1), 8, '0', STR_PAD_LEFT);

            IssuedDocument::create([
                'barangay_id' => $barangayId,
                'document_number' => $nextNum,
                'template_name' => 'Resident Record Card',
                'constituent_type' => 'resident',
                'constituent_id' => $resident->id,
                'constituent_name' => $resident->full_name,
                'constituent_number' => $resident->resident_number,
                'purpose' => 'Record print — generated by system',
                'issued_date' => now()->toDateString(),
                'status' => 'issued',
                'created_by' => $request->user()->id,
            ]);
        });

        $filename = str_replace(['/', ' '], '-', $resident->resident_number ?? $id).'-record.pdf';

        return response($pdfBytes, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
            'Cache-Control' => 'no-store, no-cache',
        ]);
    }

    /**
     * Send an SMS to a specific resident via TxtBox.
     * Validates credits, sends, logs to sms_transactions, records audit trail.
     *
     * POST /api/v1/residents/{resident}/sms
     */
    public function sendSms(Request $request, string $id): JsonResponse
    {
        $resident = Resident::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        if (empty($resident->mobile_number)) {
            return response()->json([
                'message' => 'This resident has no registered mobile number.',
            ], 422);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:636'], // max 4 segments
        ]);

        $userMessage = trim($validated['message']);
        $barangay = $request->user()->barangay;

        // Prepend barangay sender header so recipient knows who sent it
        $message = SmsService::formatWithSenderHeader($userMessage, $barangay);
        $cost = SmsService::calculateCost($message);
        $segments = SmsService::calculateSegments($message);

        if (! $barangay->hasSmsCredits($cost)) {
            return response()->json([
                'message' => 'Insufficient SMS credits. Balance: ₱'.number_format((float) $barangay->sms_credit_balance, 2).', required: ₱'.number_format($cost, 2).'.',
            ], 422);
        }

        $sent = $this->smsService->send(
            phone: $resident->mobile_number,
            message: $message,
            barangay: $barangay,
            source: 'resident_sms',
            sourceId: $resident->id,
        );

        // Always log to audit so it appears in the Activity tab
        $this->logAudit($request, 'sms_sent', $resident, [
            'segments' => $segments,
            'cost' => $cost,
            'status' => $sent ? 'sent' : 'failed',
            'phone_masked' => substr($resident->mobile_number, 0, 4).'****'.substr($resident->mobile_number, -2),
        ]);

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

    /**
     * Get SMS history for a specific resident.
     * Returns paginated sms_transactions where source = resident_sms and source_id = resident.id
     *
     * GET /api/v1/residents/{resident}/sms-history
     */
    public function smsHistory(Request $request, string $id): JsonResponse
    {
        $resident = Resident::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $perPage = min((int) $request->get('per_page', 20), 50);

        $logs = \App\Models\Platform\SmsTransaction::where('barangay_id', $request->user()->barangay_id)
            ->where('source', 'resident_sms')
            ->where('source_id', $resident->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($logs);
    }

    private function logAudit(Request $request, string $action, Resident $resident, ?array $changes = null): void
    {
        AuditLog::create([
            'barangay_id' => $resident->barangay_id,
            'user_id' => $request->user()->id,
            'action' => $action,
            'resource_type' => 'resident',
            'resource_id' => $resident->id,
            'changes' => $changes,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'module' => 'residents',
        ]);
    }
}
