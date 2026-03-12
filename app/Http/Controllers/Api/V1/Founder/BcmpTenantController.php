<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Founder;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use App\Services\BcmpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Proxy controller for BCMP tenant (barangay) management.
 *
 * Forwards requests from the founder dashboard to bcmp-api's
 * admin endpoints. All requests are authenticated via FounderAuth
 * middleware and proxied server-side using the stored BCMP API token.
 *
 * Security: All inputs are whitelisted before forwarding to prevent
 * mass assignment or parameter injection through the proxy layer.
 */
class BcmpTenantController extends Controller
{
    /** Allowed pricing keys that can be updated. */
    private const ALLOWED_PRICING_KEYS = [
        'munti_annual_price',
        'gitna_annual_price',
        'malaki_annual_price',
        'sms_credit_price',
        'ai_credit_price',
        'call_credit_price',
        'map_credit_price',
        'storage_warning_threshold',
    ];

    /** Allowed fields for creating a barangay. */
    private const CREATE_FIELDS = [
        'name',
        'psgc_code',
        'municipality_psgc',
        'province_psgc',
        'region_psgc',
        'city_municipality',
        'province',
        'population',
        'zip_code',
        'subscription_plan',
        'kapitan',
    ];

    /** Allowed fields for updating a barangay. */
    private const UPDATE_FIELDS = [
        'name',
        'full_address',
        'contact_phone',
        'contact_email',
        'population',
        'land_area_hectares',
        'logo_url',
        'seal_url',
        'status',
        'subscription_plan',
        'subscription_expires_at',
        'sms_credit_balance',
        'call_credit_balance',
        'map_credit_balance',
        'ai_credit_balance',
        'settings',
    ];

    public function __construct(
        private readonly BcmpService $bcmp,
    ) {}

    /**
     * List all barangays with stats.
     *
     * GET /api/v1/founder/bcmp/tenants
     */
    public function index(Request $request): JsonResponse
    {
        // Whitelist query params to prevent injection
        $params = $request->only(['page', 'per_page', 'search', 'status', 'sort', 'direction']);

        $result = $this->bcmp->get('api/v1/admin/barangays', $params);

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Create a new barangay with initial kapitan account.
     *
     * POST /api/v1/founder/bcmp/tenants
     */
    public function store(Request $request): JsonResponse
    {
        // Whitelist fields -- only forward allowed create fields
        $data = $request->only(self::CREATE_FIELDS);

        // Sanitize nested initial user data if present
        if (isset($data['kapitan']) && is_array($data['kapitan'])) {
            $data['kapitan'] = collect($data['kapitan'])->only([
                'first_name', 'last_name',
                'middle_name', 'extension_name', 'phone', 'role',
            ])->toArray();
        }

        $result = $this->bcmp->post('api/v1/admin/barangays', $data);

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Get barangay details.
     *
     * GET /api/v1/founder/bcmp/tenants/{id}
     */
    public function show(string $id): JsonResponse
    {
        // Validate UUID format to prevent path traversal
        if (! preg_match('/^[0-9a-f\-]{36}$/i', $id)) {
            return response()->json(['message' => 'Invalid ID format.'], 400);
        }

        $result = $this->bcmp->get("api/v1/admin/barangays/{$id}");

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Update barangay info, credits, subscription, or settings.
     *
     * PATCH /api/v1/founder/bcmp/tenants/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        // Validate UUID format
        if (! preg_match('/^[0-9a-f\-]{36}$/i', $id)) {
            return response()->json(['message' => 'Invalid ID format.'], 400);
        }

        // Whitelist fields -- only forward allowed update fields
        $data = $request->only(self::UPDATE_FIELDS);

        $result = $this->bcmp->patch("api/v1/admin/barangays/{$id}", $data);

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Soft-delete (deactivate) a barangay.
     *
     * DELETE /api/v1/founder/bcmp/tenants/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        // Validate UUID format
        if (! preg_match('/^[0-9a-f\-]{36}$/i', $id)) {
            return response()->json(['message' => 'Invalid ID format.'], 400);
        }

        $result = $this->bcmp->delete("api/v1/admin/barangays/{$id}");

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Get comprehensive stats for a barangay (all modules).
     *
     * GET /api/v1/founder/bcmp/tenants/{id}/stats
     */
    public function stats(string $id): JsonResponse
    {
        if (! preg_match('/^[0-9a-f\-]{36}$/i', $id)) {
            return response()->json(['message' => 'Invalid ID format.'], 400);
        }

        $result = $this->bcmp->get("api/v1/admin/barangays/{$id}/stats");

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Recalculate storage for a specific barangay.
     *
     * POST /api/v1/founder/bcmp/tenants/{id}/recalculate-storage
     */
    public function recalculateStorage(string $id): JsonResponse
    {
        if (! preg_match('/^[0-9a-f\-]{36}$/i', $id)) {
            return response()->json(['message' => 'Invalid ID format.'], 400);
        }

        $result = $this->bcmp->post("api/v1/admin/barangays/{$id}/recalculate-storage");

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Recalculate storage for all barangays.
     *
     * POST /api/v1/founder/bcmp/recalculate-storage-all
     */
    public function recalculateStorageAll(): JsonResponse
    {
        $result = $this->bcmp->post('api/v1/admin/barangays/recalculate-storage-all');

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Get subscription stats (tier distribution, storage, credits, expiring).
     *
     * GET /api/v1/founder/bcmp/subscription-stats
     */
    public function subscriptionStats(): JsonResponse
    {
        $result = $this->bcmp->get('api/v1/admin/barangays-subscription-stats');

        return response()->json($result['data'], $result['status']);
    }

    // ── User Account Management (proxy to bcmp-api admin routes) ──

    /**
     * Suspend a user account.
     *
     * POST /api/v1/founder/bcmp/tenants/{id}/users/{userId}/suspend
     */
    public function suspendUser(string $id, string $userId): JsonResponse
    {
        if (! $this->isValidUuid($id) || ! $this->isValidUuid($userId)) {
            return response()->json(['message' => 'Invalid ID format.'], 400);
        }

        $result = $this->bcmp->post("api/v1/admin/barangays/{$id}/users/{$userId}/suspend");

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Activate a user account.
     *
     * POST /api/v1/founder/bcmp/tenants/{id}/users/{userId}/activate
     */
    public function activateUser(string $id, string $userId): JsonResponse
    {
        if (! $this->isValidUuid($id) || ! $this->isValidUuid($userId)) {
            return response()->json(['message' => 'Invalid ID format.'], 400);
        }

        $result = $this->bcmp->post("api/v1/admin/barangays/{$id}/users/{$userId}/activate");

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Reset a user's password.
     *
     * POST /api/v1/founder/bcmp/tenants/{id}/users/{userId}/reset-password
     */
    public function resetUserPassword(string $id, string $userId): JsonResponse
    {
        if (! $this->isValidUuid($id) || ! $this->isValidUuid($userId)) {
            return response()->json(['message' => 'Invalid ID format.'], 400);
        }

        $result = $this->bcmp->post("api/v1/admin/barangays/{$id}/users/{$userId}/reset-password");

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Update user details.
     *
     * PATCH /api/v1/founder/bcmp/tenants/{id}/users/{userId}
     */
    public function updateUser(Request $request, string $id, string $userId): JsonResponse
    {
        if (! $this->isValidUuid($id) || ! $this->isValidUuid($userId)) {
            return response()->json(['message' => 'Invalid ID format.'], 400);
        }

        $data = $request->only([
            'first_name', 'last_name', 'middle_name', 'extension_name',
            'email', 'phone', 'role',
        ]);

        $result = $this->bcmp->patch("api/v1/admin/barangays/{$id}/users/{$userId}", $data);

        return response()->json($result['data'], $result['status']);
    }

    /**
     * List residents for a barangay.
     *
     * GET /api/v1/founder/bcmp/tenants/{id}/residents
     */
    public function residents(Request $request, string $id): JsonResponse
    {
        if (! $this->isValidUuid($id)) {
            return response()->json(['message' => 'Invalid ID format.'], 400);
        }

        $params = $request->only(['page', 'per_page', 'search', 'status']);
        $result = $this->bcmp->get("api/v1/admin/barangays/{$id}/residents", $params);

        return response()->json($result['data'], $result['status']);
    }

    /**
     * List files for a barangay.
     *
     * GET /api/v1/founder/bcmp/tenants/{id}/files
     */
    public function files(Request $request, string $id): JsonResponse
    {
        if (! $this->isValidUuid($id)) {
            return response()->json(['message' => 'Invalid ID format.'], 400);
        }

        $params = $request->only(['page', 'per_page', 'category']);
        $result = $this->bcmp->get("api/v1/admin/barangays/{$id}/files", $params);

        return response()->json($result['data'], $result['status']);
    }

    // ── Helpers ──

    private function isValidUuid(string $id): bool
    {
        return (bool) preg_match('/^[0-9a-f\-]{36}$/i', $id);
    }

    /**
     * Get BCMP pricing configuration from platform settings.
     *
     * GET /api/v1/founder/bcmp/pricing
     */
    public function pricing(): JsonResponse
    {
        $settings = PlatformSetting::where('group', 'bcmp_pricing')
            ->get()
            ->pluck('value', 'key')
            ->toArray();

        return response()->json([
            'data' => $settings,
        ]);
    }

    /**
     * Update a BCMP pricing setting.
     *
     * PUT /api/v1/founder/bcmp/pricing/{key}
     */
    public function updatePricing(Request $request, string $key): JsonResponse
    {
        // Whitelist allowed pricing keys -- prevent arbitrary setting modification
        if (! in_array($key, self::ALLOWED_PRICING_KEYS, true)) {
            return response()->json(['message' => 'Invalid pricing key.'], 400);
        }

        $setting = PlatformSetting::where('group', 'bcmp_pricing')
            ->where('key', $key)
            ->firstOrFail();

        $validated = $request->validate([
            'value' => ['required', 'numeric', 'min:0', 'max:9999999'],
        ]);

        $setting->update(['value' => (string) $validated['value']]);

        return response()->json([
            'message' => 'Pricing updated successfully.',
            'data' => [
                'key' => $setting->key,
                'value' => $setting->value,
            ],
        ]);
    }
}
