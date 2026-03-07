<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Platform\LoginLog;
use App\Services\FileUploadService;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AccountController extends Controller
{
    public function __construct(
        private readonly FileUploadService $fileUploadService,
        private readonly SmsService $smsService,
    ) {}

    // ════════════════════════════════════════════
    // PROFILE
    // ════════════════════════════════════════════

    /**
     * Get current user's full profile.
     *
     * GET /api/v1/account/profile
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('barangay');

        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'middle_name' => $user->middle_name,
            'extension_name' => $user->extension_name,
            'full_name' => $user->full_name,
            'phone' => $user->phone,
            'photo_url' => $user->photo_url,
            'status' => $user->status,
            'last_login_at' => $user->last_login_at?->toIso8601String(),
            'preferences' => $user->preferences,
            'roles' => $user->getRoleNames(),
            'barangay' => $user->barangay ? [
                'id' => $user->barangay->id,
                'name' => $user->barangay->name,
                'full_address' => $user->barangay->full_address,
            ] : null,
            'created_at' => $user->created_at?->toIso8601String(),
        ]);
    }

    /**
     * Update profile (personal info).
     *
     * PATCH /api/v1/account/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name' => ['sometimes', 'string', 'max:100'],
            'middle_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'extension_name' => ['sometimes', 'nullable', 'string', 'max:10'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,'.$request->user()->id],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
        ]);

        $request->user()->update($validated);

        return response()->json([
            'message' => 'Profile updated.',
        ]);
    }

    /**
     * Update username.
     *
     * PATCH /api/v1/account/username
     */
    public function updateUsername(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:100', 'regex:/^[a-zA-Z0-9_]+$/', 'unique:users,username,'.$request->user()->id],
        ]);

        $request->user()->update($validated);

        return response()->json([
            'message' => 'Username updated.',
        ]);
    }

    // ════════════════════════════════════════════
    // AVATAR
    // ════════════════════════════════════════════

    /**
     * Upload user avatar photo.
     *
     * POST /api/v1/account/avatar
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,gif,webp', 'max:2048'], // 2MB max
        ]);

        $user = $request->user();

        // Set tenant context for RLS (files table is tenant-scoped)
        $this->setTenantContext($user);

        // Delete old avatar file from storage if it exists
        $this->deleteOldAvatar($user);

        $file = $this->fileUploadService->uploadAvatar(
            file: $request->file('avatar'),
            userId: $user->id,
            barangayId: $user->barangay_id,
        );

        $photoUrl = $this->fileUploadService->getPublicUrl($file);

        $user->update(['photo_url' => $photoUrl]);

        return response()->json([
            'message' => 'Avatar uploaded.',
            'photo_url' => $photoUrl,
        ]);
    }

    /**
     * Remove user avatar.
     *
     * DELETE /api/v1/account/avatar
     */
    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        // Set tenant context for RLS
        $this->setTenantContext($user);

        $this->deleteOldAvatar($user);

        $user->update(['photo_url' => null]);

        return response()->json([
            'message' => 'Avatar removed.',
        ]);
    }

    // ════════════════════════════════════════════
    // PASSWORD
    // ════════════════════════════════════════════

    /**
     * Change password.
     *
     * PATCH /api/v1/account/password
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
                'errors' => ['current_password' => ['Current password is incorrect.']],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        // Revoke all other tokens (keep current session)
        $currentTokenId = $user->currentAccessToken()->id;
        $user->tokens()->where('id', '!=', $currentTokenId)->delete();

        return response()->json([
            'message' => 'Password changed. All other sessions have been signed out.',
        ]);
    }

    // ════════════════════════════════════════════
    // SESSIONS
    // ════════════════════════════════════════════

    /**
     * Get active sessions (Sanctum tokens).
     *
     * GET /api/v1/account/sessions
     */
    public function sessions(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = $user->currentAccessToken()->id;

        $tokens = $user->tokens()
            ->orderByDesc('last_used_at')
            ->get()
            ->map(fn ($token) => [
                'id' => $token->id,
                'name' => $token->name,
                'is_current' => $token->id === $currentTokenId,
                'last_used_at' => $token->last_used_at?->toIso8601String(),
                'created_at' => $token->created_at?->toIso8601String(),
                'expires_at' => $token->expires_at?->toIso8601String(),
            ]);

        return response()->json([
            'sessions' => $tokens,
        ]);
    }

    /**
     * Revoke a specific session.
     *
     * DELETE /api/v1/account/sessions/{tokenId}
     */
    public function revokeSession(Request $request, string $tokenId): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = $user->currentAccessToken()->id;

        if ($tokenId === $currentTokenId) {
            return response()->json([
                'message' => 'Cannot revoke current session. Use sign out instead.',
            ], 422);
        }

        $deleted = $user->tokens()->where('id', $tokenId)->delete();

        if (! $deleted) {
            return response()->json([
                'message' => 'Session not found.',
            ], 404);
        }

        return response()->json([
            'message' => 'Session revoked.',
        ]);
    }

    // ════════════════════════════════════════════
    // ACTIVITY
    // ════════════════════════════════════════════

    /**
     * Get user activity log (login history).
     *
     * GET /api/v1/account/activity
     */
    public function activity(Request $request): JsonResponse
    {
        $user = $request->user();

        // Set tenant context for RLS
        $this->setTenantContext($user);

        $logs = LoginLog::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'ip_address' => $log->ip_address,
                'device_type' => $log->device_info['device_type'] ?? 'unknown',
                'browser' => $log->device_info['browser'] ?? 'unknown',
                'created_at' => $log->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'activity' => $logs,
        ]);
    }

    // ════════════════════════════════════════════
    // PHONE VERIFICATION (SMS OTP via TxtBox)
    // ════════════════════════════════════════════

    /**
     * Send OTP to user's phone number for verification.
     *
     * POST /api/v1/account/phone/send-otp
     */
    public function sendPhoneOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:20', 'regex:/^(\+63|0)9\d{9}$/'],
        ]);

        $this->smsService->sendOtp($validated['phone'], 'phone_verification');

        return response()->json([
            'message' => 'Verification code sent.',
        ]);
    }

    /**
     * Verify phone number with OTP code.
     *
     * POST /api/v1/account/phone/verify
     */
    public function verifyPhone(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:20'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        if (! $this->smsService->verifyOtp($validated['phone'], $validated['code'], 'phone_verification')) {
            return response()->json([
                'message' => 'Invalid or expired verification code.',
            ], 422);
        }

        $user = $request->user();
        $preferences = $user->preferences ?? [];
        $preferences['phone_verified'] = true;
        $preferences['phone_verified_at'] = now()->toIso8601String();

        $user->update([
            'phone' => $validated['phone'],
            'preferences' => $preferences,
        ]);

        return response()->json([
            'message' => 'Phone number verified.',
        ]);
    }

    // ════════════════════════════════════════════
    // DATA EXPORT
    // ════════════════════════════════════════════

    /**
     * Request data export (RA 10173 Section 18 right of access).
     *
     * POST /api/v1/account/data-export
     */
    public function requestDataExport(Request $request): JsonResponse
    {
        $user = $request->user();

        // Set tenant context for RLS
        $this->setTenantContext($user);

        $data = [
            'personal_information' => [
                'username' => $user->username,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'middle_name' => $user->middle_name,
                'extension_name' => $user->extension_name,
                'phone' => $user->phone,
                'status' => $user->status,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
            'preferences' => $user->preferences,
            'roles' => $user->getRoleNames(),
            'login_history' => LoginLog::where('user_id', $user->id)
                ->orderByDesc('created_at')
                ->limit(100)
                ->get()
                ->map(fn ($log) => [
                    'action' => $log->action,
                    'ip_address' => $log->ip_address,
                    'device_info' => $log->device_info,
                    'created_at' => $log->created_at?->toIso8601String(),
                ]),
            'active_sessions' => $user->tokens()
                ->get()
                ->map(fn ($token) => [
                    'name' => $token->name,
                    'created_at' => $token->created_at?->toIso8601String(),
                    'last_used_at' => $token->last_used_at?->toIso8601String(),
                    'expires_at' => $token->expires_at?->toIso8601String(),
                ]),
            'exported_at' => now()->toIso8601String(),
        ];

        return response()->json([
            'message' => 'Data export generated.',
            'data' => $data,
        ]);
    }

    // ════════════════════════════════════════════
    // PREFERENCES & NOTIFICATIONS
    // ════════════════════════════════════════════

    /**
     * Update user preferences (accent color, theme, notification settings, etc.).
     *
     * PATCH /api/v1/account/preferences
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'accent_color' => ['sometimes', 'string', 'in:blue,emerald,violet,rose,amber,cyan,orange,indigo'],
            'theme' => ['sometimes', 'string', 'in:light,dark,system'],
            'notifications_email' => ['sometimes', 'boolean'],
            'notifications_sms' => ['sometimes', 'boolean'],
            'notifications_in_app' => ['sometimes', 'boolean'],
            'quiet_hours_enabled' => ['sometimes', 'boolean'],
            'quiet_hours_start' => ['sometimes', 'nullable', 'string'],
            'quiet_hours_end' => ['sometimes', 'nullable', 'string'],
        ]);

        $user = $request->user();
        $preferences = $user->preferences ?? [];

        foreach ($validated as $key => $value) {
            $preferences[$key] = $value;
        }

        $user->update(['preferences' => $preferences]);

        return response()->json([
            'message' => 'Preferences updated.',
            'preferences' => $user->preferences,
        ]);
    }

    // ════════════════════════════════════════════
    // PRIVATE HELPERS
    // ════════════════════════════════════════════

    private function setTenantContext($user): void
    {
        if ($user->barangay_id && DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.current_barangay_id = '{$user->barangay_id}'");
        }
    }

    private function deleteOldAvatar($user): void
    {
        if (! $user->photo_url) {
            return;
        }

        // Find the file record by matching the URL
        $file = \App\Models\Admin\File::where('uploaded_by', $user->id)
            ->where('category', 'avatar')
            ->latest()
            ->first();

        if ($file) {
            $this->fileUploadService->delete($file);
        }
    }
}
