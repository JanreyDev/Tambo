<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Admin\Barangay;
use App\Models\Platform\SmsTransaction;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BarangaySettingsController extends Controller
{
    public function __construct(
        private readonly FileUploadService $uploadService,
    ) {}

    /**
     * GET /api/v1/settings
     * Returns the authenticated user's barangay settings.
     */
    public function show(Request $request): JsonResponse
    {
        $barangay = Barangay::findOrFail($request->user()->barangay_id);

        return response()->json([
            'data' => $this->formatBarangay($barangay),
        ]);
    }

    /**
     * PATCH /api/v1/settings
     * Update barangay settings. Only kapitan or secretary.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasAnyRole(['kapitan', 'secretary', 'super_admin'])) {
            return response()->json(['message' => 'Only kapitan or secretary can update settings.'], 403);
        }

        $validated = $request->validate([
            'zip_code' => ['nullable', 'string', 'max:10'],
            'motto' => ['nullable', 'string', 'max:500'],
            'office_hours' => ['nullable', 'string', 'max:255'],
            'established_year' => ['nullable', 'integer', 'min:1800', 'max:'.date('Y')],
            'captain_name' => ['nullable', 'string', 'max:200'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'website_url' => ['nullable', 'url', 'max:500'],
            'full_address' => ['nullable', 'string', 'max:1000'],
            'document_header_text' => ['nullable', 'string', 'max:2000'],
            'document_footer_text' => ['nullable', 'string', 'max:2000'],
            'sms_sender_name' => ['nullable', 'string', 'max:11', 'regex:/^[A-Za-z0-9\s]*$/'],
            'notification_preferences' => ['nullable', 'array'],
            'notification_preferences.sms_new_resident' => ['nullable', 'boolean'],
            'notification_preferences.sms_certificate_issued' => ['nullable', 'boolean'],
            'notification_preferences.email_alerts' => ['nullable', 'boolean'],
            'notification_preferences.daily_summary' => ['nullable', 'boolean'],
            'setup_complete' => ['nullable', 'boolean'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            // Settings JSONB — operational config
            'settings' => ['nullable', 'array'],
            'settings.certificate_validity_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'settings.clearance_fee' => ['nullable', 'numeric', 'min:0', 'max:10000'],
            'settings.indigency_fee' => ['nullable', 'numeric', 'min:0', 'max:10000'],
            'settings.id_fee' => ['nullable', 'numeric', 'min:0', 'max:10000'],
            'settings.cedula_fee' => ['nullable', 'numeric', 'min:0', 'max:10000'],
            'settings.default_signatory_name' => ['nullable', 'string', 'max:200'],
            'settings.default_signatory_title' => ['nullable', 'string', 'max:200'],
        ]);

        // Sanitize + force UPPERCASE on all text fields
        $uppercaseFields = [
            'captain_name', 'motto', 'office_hours', 'full_address',
            'document_header_text', 'document_footer_text', 'sms_sender_name',
            'zip_code', 'contact_phone', 'contact_email',
        ];
        foreach ($uppercaseFields as $field) {
            if (isset($validated[$field]) && is_string($validated[$field])) {
                $validated[$field] = mb_strtoupper(strip_tags($validated[$field]));
            }
        }

        // Whitelist + sanitize settings JSONB keys
        if (isset($validated['settings'])) {
            $allowedSettingsKeys = [
                'certificate_validity_days', 'clearance_fee', 'indigency_fee',
                'id_fee', 'cedula_fee', 'default_signatory_name', 'default_signatory_title',
            ];
            $validated['settings'] = array_intersect_key(
                $validated['settings'],
                array_flip($allowedSettingsKeys),
            );
            // Force uppercase on text settings
            foreach (['default_signatory_name', 'default_signatory_title'] as $f) {
                if (isset($validated['settings'][$f]) && is_string($validated['settings'][$f])) {
                    $validated['settings'][$f] = mb_strtoupper(strip_tags($validated['settings'][$f]));
                }
            }
            // Merge with existing settings to preserve AI config and other keys
            $existing = Barangay::findOrFail($request->user()->barangay_id)->settings ?? [];
            $validated['settings'] = array_merge($existing, $validated['settings']);
        }

        // Whitelist notification_preferences keys — reject unknown keys
        if (isset($validated['notification_preferences'])) {
            $allowedKeys = ['sms_new_resident', 'sms_certificate_issued', 'email_alerts', 'daily_summary'];
            $validated['notification_preferences'] = array_intersect_key(
                $validated['notification_preferences'],
                array_flip($allowedKeys),
            );
        }

        $barangay = Barangay::findOrFail($user->barangay_id);
        $barangay->update($validated);

        Log::info('Barangay settings updated', [
            'barangay_id' => $barangay->id,
            'updated_by' => $user->id,
            'fields' => array_keys($validated),
        ]);

        return response()->json([
            'message' => 'Settings updated successfully.',
            'data' => $this->formatBarangay($barangay->fresh()),
        ]);
    }

    /**
     * POST /api/v1/settings/logo
     * Upload barangay logo.
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        return $this->handleImageUpload($request, 'logo', 'logo_url');
    }

    /**
     * POST /api/v1/settings/seal
     * Upload barangay official seal.
     */
    public function uploadSeal(Request $request): JsonResponse
    {
        return $this->handleImageUpload($request, 'seal', 'seal_url');
    }

    /**
     * GET /api/v1/settings/usage
     * Returns barangay resource usage and PrimeX billing data.
     */
    public function usage(Request $request): JsonResponse
    {
        $barangay = Barangay::findOrFail($request->user()->barangay_id);

        // SMS usage stats
        $smsStats = SmsTransaction::where('barangay_id', $barangay->id)
            ->selectRaw("
                COUNT(*) as total_sent,
                COALESCE(SUM(credit_cost), 0) as total_credits_used,
                COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as sent_this_month,
                COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN credit_cost ELSE 0 END), 0) as credits_this_month
            ")
            ->first();

        // File/storage stats
        $fileCount = DB::table('files')
            ->where('barangay_id', $barangay->id)
            ->whereNull('deleted_at')
            ->count();

        // Resident count
        $residentCount = DB::table('residents')
            ->where('barangay_id', $barangay->id)
            ->whereNull('deleted_at')
            ->count();

        // Active users count
        $activeUsers = DB::table('users')
            ->where('barangay_id', $barangay->id)
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->count();

        return response()->json([
            'data' => [
                'subscription' => [
                    'plan' => $barangay->subscription_plan ?? 'Starter',
                    'status' => $barangay->status->value ?? $barangay->status,
                    'expires_at' => $barangay->subscription_expires_at,
                ],
                'sms' => [
                    'balance' => (float) $barangay->sms_credit_balance,
                    'total_sent' => (int) $smsStats->total_sent,
                    'total_credits_used' => round((float) $smsStats->total_credits_used, 2),
                    'sent_this_month' => (int) $smsStats->sent_this_month,
                    'credits_this_month' => round((float) $smsStats->credits_this_month, 2),
                ],
                'ai' => [
                    'balance' => (float) $barangay->ai_credit_balance,
                ],
                'storage' => [
                    'used_bytes' => (int) $barangay->storage_used_bytes,
                    'limit_bytes' => (int) $barangay->storage_limit_bytes,
                    'file_count' => $fileCount,
                ],
                'data' => [
                    'residents' => $residentCount,
                    'active_users' => $activeUsers,
                    'population' => $barangay->population,
                ],
            ],
        ]);
    }

    private function handleImageUpload(Request $request, string $category, string $urlField): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasAnyRole(['kapitan', 'secretary', 'super_admin'])) {
            return response()->json(['message' => 'Only kapitan or secretary can upload files.'], 403);
        }

        $request->validate([
            'file' => ['required', 'file', 'mimes:jpeg,png,webp,svg', 'max:5120'],
        ]);

        $barangay = Barangay::findOrFail($user->barangay_id);
        $path = "bcmp/{$barangay->id}/{$category}s";

        try {
            $file = $this->uploadService->upload(
                file: $request->file('file'),
                category: $category,
                path: $path,
                uploadedBy: $user->id,
                barangayId: $barangay->id,
                isPublic: true,
            );

            $url = $this->uploadService->getPublicUrl($file);
            $barangay->update([$urlField => $url]);

            Log::info("Barangay {$category} uploaded", [
                'barangay_id' => $barangay->id,
                'file_id' => $file->id,
                'uploaded_by' => $user->id,
            ]);

            return response()->json([
                'message' => ucfirst($category).' uploaded successfully.',
                'url' => $url,
                'file_id' => $file->id,
            ]);
        } catch (\RuntimeException $e) {
            if (str_contains($e->getMessage(), 'Storage limit exceeded')) {
                return response()->json([
                    'message' => 'Storage limit exceeded. Contact your administrator.',
                ], 422);
            }

            Log::error("Barangay {$category} upload failed", [
                'barangay_id' => $barangay->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Upload failed. Please try again.',
            ], 500);
        }
    }

    private function formatBarangay(Barangay $barangay): array
    {
        return [
            'id' => $barangay->id,
            'name' => $barangay->name,
            'psgc_code' => $barangay->psgc_code,
            'city_municipality' => $barangay->city_municipality,
            'province' => $barangay->province,
            'zip_code' => $barangay->zip_code,
            'full_address' => $barangay->full_address,
            'logo_url' => $barangay->logo_url,
            'seal_url' => $barangay->seal_url,
            'contact_phone' => $barangay->contact_phone,
            'contact_email' => $barangay->contact_email,
            'website_url' => $barangay->website_url,
            'motto' => $barangay->motto,
            'office_hours' => $barangay->office_hours,
            'established_year' => $barangay->established_year,
            'captain_name' => $barangay->captain_name,
            'latitude' => $barangay->latitude ? (float) $barangay->latitude : null,
            'longitude' => $barangay->longitude ? (float) $barangay->longitude : null,
            'boundary_geojson' => $barangay->boundary_geojson,
            'setup_complete' => $barangay->setup_complete,
            'document_header_text' => $barangay->document_header_text,
            'document_footer_text' => $barangay->document_footer_text,
            'sms_sender_name' => $barangay->sms_sender_name,
            'notification_preferences' => $barangay->notification_preferences ?? [
                'sms_new_resident' => false,
                'sms_certificate_issued' => false,
                'email_alerts' => false,
                'daily_summary' => false,
            ],
            'settings' => $barangay->settings ?? [
                'certificate_validity_days' => 180,
                'clearance_fee' => 0,
                'indigency_fee' => 0,
                'id_fee' => 0,
                'cedula_fee' => 0,
                'default_signatory_name' => '',
                'default_signatory_title' => 'PUNONG BARANGAY',
            ],
            'population' => $barangay->population,
            'status' => $barangay->status->value ?? $barangay->status,
        ];
    }
}
