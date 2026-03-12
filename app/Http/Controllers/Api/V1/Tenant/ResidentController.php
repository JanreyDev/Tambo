<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Admin\Barangay;
use App\Models\Tenant\Records\Household;
use App\Models\Tenant\Records\ResidentCrossBarangayFlag;
use App\Models\Tenant\Records\ResidentSectoralTag;
use App\Models\Tenant\Resident;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ResidentController extends Controller
{
    public function __construct(
        private readonly SmsService $smsService,
    ) {}

    /**
     * List residents with search/filter/pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = Resident::where('barangay_id', $barangayId)
            ->with(['sectoralTags', 'crossBarangayFlags']);

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

        // Sort
        $sortBy = $request->get('sort_by', 'last_name');
        $sortDir = $request->get('sort_dir', 'asc');
        $allowedSorts = ['last_name', 'first_name', 'created_at', 'date_of_birth', 'resident_number'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);
        $residents = $query->paginate($perPage);

        return response()->json($residents);
    }

    /**
     * Get a single resident with full details.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $resident = Resident::where('barangay_id', $request->user()->barangay_id)
            ->with(['household', 'sectoralTags', 'crossBarangayFlags'])
            ->findOrFail($id);

        return response()->json(['resident' => $resident]);
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

        // Check for same-barangay duplicate (exact match = block)
        $exactDuplicate = Resident::where('barangay_id', $barangayId)
            ->whereRaw('LOWER(first_name) = ?', [mb_strtolower(trim($validated['first_name']))])
            ->whereRaw('LOWER(last_name) = ?', [mb_strtolower(trim($validated['last_name']))])
            ->where('date_of_birth', $validated['date_of_birth'])
            ->whereNull('deleted_at')
            ->exists();

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

            Log::info('Resident created', [
                'resident_id' => $resident->id,
                'resident_number' => $residentNumber,
                'barangay_id' => $barangayId,
                'created_by' => $request->user()->id,
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

        return response()->json(['message' => 'Resident deleted.']);
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
            'sex' => ['required', 'in:male,female'],
            'civil_status' => ['required', 'string', 'max:20'],
            'citizenship' => ['nullable', 'string', 'max:50'],
            'blood_type' => ['nullable', 'string', 'max:5'],
            'height_cm' => ['nullable', 'numeric', 'min:30', 'max:250'],
            'weight_kg' => ['nullable', 'numeric', 'min:1', 'max:500'],
            'complexion' => ['nullable', 'string', 'max:30'],
            'religion' => ['nullable', 'string', 'max:100'],
            'ethnicity' => ['nullable', 'string', 'max:100'],
            'resident_type' => ['required', 'in:permanent,transient,transferee'],

            // Contact
            'email' => ['nullable', 'email', 'max:255'],
            'mobile_number' => ['nullable', 'string', 'max:20'],

            // Address
            'purok' => ['nullable', 'string', 'max:100'],
            'sitio' => ['nullable', 'string', 'max:100'],
            'house_block_lot' => ['nullable', 'string', 'max:100'],
            'street' => ['nullable', 'string', 'max:255'],
            'subdivision_village' => ['nullable', 'string', 'max:255'],
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

            // Household
            'is_head_of_household' => ['nullable', 'boolean'],

            // Emergency
            'emergency_contact_name' => ['nullable', 'string', 'max:200'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'emergency_contact_address' => ['nullable', 'string', 'max:1000'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:50'],

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
        $rules['sex'] = ['sometimes', 'in:male,female'];
        $rules['civil_status'] = ['sometimes', 'string', 'max:20'];
        $rules['resident_type'] = ['sometimes', 'in:permanent,transient,transferee'];
        $rules['status'] = ['sometimes', 'in:active,inactive,deceased,transferred'];

        return $rules;
    }
}
