<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\BarangayStatus;
use App\Http\Controllers\Controller;
use App\Models\Admin\Barangay;
use App\Models\Admin\File;
use App\Models\Platform\LoginLog;
use App\Models\Platform\SmsTransaction;
use App\Models\Tenant\Assets\Asset;
use App\Models\Tenant\Assets\InventoryItem;
use App\Models\Tenant\Disaster\Evacuation;
use App\Models\Tenant\Disaster\HazardPin;
use App\Models\Tenant\Documents\DocumentTemplate;
use App\Models\Tenant\Documents\IssuedDocument;
use App\Models\Tenant\Finance\Budget;
use App\Models\Tenant\Finance\DisbursementVoucher;
use App\Models\Tenant\Finance\Payment;
use App\Models\Tenant\Hris\Employee;
use App\Models\Tenant\Judicial\BlotterRecord;
use App\Models\Tenant\Judicial\KpCase;
use App\Models\Tenant\Judicial\VawcCase;
use App\Models\Tenant\Officials\BarangayOfficial;
use App\Models\Tenant\PublicPortal\PublicComplaint;
use App\Models\Tenant\Records\Establishment;
use App\Models\Tenant\Records\Household;
use App\Models\Tenant\Records\LotBuilding;
use App\Models\Tenant\Resident;
use App\Models\Tenant\Tanod\Tanod;
use App\Models\Tenant\Tanod\TanodIncidentReport;
use App\Models\User;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Admin endpoints for barangay tenant management.
 * Accessible only by super_admin users (founder dashboard).
 *
 * These endpoints bypass RLS because super_admin users have
 * empty tenant context in SetTenantContext middleware.
 */
class AdminBarangayController extends Controller
{
    /**
     * List all barangays with stats.
     *
     * GET /api/v1/admin/barangays
     * Query: ?search=&status=active&per_page=20&sort=name&direction=asc
     */
    public function index(Request $request): JsonResponse
    {
        $query = Barangay::query()
            ->withCount(['users', 'residents']);

        // Search by name, PSGC, or address
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('psgc_code', 'like', "%{$search}%")
                    ->orWhere('full_address', 'ilike', "%{$search}%");
            });
        }

        // Filter by status
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        // Sorting
        $sortField = $request->get('sort', 'name');
        $sortDirection = $request->get('direction', 'asc');
        $allowedSorts = ['name', 'created_at', 'status', 'subscription_plan'];

        if (in_array($sortField, $allowedSorts, true)) {
            $query->orderBy($sortField, $sortDirection === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 20), 100);

        $barangays = $query->paginate($perPage);

        // Transform for the tenants list view
        $barangays->getCollection()->transform(function (Barangay $b) {
            return [
                'id' => $b->id,
                'name' => $b->name,
                'psgc_code' => $b->psgc_code,
                'full_address' => $b->full_address,
                'municipality_psgc' => $b->municipality_psgc,
                'province_psgc' => $b->province_psgc,
                'region_psgc' => $b->region_psgc,
                'logo_url' => $b->logo_url,
                'seal_url' => $b->seal_url,
                'status' => $b->status->value,
                'subscription_plan' => $b->subscription_plan,
                'subscription_expires_at' => $b->subscription_expires_at?->toISOString(),
                'users_count' => $b->users_count,
                'residents_count' => $b->residents_count,
                'sms_credit_balance' => (float) $b->sms_credit_balance,
                'ai_credit_balance' => (float) $b->ai_credit_balance,
                'storage_used_bytes' => (int) $b->storage_used_bytes,
                'storage_limit_bytes' => (int) $b->storage_limit_bytes,
                'contact_phone' => $b->contact_phone,
                'contact_email' => $b->contact_email,
                'population' => $b->population,
                'created_at' => $b->created_at->toISOString(),
            ];
        });

        return response()->json($barangays);
    }

    /**
     * Create a new barangay with initial kapitan account.
     *
     * POST /api/v1/admin/barangays
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            // Barangay info
            'name' => ['required', 'string', 'max:255'],
            'psgc_code' => ['required', 'string', 'max:10', Rule::unique('barangays', 'psgc_code')],
            'municipality_psgc' => ['nullable', 'string', 'max:10'],
            'province_psgc' => ['nullable', 'string', 'max:10'],
            'region_psgc' => ['nullable', 'string', 'max:10'],
            'full_address' => ['nullable', 'string', 'max:1000'],
            'city_municipality' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'zip_code' => ['nullable', 'string', 'max:10'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'population' => ['nullable', 'integer', 'min:0'],
            'land_area_hectares' => ['nullable', 'numeric', 'min:0'],

            // Map center coordinates (PH bounding box: lat 4-21, lng 116-127)
            'latitude' => ['nullable', 'numeric', 'between:4,21'],
            'longitude' => ['nullable', 'numeric', 'between:116,127'],

            // Subscription (Baybayin tier names: munti=small, gitna=medium, malaki=large)
            'subscription_plan' => ['required', 'string', Rule::in(['munti', 'gitna', 'malaki'])],

            // Initial credits
            'sms_credit_balance' => ['nullable', 'numeric', 'min:0'],
            'call_credit_balance' => ['nullable', 'numeric', 'min:0'],
            'map_credit_balance' => ['nullable', 'numeric', 'min:0'],
            'ai_credit_balance' => ['nullable', 'numeric', 'min:0'],

            // Initial user account (username + password auto-generated)
            'kapitan.first_name' => ['required', 'string', 'max:100'],
            'kapitan.last_name' => ['required', 'string', 'max:100'],
            'kapitan.middle_name' => ['nullable', 'string', 'max:100'],
            'kapitan.extension_name' => ['nullable', 'string', 'max:10'],
            'kapitan.phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
            'kapitan.role' => ['nullable', 'string', Rule::in(['kapitan', 'secretary', 'treasurer', 'councilor'])],
        ]);

        try {
            $result = DB::transaction(function () use ($validated, $request) {
                // All subscriptions renew December 31 annually
                $subscriptionExpiry = now()->endOfYear();

                // Default credits by tier (Baybayin names)
                $defaultCredits = match ($validated['subscription_plan']) {
                    'munti' => ['sms' => 500, 'call' => 30, 'map' => 100, 'ai' => 200],
                    'gitna' => ['sms' => 2500, 'call' => 180, 'map' => 500, 'ai' => 1200],
                    'malaki' => ['sms' => 10000, 'call' => 500, 'map' => 2000, 'ai' => 5000],
                    default => ['sms' => 500, 'call' => 30, 'map' => 100, 'ai' => 200],
                };

                // Storage limits: munti=5GB, gitna=15GB, malaki=50GB
                $storageLimit = match ($validated['subscription_plan']) {
                    'munti' => 5 * 1024 * 1024 * 1024,   // 5 GB
                    'gitna' => 15 * 1024 * 1024 * 1024,   // 15 GB
                    'malaki' => 50 * 1024 * 1024 * 1024,  // 50 GB
                    default => 5 * 1024 * 1024 * 1024,
                };

                // Create barangay
                $barangay = Barangay::create([
                    'name' => $validated['name'],
                    'psgc_code' => $validated['psgc_code'],
                    'municipality_psgc' => $validated['municipality_psgc'] ?? null,
                    'province_psgc' => $validated['province_psgc'] ?? null,
                    'region_psgc' => $validated['region_psgc'] ?? null,
                    'full_address' => $validated['full_address'] ?? null,
                    'city_municipality' => $validated['city_municipality'] ?? null,
                    'province' => $validated['province'] ?? null,
                    'zip_code' => $validated['zip_code'] ?? null,
                    'contact_phone' => $validated['contact_phone'] ?? null,
                    'contact_email' => $validated['contact_email'] ?? null,
                    'population' => $validated['population'] ?? 0,
                    'land_area_hectares' => $validated['land_area_hectares'] ?? 0,
                    'latitude' => $validated['latitude'] ?? null,
                    'longitude' => $validated['longitude'] ?? null,
                    'status' => BarangayStatus::Active,
                    'subscription_plan' => $validated['subscription_plan'],
                    'subscription_expires_at' => $subscriptionExpiry,
                    'sms_credit_balance' => $validated['sms_credit_balance'] ?? $defaultCredits['sms'],
                    'call_credit_balance' => $validated['call_credit_balance'] ?? $defaultCredits['call'],
                    'map_credit_balance' => $validated['map_credit_balance'] ?? $defaultCredits['map'],
                    'ai_credit_balance' => $validated['ai_credit_balance'] ?? $defaultCredits['ai'],
                    'storage_used_bytes' => 0,
                    'storage_limit_bytes' => $storageLimit,
                    'settings' => [],
                    'created_by' => $request->user()->id,
                ]);

                // Auto-generate username and password
                $kapitanData = $validated['kapitan'];
                $role = $kapitanData['role'] ?? 'kapitan';
                $baseUsername = strtolower(substr($role, 0, 3)).'_'.Str::slug($validated['name'], '_');
                $username = $baseUsername;
                $suffix = 1;
                while (User::where('username', $username)->exists()) {
                    $username = $baseUsername.'_'.$suffix;
                    $suffix++;
                }
                $plainPassword = Str::random(10);

                // Create initial user account
                $kapitan = User::create([
                    'barangay_id' => $barangay->id,
                    'username' => $username,
                    'email' => null,
                    'password' => $plainPassword, // Cast handles hashing
                    'first_name' => $kapitanData['first_name'],
                    'last_name' => $kapitanData['last_name'],
                    'middle_name' => $kapitanData['middle_name'] ?? null,
                    'extension_name' => $kapitanData['extension_name'] ?? null,
                    'phone' => $kapitanData['phone'],
                    'status' => 'active',
                ]);
                // Explicitly set to false (excluded from $fillable for security)
                $kapitan->is_super_admin = false;
                $kapitan->save();

                // Assign role (Spatie Permission) -- defaults to kapitan
                $role = $kapitanData['role'] ?? 'kapitan';
                $kapitan->assignRole($role);

                // Clone system-default document templates for the new barangay
                $systemTemplates = DocumentTemplate::whereNull('barangay_id')
                    ->where('status', 'published')
                    ->get();

                $clonedCount = 0;
                foreach ($systemTemplates as $template) {
                    DocumentTemplate::create([
                        'barangay_id' => $barangay->id,
                        'name' => $template->name,
                        'category' => $template->category,
                        'constituent_type' => $template->constituent_type,
                        'content' => $template->content,
                        'title' => $template->title,
                        'salutation' => $template->salutation,
                        'merge_fields' => $template->merge_fields,
                        'custom_inputs' => $template->custom_inputs,
                        'custom_tables' => $template->custom_tables,
                        'approval_config' => $template->approval_config,
                        'settings' => $template->settings,
                        'status' => 'published',
                        'sort_order' => $template->sort_order,
                        'created_by' => $request->user()->id,
                    ]);
                    $clonedCount++;
                }

                return [
                    'barangay' => $barangay,
                    'kapitan' => $kapitan,
                    'templates_count' => $clonedCount,
                    'plain_password' => $plainPassword,
                ];
            });

            // Send welcome SMS with credentials (outside transaction -- non-blocking)
            $smsSent = false;
            $kapitanPhone = $validated['kapitan']['phone'];
            try {
                $smsService = app(SmsService::class);
                $kapitanName = $result['kapitan']->last_name;
                $generatedUsername = $result['kapitan']->username;
                $generatedPassword = $result['plain_password'];
                $message = "[Kapitan] Magandang araw, Kapitan {$kapitanName}! Salamat sa pagsali sa aming sistema. Narito ang iyong credentials para makapagsimula:\n\nUsername: {$generatedUsername}\nPassword: {$generatedPassword}\n\nNandito kami para tulungan kayo na mas maayos na makapaglingkod sa inyong komunidad.";
                $smsSent = $smsService->send(
                    $kapitanPhone,
                    $message,
                    $result['barangay'],
                    'onboarding',
                    $result['kapitan']->id,
                );
            } catch (\Throwable $e) {
                Log::warning('Onboarding SMS failed', [
                    'barangay' => $result['barangay']->name,
                    'phone' => substr($kapitanPhone, 0, 4).'****',
                    'error' => $e->getMessage(),
                ]);
            }

            // Boundary auto-fetch status (BarangayObserver fired synchronously during create).
            // If $brgy->boundary_geojson is set, OSM has the polygon and we likely
            // also auto-derived the centroid into latitude/longitude. If null, the
            // admin can fetch manually from Settings → Boundary.
            $brgy = $result['barangay'];
            $brgy->refresh();

            return response()->json([
                'message' => 'Barangay onboarded successfully.',
                'data' => [
                    'barangay' => [
                        'id' => $brgy->id,
                        'name' => $brgy->name,
                        'psgc_code' => $brgy->psgc_code,
                        'status' => $brgy->status->value,
                        'subscription_plan' => $brgy->subscription_plan,
                        'latitude' => $brgy->latitude !== null ? (float) $brgy->latitude : null,
                        'longitude' => $brgy->longitude !== null ? (float) $brgy->longitude : null,
                    ],
                    'boundary' => [
                        'fetched' => $brgy->boundary_geojson !== null,
                        'source' => $brgy->boundary_source,
                        'fetched_at' => $brgy->boundary_fetched_at?->toIso8601String(),
                        'auto_centered' => $brgy->boundary_geojson !== null && $brgy->latitude !== null && empty($validated['latitude']),
                    ],
                    'initial_user' => [
                        'id' => $result['kapitan']->id,
                        'username' => $result['kapitan']->username,
                        'password' => $result['plain_password'],
                        'email' => $result['kapitan']->email,
                        'phone' => $result['kapitan']->phone,
                        'full_name' => $result['kapitan']->full_name,
                        'role' => $result['kapitan']->roles->first()?->name ?? ($validated['kapitan']['role'] ?? 'kapitan'),
                    ],
                    'templates_count' => $result['templates_count'],
                    'sms_sent' => $smsSent,
                ],
            ], 201);

        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to onboard barangay.',
            ], 500);
        }
    }

    /**
     * Get barangay details with full stats, users, and settings.
     *
     * GET /api/v1/admin/barangays/{barangay}
     */
    public function show(Barangay $barangay): JsonResponse
    {
        $barangay->loadCount(['users', 'residents']);
        $barangay->load(['users' => function ($q) {
            $q->select('id', 'barangay_id', 'username', 'email', 'phone', 'first_name', 'middle_name', 'last_name', 'extension_name', 'photo_url', 'status', 'last_login_at', 'created_at')
                ->with('roles:id,name')
                ->orderByDesc('created_at');
        }]);

        return response()->json([
            'data' => [
                'id' => $barangay->id,
                'name' => $barangay->name,
                'psgc_code' => $barangay->psgc_code,
                'full_address' => $barangay->full_address,
                'municipality_psgc' => $barangay->municipality_psgc,
                'province_psgc' => $barangay->province_psgc,
                'region_psgc' => $barangay->region_psgc,
                'logo_url' => $barangay->logo_url,
                'seal_url' => $barangay->seal_url,
                'contact_phone' => $barangay->contact_phone,
                'contact_email' => $barangay->contact_email,
                'website_url' => $barangay->website_url,
                'latitude' => $barangay->latitude,
                'longitude' => $barangay->longitude,
                'population' => $barangay->population,
                'land_area_hectares' => (float) $barangay->land_area_hectares,
                'officials_term' => $barangay->officials_term,

                // Status & subscription
                'status' => $barangay->status->value,
                'subscription_plan' => $barangay->subscription_plan,
                'subscription_expires_at' => $barangay->subscription_expires_at?->toISOString(),

                // Credits
                'sms_credit_balance' => (float) $barangay->sms_credit_balance,
                'call_credit_balance' => (float) $barangay->call_credit_balance,
                'map_credit_balance' => (float) $barangay->map_credit_balance,
                'ai_credit_balance' => (float) $barangay->ai_credit_balance,

                // Storage
                'storage_used_bytes' => (int) $barangay->storage_used_bytes,
                'storage_limit_bytes' => (int) $barangay->storage_limit_bytes,

                // Stats
                'users_count' => $barangay->users_count,
                'residents_count' => $barangay->residents_count,

                // Settings (JSONB)
                'settings' => $barangay->settings ?? [],

                // User accounts
                'users' => $barangay->users->map(function (User $user) {
                    return [
                        'id' => $user->id,
                        'username' => $user->username,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'first_name' => $user->first_name,
                        'middle_name' => $user->middle_name,
                        'last_name' => $user->last_name,
                        'extension_name' => $user->extension_name,
                        'full_name' => $user->full_name,
                        'photo_url' => $user->photo_url,
                        'role' => $user->roles->first()?->name ?? 'unknown',
                        'status' => $user->status,
                        'last_login_at' => $user->last_login_at?->toISOString(),
                        'created_at' => $user->created_at->toISOString(),
                    ];
                }),

                // Timestamps
                'created_at' => $barangay->created_at->toISOString(),
                'updated_at' => $barangay->updated_at->toISOString(),
            ],
        ]);
    }

    /**
     * Update barangay info, credits, subscription, or settings.
     *
     * PATCH /api/v1/admin/barangays/{barangay}
     */
    public function update(Request $request, Barangay $barangay): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'full_address' => ['nullable', 'string', 'max:1000'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'population' => ['nullable', 'integer', 'min:0'],
            'land_area_hectares' => ['nullable', 'numeric', 'min:0'],
            'logo_url' => ['nullable', 'string', 'max:500'],
            'seal_url' => ['nullable', 'string', 'max:500'],
            'status' => ['sometimes', 'string', Rule::in(['active', 'suspended', 'deactivated'])],
            'subscription_plan' => ['sometimes', 'string', Rule::in(['munti', 'gitna', 'malaki'])],
            'subscription_expires_at' => ['nullable', 'date'],
            'sms_credit_balance' => ['nullable', 'numeric', 'min:0'],
            'call_credit_balance' => ['nullable', 'numeric', 'min:0'],
            'map_credit_balance' => ['nullable', 'numeric', 'min:0'],
            'ai_credit_balance' => ['nullable', 'numeric', 'min:0'],
            'settings' => ['nullable', 'array'],
        ]);

        $validated['updated_by'] = $request->user()->id;

        $barangay->update($validated);

        return response()->json([
            'message' => 'Barangay updated.',
            'data' => [
                'id' => $barangay->id,
                'name' => $barangay->name,
                'status' => $barangay->status->value,
            ],
        ]);
    }

    /**
     * Soft-delete (deactivate) a barangay.
     *
     * DELETE /api/v1/admin/barangays/{barangay}
     */
    public function destroy(Request $request, Barangay $barangay): JsonResponse
    {
        $barangay->update([
            'status' => BarangayStatus::Deactivated,
            'deleted_by' => $request->user()->id,
        ]);

        $barangay->delete();

        return response()->json([
            'message' => 'Barangay deactivated.',
        ]);
    }

    /**
     * Recalculate storage_used_bytes from the files table.
     *
     * POST /api/v1/admin/barangays/{barangay}/recalculate-storage
     */
    public function recalculateStorage(Barangay $barangay): JsonResponse
    {
        $oldBytes = $barangay->storage_used_bytes;
        $newBytes = $barangay->recalculateStorage();

        return response()->json([
            'message' => 'Storage recalculated.',
            'data' => [
                'old_bytes' => $oldBytes,
                'new_bytes' => $newBytes,
                'barangay_id' => $barangay->id,
                'barangay_name' => $barangay->name,
            ],
        ]);
    }

    /**
     * Recalculate storage for ALL barangays.
     *
     * POST /api/v1/admin/barangays/recalculate-storage-all
     */
    public function recalculateStorageAll(): JsonResponse
    {
        $results = [];
        $barangays = Barangay::all();

        foreach ($barangays as $barangay) {
            $oldBytes = $barangay->storage_used_bytes;
            $newBytes = $barangay->recalculateStorage();
            $results[] = [
                'id' => $barangay->id,
                'name' => $barangay->name,
                'old_bytes' => $oldBytes,
                'new_bytes' => $newBytes,
            ];
        }

        return response()->json([
            'message' => 'Storage recalculated for all barangays.',
            'data' => $results,
        ]);
    }

    /**
     * Comprehensive stats for a single barangay — all modules.
     *
     * GET /api/v1/admin/barangays/{barangay}/stats
     */
    public function stats(Barangay $barangay): JsonResponse
    {
        $id = $barangay->id;

        // ── Core counts ──
        $residents = Resident::where('barangay_id', $id);
        $totalResidents = (clone $residents)->count();
        $activeResidents = (clone $residents)->where('status', 'active')->count();
        $inactiveResidents = (clone $residents)->where('status', 'inactive')->count();
        $deceasedResidents = (clone $residents)->where('status', 'deceased')->count();
        $transferredResidents = (clone $residents)->where('status', 'transferred')->count();

        // Gender distribution
        $genderDistribution = Resident::where('barangay_id', $id)
            ->select('sex', DB::raw('count(*) as count'))
            ->groupBy('sex')
            ->pluck('count', 'sex')
            ->toArray();

        // Age distribution
        $ageGroups = [];
        $ageRanges = ['0-14' => [0, 14], '15-30' => [15, 30], '31-45' => [31, 45], '46-59' => [46, 59], '60+' => [60, 200]];
        foreach ($ageRanges as $label => [$min, $max]) {
            $ageGroups[$label] = Resident::where('barangay_id', $id)
                ->whereNotNull('date_of_birth')
                ->whereRaw('EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN ? AND ?', [$min, $max])
                ->count();
        }

        // Voter stats
        $totalVoters = (clone $residents)->where('is_voter', true)->count();
        $residentVoters = (clone $residents)->where('is_resident_voter', true)->count();

        // ── Records ──
        $totalHouseholds = Household::where('barangay_id', $id)->count();
        $totalEstablishments = Establishment::where('barangay_id', $id)->count();
        $totalLotsBuildings = LotBuilding::where('barangay_id', $id)->count();

        // ── Documents ──
        $totalDocumentsIssued = IssuedDocument::where('barangay_id', $id)->count();
        $documentsThisMonth = IssuedDocument::where('barangay_id', $id)
            ->where('created_at', '>=', now()->startOfMonth())->count();
        $totalTemplates = DocumentTemplate::where('barangay_id', $id)->count();

        // ── Judicial ──
        $totalBlotters = BlotterRecord::where('barangay_id', $id)->count();
        $pendingBlotters = BlotterRecord::where('barangay_id', $id)->where('status', 'pending')->count();
        $totalKpCases = KpCase::where('barangay_id', $id)->count();
        $activeKpCases = KpCase::where('barangay_id', $id)
            ->whereNotIn('status', ['settled', 'dismissed', 'elevated'])->count();
        $totalVawcCases = VawcCase::where('barangay_id', $id)->count();

        // ── Officials & Tanod ──
        $totalOfficials = BarangayOfficial::where('barangay_id', $id)->count();
        $totalTanods = Tanod::where('barangay_id', $id)->count();
        $totalIncidentReports = TanodIncidentReport::where('barangay_id', $id)->count();

        // ── Finance ──
        $totalBudgets = Budget::where('barangay_id', $id)->count();
        $totalDisbursements = DisbursementVoucher::where('barangay_id', $id)->count();
        $totalPayments = Payment::where('barangay_id', $id)->count();

        // ── HRIS ──
        $totalEmployees = Employee::where('barangay_id', $id)->count();

        // ── Assets ──
        $totalAssets = Asset::where('barangay_id', $id)->count();
        $totalInventoryItems = InventoryItem::where('barangay_id', $id)->count();

        // ── Disaster ──
        $totalHazardPins = HazardPin::where('barangay_id', $id)->count();
        $totalEvacuations = Evacuation::where('barangay_id', $id)->count();

        // ── Public Portal ──
        $totalComplaints = PublicComplaint::where('barangay_id', $id)->count();

        // ── Storage breakdown by category ──
        $storageByCategory = File::where('barangay_id', $id)
            ->select('category', DB::raw('count(*) as file_count'), DB::raw('COALESCE(sum(size_bytes), 0) as total_bytes'))
            ->groupBy('category')
            ->get()
            ->keyBy('category')
            ->map(fn ($row) => [
                'count' => (int) $row->file_count,
                'bytes' => (int) $row->total_bytes,
            ])
            ->toArray();

        $totalFiles = File::where('barangay_id', $id)->count();
        $totalFileBytes = (int) File::where('barangay_id', $id)->sum('size_bytes');

        // ── Credit usage (SMS transactions) ──
        $smsThisMonth = SmsTransaction::where('barangay_id', $id)
            ->where('created_at', '>=', now()->startOfMonth())
            ->select(
                DB::raw('count(*) as total'),
                DB::raw("count(case when status = 'sent' then 1 end) as sent"),
                DB::raw("count(case when status = 'failed' then 1 end) as failed"),
                DB::raw("COALESCE(sum(case when status = 'sent' then credit_cost else 0 end), 0) as cost"),
            )
            ->first();

        // ── Recent activity (last 10 items) ──
        $recentResidents = Resident::where('barangay_id', $id)
            ->latest()->take(5)->get()
            ->map(fn ($r) => [
                'type' => 'resident',
                'description' => "Registered: {$r->full_name}",
                'status' => $r->status?->value ?? $r->status,
                'created_at' => $r->created_at->toIso8601String(),
            ]);

        $recentDocuments = IssuedDocument::where('barangay_id', $id)
            ->latest()->take(5)->get()
            ->map(fn ($d) => [
                'type' => 'document',
                'description' => "Document #{$d->document_number} issued",
                'status' => $d->status,
                'created_at' => $d->created_at->toIso8601String(),
            ]);

        $recentActivity = $recentResidents->concat($recentDocuments)
            ->sortByDesc('created_at')->take(10)->values();

        // ── Recent sign-ins ──
        $recentSignIns = LoginLog::where('barangay_id', $id)
            ->with('user:id,first_name,last_name')
            ->latest()->take(10)->get()
            ->map(fn ($log) => [
                'user' => $log->user?->full_name,
                'action' => $log->action,
                'device_type' => $log->device_type,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->toIso8601String(),
            ]);

        // ── Registrations trend (last 30 days) ──
        $registrationTrend = Resident::where('barangay_id', $id)
            ->where('created_at', '>=', now()->subDays(30))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('count', 'date')
            ->toArray();

        return response()->json([
            'data' => [
                'residents' => [
                    'total' => $totalResidents,
                    'active' => $activeResidents,
                    'inactive' => $inactiveResidents,
                    'deceased' => $deceasedResidents,
                    'transferred' => $transferredResidents,
                    'gender_distribution' => $genderDistribution,
                    'age_groups' => $ageGroups,
                    'voters' => $totalVoters,
                    'resident_voters' => $residentVoters,
                    'recent_7d' => Resident::where('barangay_id', $id)
                        ->where('created_at', '>=', now()->subDays(7))->count(),
                    'registration_trend' => $registrationTrend,
                ],
                'records' => [
                    'households' => $totalHouseholds,
                    'establishments' => $totalEstablishments,
                    'lots_buildings' => $totalLotsBuildings,
                ],
                'documents' => [
                    'total_issued' => $totalDocumentsIssued,
                    'this_month' => $documentsThisMonth,
                    'templates' => $totalTemplates,
                ],
                'judicial' => [
                    'blotters' => $totalBlotters,
                    'pending_blotters' => $pendingBlotters,
                    'kp_cases' => $totalKpCases,
                    'active_kp_cases' => $activeKpCases,
                    'vawc_cases' => $totalVawcCases,
                ],
                'officials' => [
                    'total' => $totalOfficials,
                    'tanods' => $totalTanods,
                    'incident_reports' => $totalIncidentReports,
                ],
                'finance' => [
                    'budgets' => $totalBudgets,
                    'disbursements' => $totalDisbursements,
                    'payments' => $totalPayments,
                ],
                'hris' => [
                    'employees' => $totalEmployees,
                ],
                'assets' => [
                    'total_assets' => $totalAssets,
                    'inventory_items' => $totalInventoryItems,
                ],
                'disaster' => [
                    'hazard_pins' => $totalHazardPins,
                    'evacuations' => $totalEvacuations,
                ],
                'public_portal' => [
                    'complaints' => $totalComplaints,
                ],
                'storage' => [
                    'used_bytes' => (int) $barangay->storage_used_bytes,
                    'limit_bytes' => (int) $barangay->storage_limit_bytes,
                    'total_files' => $totalFiles,
                    'total_file_bytes' => $totalFileBytes,
                    'by_category' => $storageByCategory,
                ],
                'credits' => [
                    'sms_balance' => (float) $barangay->sms_credit_balance,
                    'ai_balance' => (float) $barangay->ai_credit_balance,
                    'call_balance' => (float) $barangay->call_credit_balance,
                    'map_balance' => (float) $barangay->map_credit_balance,
                    'sms_this_month' => [
                        'total' => (int) $smsThisMonth->total,
                        'sent' => (int) $smsThisMonth->sent,
                        'failed' => (int) $smsThisMonth->failed,
                        'cost' => (float) $smsThisMonth->cost,
                    ],
                ],
                'recent_activity' => $recentActivity,
                'recent_sign_ins' => $recentSignIns,
            ],
        ]);
    }

    // ── User Account Management ──

    /**
     * Suspend a user account within a barangay.
     *
     * POST /api/v1/admin/barangays/{barangay}/users/{user}/suspend
     */
    public function suspendUser(Request $request, Barangay $barangay, User $user): JsonResponse
    {
        if ($user->barangay_id !== $barangay->id) {
            return response()->json(['message' => 'User does not belong to this barangay.'], 403);
        }

        $user->update([
            'status' => 'suspended',
            'updated_by' => $request->user()->id,
        ]);

        // Revoke all tokens so user is immediately logged out
        $user->tokens()->delete();

        Log::info('User suspended by admin', [
            'user_id' => $user->id,
            'username' => $user->username,
            'barangay_id' => $barangay->id,
            'admin_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => "User {$user->username} suspended.",
            'data' => ['id' => $user->id, 'username' => $user->username, 'status' => 'suspended'],
        ]);
    }

    /**
     * Activate a user account within a barangay.
     *
     * POST /api/v1/admin/barangays/{barangay}/users/{user}/activate
     */
    public function activateUser(Request $request, Barangay $barangay, User $user): JsonResponse
    {
        if ($user->barangay_id !== $barangay->id) {
            return response()->json(['message' => 'User does not belong to this barangay.'], 403);
        }

        $user->update([
            'status' => 'active',
            'updated_by' => $request->user()->id,
        ]);

        Log::info('User activated by admin', [
            'user_id' => $user->id,
            'username' => $user->username,
            'barangay_id' => $barangay->id,
            'admin_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => "User {$user->username} activated.",
            'data' => ['id' => $user->id, 'username' => $user->username, 'status' => 'active'],
        ]);
    }

    /**
     * Reset a user's password from admin side.
     * Generates a new random password and optionally sends via SMS.
     *
     * POST /api/v1/admin/barangays/{barangay}/users/{user}/reset-password
     */
    public function resetUserPassword(Request $request, Barangay $barangay, User $user): JsonResponse
    {
        if ($user->barangay_id !== $barangay->id) {
            return response()->json(['message' => 'User does not belong to this barangay.'], 403);
        }

        $newPassword = Str::random(10);
        $user->update([
            'password' => Hash::make($newPassword),
            'updated_by' => $request->user()->id,
        ]);

        // Revoke tokens so user must re-login
        $user->tokens()->delete();

        // Send new password via SMS if user has phone
        $smsSent = false;
        if ($user->phone) {
            try {
                $sms = app(SmsService::class);
                $smsSent = $sms->send(
                    $user->phone,
                    "[Kapitan] Your password has been reset by admin.\nNew password: {$newPassword}\nLogin: https://kapitan.ph\nChange your password after login.",
                    $barangay,
                    'admin_password_reset',
                    $user->id,
                );
            } catch (\Throwable $e) {
                Log::warning('Admin password reset SMS failed', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('User password reset by admin', [
            'user_id' => $user->id,
            'username' => $user->username,
            'barangay_id' => $barangay->id,
            'admin_id' => $request->user()->id,
            'sms_sent' => $smsSent,
        ]);

        return response()->json([
            'message' => "Password reset for {$user->username}.".($smsSent ? ' New password sent via SMS.' : ''),
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'new_password' => $newPassword,
                'sms_sent' => $smsSent,
            ],
        ]);
    }

    /**
     * Update user details from admin side.
     *
     * PATCH /api/v1/admin/barangays/{barangay}/users/{user}
     */
    public function updateUser(Request $request, Barangay $barangay, User $user): JsonResponse
    {
        if ($user->barangay_id !== $barangay->id) {
            return response()->json(['message' => 'User does not belong to this barangay.'], 403);
        }

        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name' => ['sometimes', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'extension_name' => ['nullable', 'string', 'max:10'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['sometimes', 'string', Rule::in(['kapitan', 'secretary', 'treasurer', 'councilor', 'staff', 'health_worker', 'sk_chairperson'])],
        ]);

        // Update role separately via Spatie
        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
            unset($validated['role']);
        }

        if (! empty($validated)) {
            $validated['updated_by'] = $request->user()->id;
            $user->update($validated);
        }

        return response()->json([
            'message' => "User {$user->username} updated.",
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'full_name' => $user->fresh()->full_name,
                'role' => $user->roles->first()?->name ?? 'unknown',
                'status' => $user->status,
            ],
        ]);
    }

    /**
     * List residents for a barangay (paginated, for admin view).
     *
     * GET /api/v1/admin/barangays/{barangay}/residents
     */
    public function residents(Request $request, Barangay $barangay): JsonResponse
    {
        $query = Resident::where('barangay_id', $barangay->id);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'ilike', "%{$search}%")
                    ->orWhere('last_name', 'ilike', "%{$search}%")
                    ->orWhere('middle_name', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        $residents = $query->orderBy('last_name')->orderBy('first_name')->paginate($perPage);

        $residents->getCollection()->transform(function (Resident $r) {
            return [
                'id' => $r->id,
                'first_name' => $r->first_name,
                'middle_name' => $r->middle_name,
                'last_name' => $r->last_name,
                'extension_name' => $r->extension_name,
                'full_name' => $r->full_name,
                'sex' => $r->sex,
                'date_of_birth' => $r->date_of_birth?->format('Y-m-d'),
                'status' => is_object($r->status) ? $r->status->value : $r->status,
                'is_voter' => $r->is_voter,
                'is_resident_voter' => $r->is_resident_voter,
                'purok' => $r->purok,
                'created_at' => $r->created_at->toISOString(),
            ];
        });

        return response()->json($residents);
    }

    /**
     * List files for a barangay (paginated, for admin storage view).
     *
     * GET /api/v1/admin/barangays/{barangay}/files
     */
    public function files(Request $request, Barangay $barangay): JsonResponse
    {
        $query = File::where('barangay_id', $barangay->id);

        if ($category = $request->get('category')) {
            $query->where('category', $category);
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        $files = $query->orderByDesc('created_at')->paginate($perPage);

        $files->getCollection()->transform(function (File $f) {
            return [
                'id' => $f->id,
                'name' => $f->name,
                'original_name' => $f->original_name,
                'category' => $f->category,
                'mime_type' => $f->mime_type,
                'size_bytes' => (int) $f->size_bytes,
                'created_at' => $f->created_at->toISOString(),
            ];
        });

        return response()->json($files);
    }

    /**
     * Subscription stats -- aggregate tier distribution, storage, and credits.
     *
     * GET /api/v1/admin/barangays/stats/subscriptions
     */
    public function subscriptionStats(): JsonResponse
    {
        $barangays = Barangay::query()
            ->withCount(['users', 'residents'])
            ->get();

        $tiers = ['munti' => [], 'gitna' => [], 'malaki' => []];
        $totalStorage = 0;
        $totalStorageLimit = 0;
        $totalSms = 0;
        $totalAi = 0;
        $totalCall = 0;
        $totalMap = 0;
        $expiringSoon = 0; // within 60 days

        foreach ($barangays as $b) {
            $plan = $b->subscription_plan ?? 'munti';
            if (! isset($tiers[$plan])) {
                $tiers[$plan] = [];
            }
            $tiers[$plan][] = [
                'id' => $b->id,
                'name' => $b->name,
                'status' => $b->status->value,
                'users_count' => $b->users_count,
                'residents_count' => $b->residents_count,
                'storage_used_bytes' => (int) $b->storage_used_bytes,
                'storage_limit_bytes' => (int) $b->storage_limit_bytes,
                'subscription_expires_at' => $b->subscription_expires_at?->toISOString(),
            ];

            $totalStorage += (int) $b->storage_used_bytes;
            $totalStorageLimit += (int) $b->storage_limit_bytes;
            $totalSms += (float) $b->sms_credit_balance;
            $totalAi += (float) $b->ai_credit_balance;
            $totalCall += (float) $b->call_credit_balance;
            $totalMap += (float) $b->map_credit_balance;

            if ($b->subscription_expires_at && $b->subscription_expires_at->diffInDays(now()) <= 60) {
                $expiringSoon++;
            }
        }

        return response()->json([
            'data' => [
                'total_barangays' => $barangays->count(),
                'active_barangays' => $barangays->where('status', BarangayStatus::Active)->count(),
                'tier_distribution' => [
                    'munti' => count($tiers['munti']),
                    'gitna' => count($tiers['gitna']),
                    'malaki' => count($tiers['malaki']),
                ],
                'tier_details' => $tiers,
                'storage' => [
                    'total_used_bytes' => $totalStorage,
                    'total_limit_bytes' => $totalStorageLimit,
                ],
                'credits' => [
                    'total_sms' => $totalSms,
                    'total_ai' => $totalAi,
                    'total_call' => $totalCall,
                    'total_map' => $totalMap,
                ],
                'expiring_soon' => $expiringSoon,
            ],
        ]);
    }
}
