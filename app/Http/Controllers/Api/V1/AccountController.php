<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Platform\AuditLog;
use App\Models\Platform\LoginLog;
use App\Models\User;
use App\Services\FileUploadService;
use App\Services\SmsService;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use PragmaRX\Google2FA\Google2FA;

class AccountController extends Controller
{
    private const COOLDOWN_DAYS = 90;

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
            'username_changed_at' => $user->username_changed_at?->toIso8601String(),
            'password_changed_at' => $user->password_changed_at?->toIso8601String(),
            'two_factor_enabled' => $user->hasTwoFactorEnabled(),
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

    // ════════════════════════════════════════════
    // USERNAME (with cooldown)
    // ════════════════════════════════════════════

    /**
     * Check username availability.
     *
     * POST /api/v1/account/check-username
     */
    public function checkUsername(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:100', 'regex:/^[a-zA-Z0-9_]+$/'],
        ]);

        $exists = User::where('username', $validated['username'])
            ->where('id', '!=', $request->user()->id)
            ->exists();

        return response()->json([
            'available' => ! $exists,
            'message' => $exists ? 'Username is already taken.' : 'Username is available.',
        ]);
    }

    /**
     * Update username (90-day cooldown enforced).
     *
     * PATCH /api/v1/account/username
     */
    public function updateUsername(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:100', 'regex:/^[a-zA-Z0-9_]+$/', 'unique:users,username,'.$request->user()->id],
        ]);

        $user = $request->user();

        // Check 90-day cooldown
        if ($user->username_changed_at) {
            $daysSince = (int) $user->username_changed_at->diffInDays(now());
            if ($daysSince < self::COOLDOWN_DAYS) {
                $daysLeft = self::COOLDOWN_DAYS - $daysSince;

                return response()->json([
                    'message' => 'Username can only be changed once every '.self::COOLDOWN_DAYS." days. {$daysLeft} days remaining.",
                    'errors' => ['username' => ["You can change your username again on {$user->username_changed_at->addDays(self::COOLDOWN_DAYS)->format('M d, Y')}."]],
                ], 422);
            }
        }

        $user->update([
            'username' => $validated['username'],
            'username_changed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Username updated.',
            'username_changed_at' => $user->username_changed_at->toIso8601String(),
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
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,gif,webp', 'max:2048'],
        ]);

        $user = $request->user();
        $this->setTenantContext($user);
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
        $this->setTenantContext($user);
        $this->deleteOldAvatar($user);
        $user->update(['photo_url' => null]);

        return response()->json([
            'message' => 'Avatar removed.',
        ]);
    }

    // ════════════════════════════════════════════
    // PASSWORD (with cooldown)
    // ════════════════════════════════════════════

    /**
     * Change password (90-day cooldown enforced).
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

        // Check 90-day cooldown
        if ($user->password_changed_at) {
            $daysSince = (int) $user->password_changed_at->diffInDays(now());
            if ($daysSince < self::COOLDOWN_DAYS) {
                $daysLeft = self::COOLDOWN_DAYS - $daysSince;

                return response()->json([
                    'message' => 'Password can only be changed once every '.self::COOLDOWN_DAYS." days. {$daysLeft} days remaining.",
                    'errors' => ['password' => ["You can change your password again on {$user->password_changed_at->addDays(self::COOLDOWN_DAYS)->format('M d, Y')}."]],
                ], 422);
            }
        }

        $user->update([
            'password' => Hash::make($validated['password']),
            'password_changed_at' => now(),
        ]);

        // Revoke all other tokens (keep current session)
        $currentTokenId = $user->currentAccessToken()->id;
        $user->tokens()->where('id', '!=', $currentTokenId)->delete();

        return response()->json([
            'message' => 'Password changed. All other sessions have been signed out.',
            'password_changed_at' => $user->password_changed_at->toIso8601String(),
        ]);
    }

    // ════════════════════════════════════════════
    // SESSIONS (enhanced with device info)
    // ════════════════════════════════════════════

    /**
     * Get active sessions (Sanctum tokens) with device details.
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
            ->map(function ($token) use ($currentTokenId) {
                $deviceInfo = $token->device_info ?? [];

                return [
                    'id' => $token->id,
                    'name' => $token->name,
                    'is_current' => $token->id === $currentTokenId,
                    'ip_address' => $token->ip_address,
                    'browser' => $deviceInfo['browser'] ?? 'Unknown',
                    'browser_version' => $deviceInfo['browser_version'] ?? null,
                    'platform' => $deviceInfo['platform'] ?? 'Unknown',
                    'device_type' => $deviceInfo['device_type'] ?? 'desktop',
                    'location' => $deviceInfo['location'] ?? null,
                    'last_used_at' => $token->last_used_at?->toIso8601String(),
                    'created_at' => $token->created_at?->toIso8601String(),
                    'expires_at' => $token->expires_at?->toIso8601String(),
                ];
            });

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
    // ACTIVITY (enhanced with categories, pagination)
    // ════════════════════════════════════════════

    /**
     * Get user activity log with filtering and pagination.
     *
     * GET /api/v1/account/activity
     */
    public function activity(Request $request): JsonResponse
    {
        $user = $request->user();
        $type = $request->query('type', 'all');
        $page = max(1, (int) $request->query('page', 1));
        $perPage = 20;

        $this->setTenantContext($user);

        // Login/logout events from login_logs
        $loginQuery = LoginLog::where('user_id', $user->id)
            ->select([
                'id',
                'action',
                DB::raw("'auth' as category"),
                'ip_address',
                'user_agent',
                'device_info',
                'created_at',
                DB::raw('NULL as resource_type'),
                DB::raw('NULL as resource_id'),
                DB::raw('NULL as changes'),
                DB::raw('NULL as module'),
            ]);

        // Audit logs for non-auth events
        $auditQuery = AuditLog::where('user_id', $user->id)
            ->select([
                'id',
                'action',
                DB::raw("COALESCE(module, 'system') as category"),
                'ip_address',
                'user_agent',
                DB::raw('NULL as device_info'),
                'created_at',
                'resource_type',
                'resource_id',
                'changes',
                'module',
            ]);

        // Apply type filter
        if ($type !== 'all') {
            $categoryMap = [
                'auth' => ['login', 'logout', 'failed_login'],
                'document' => 'document',
                'resident' => 'resident',
                'record' => 'record',
                'settings' => 'settings',
            ];

            if ($type === 'auth') {
                // Only login_logs for auth
                $query = $loginQuery;
            } else {
                // Only audit_logs for other categories
                $moduleFilter = $categoryMap[$type] ?? $type;
                $query = $auditQuery->where(function ($q) use ($moduleFilter) {
                    if (is_string($moduleFilter)) {
                        $q->where('module', $moduleFilter);
                    }
                });
            }
        } else {
            // Union both for "all"
            $query = $loginQuery->unionAll($auditQuery);
        }

        // Get total count
        if ($type === 'all') {
            $loginCount = LoginLog::where('user_id', $user->id)->count();
            $auditCount = AuditLog::where('user_id', $user->id)->count();
            $total = $loginCount + $auditCount;
        } elseif ($type === 'auth') {
            $total = LoginLog::where('user_id', $user->id)->count();
        } else {
            $moduleFilter = $categoryMap[$type] ?? $type;
            $total = AuditLog::where('user_id', $user->id)
                ->where('module', $moduleFilter)
                ->count();
        }

        // Paginate
        $offset = ($page - 1) * $perPage;

        if ($type === 'all') {
            $results = DB::query()
                ->fromSub($query, 'combined')
                ->orderByDesc('created_at')
                ->offset($offset)
                ->limit($perPage)
                ->get();
        } else {
            $results = $query
                ->orderByDesc('created_at')
                ->offset($offset)
                ->limit($perPage)
                ->get();
        }

        $activity = $results->map(function ($log) {
            $deviceInfo = is_string($log->device_info) ? json_decode($log->device_info, true) : ($log->device_info ?? []);
            $changes = is_string($log->changes) ? json_decode($log->changes, true) : ($log->changes ?? null);

            return [
                'id' => $log->id,
                'action' => $log->action,
                'category' => $log->category ?? 'system',
                'description' => $this->formatActivityDescription($log->action, $log->resource_type, $changes),
                'ip_address' => $log->ip_address ?? 'Unknown',
                'device_type' => $deviceInfo['device_type'] ?? 'unknown',
                'browser' => $deviceInfo['browser'] ?? 'unknown',
                'metadata' => $changes ? ['changes' => $changes] : null,
                'created_at' => $log->created_at,
            ];
        });

        return response()->json([
            'activity' => $activity,
            'total' => $total,
            'has_more' => ($offset + $perPage) < $total,
        ]);
    }

    // ════════════════════════════════════════════
    // TWO-FACTOR AUTHENTICATION (TOTP)
    // ════════════════════════════════════════════

    /**
     * Setup 2FA: generate secret + QR code.
     *
     * POST /api/v1/account/2fa/setup
     */
    public function setup2FA(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasTwoFactorEnabled()) {
            return response()->json([
                'message' => 'Two-factor authentication is already enabled.',
            ], 422);
        }

        $google2fa = new Google2FA;
        $secret = $google2fa->generateSecretKey(32);

        // Store secret temporarily (not confirmed yet)
        $user->update([
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => null,
        ]);

        // Generate QR code as data URI
        $otpauthUrl = $google2fa->getQRCodeUrl(
            'Kapitan.ph',
            $user->username,
            $secret
        );

        $qrCode = $this->generateQrCodeDataUri($otpauthUrl);

        // Pre-generate recovery codes (stored on enable, not setup)
        $recoveryCodes = $this->generateRecoveryCodes();

        return response()->json([
            'secret' => $secret,
            'qr_code' => $qrCode,
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Enable 2FA by verifying the TOTP code.
     *
     * POST /api/v1/account/2fa/enable
     */
    public function enable2FA(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();

        if ($user->hasTwoFactorEnabled()) {
            return response()->json([
                'message' => 'Two-factor authentication is already enabled.',
            ], 422);
        }

        if (! $user->two_factor_secret) {
            return response()->json([
                'message' => 'Please set up 2FA first.',
            ], 422);
        }

        $google2fa = new Google2FA;

        if (! $google2fa->verifyKey($user->two_factor_secret, $validated['code'])) {
            return response()->json([
                'message' => 'Invalid verification code. Please try again.',
            ], 422);
        }

        $recoveryCodes = $this->generateRecoveryCodes();

        $user->update([
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => $recoveryCodes,
        ]);

        Log::info('2FA enabled', ['user_id' => $user->id]);

        return response()->json([
            'message' => 'Two-factor authentication enabled successfully.',
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Disable 2FA (requires password verification).
     *
     * POST /api/v1/account/2fa/disable
     */
    public function disable2FA(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! $user->hasTwoFactorEnabled()) {
            return response()->json([
                'message' => 'Two-factor authentication is not enabled.',
            ], 422);
        }

        if (! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Incorrect password.',
                'errors' => ['password' => ['Incorrect password.']],
            ], 422);
        }

        $user->update([
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_recovery_codes' => null,
        ]);

        Log::info('2FA disabled', ['user_id' => $user->id]);

        return response()->json([
            'message' => 'Two-factor authentication has been disabled.',
        ]);
    }

    /**
     * Get recovery codes.
     *
     * GET /api/v1/account/2fa/recovery-codes
     */
    public function getRecoveryCodes(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasTwoFactorEnabled()) {
            return response()->json([
                'message' => 'Two-factor authentication is not enabled.',
            ], 422);
        }

        return response()->json([
            'recovery_codes' => $user->two_factor_recovery_codes ?? [],
        ]);
    }

    /**
     * Regenerate recovery codes.
     *
     * POST /api/v1/account/2fa/recovery-codes/regenerate
     */
    public function regenerateRecoveryCodes(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasTwoFactorEnabled()) {
            return response()->json([
                'message' => 'Two-factor authentication is not enabled.',
            ], 422);
        }

        $recoveryCodes = $this->generateRecoveryCodes();
        $user->update(['two_factor_recovery_codes' => $recoveryCodes]);

        Log::info('2FA recovery codes regenerated', ['user_id' => $user->id]);

        return response()->json([
            'recovery_codes' => $recoveryCodes,
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

        $user = $request->user();
        $barangay = $user->barangay;

        $estimatedCost = SmsService::costPerSegment();

        if ($barangay && ! $barangay->hasSmsCredits($estimatedCost)) {
            return response()->json([
                'message' => 'Insufficient SMS credits. Contact your administrator.',
            ], 422);
        }

        $otp = $this->smsService->sendOtp($validated['phone'], 'phone_verification', $barangay, $request->user()->id);

        if (! $otp) {
            return response()->json([
                'message' => 'Failed to send verification code. Check SMS credits or try again.',
            ], 500);
        }

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
    // EMAIL VERIFICATION (OTP via Mail)
    // ════════════════════════════════════════════

    /**
     * Send OTP to email address for verification.
     *
     * POST /api/v1/account/email/send-otp
     */
    public function sendEmailOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $user = $request->user();
        $email = $validated['email'];
        $otp = (string) random_int(100000, 999999);

        Cache::put("email_otp:{$user->id}:{$email}", $otp, now()->addMinutes(5));

        try {
            Mail::raw(
                "[Kapitan] Your email verification code is {$otp}. Valid for 5 minutes. Do not share this code with anyone.",
                function ($message) use ($email) {
                    $message->to($email)
                        ->subject('[Kapitan] Email Verification Code')
                        ->from(config('mail.from.address', 'noreply@kapitan.ph'), config('mail.from.name', 'Kapitan'));
                }
            );
        } catch (\Throwable $e) {
            Log::error('Email OTP send failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to send verification code. Please try again.',
            ], 500);
        }

        return response()->json([
            'message' => 'Verification code sent to your email.',
        ]);
    }

    /**
     * Verify email address with OTP code.
     *
     * POST /api/v1/account/email/verify
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();
        $email = $validated['email'];
        $cacheKey = "email_otp:{$user->id}:{$email}";
        $storedOtp = Cache::get($cacheKey);

        if (! $storedOtp || $storedOtp !== $validated['code']) {
            return response()->json([
                'message' => 'Invalid or expired verification code.',
            ], 422);
        }

        Cache::forget($cacheKey);

        $existing = User::where('email', $email)
            ->where('id', '!=', $user->id)
            ->exists();

        if ($existing) {
            return response()->json([
                'message' => 'This email address is already in use.',
            ], 422);
        }

        $preferences = $user->preferences ?? [];
        $preferences['email_verified'] = true;
        $preferences['email_verified_at'] = now()->toIso8601String();

        $user->update([
            'email' => $email,
            'preferences' => $preferences,
        ]);

        return response()->json([
            'message' => 'Email address verified.',
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
    // ACCOUNT DELETION REQUEST
    // ════════════════════════════════════════════

    /**
     * Request account deletion (RA 10173 Section 19 right to erasure).
     *
     * POST /api/v1/account/request-deletion
     */
    public function requestDeletion(Request $request): JsonResponse
    {
        $user = $request->user();

        $preferences = $user->preferences ?? [];
        $preferences['deletion_requested'] = true;
        $preferences['deletion_requested_at'] = now()->toIso8601String();

        $user->update(['preferences' => $preferences]);

        Log::warning('Account deletion requested', [
            'user_id' => $user->id,
            'username' => $user->username,
        ]);

        return response()->json([
            'message' => 'Account deletion request submitted. Your barangay administrator will process your request within 30 days as required by RA 10173.',
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

        $file = \App\Models\Admin\File::where('uploaded_by', $user->id)
            ->where('category', 'avatar')
            ->latest()
            ->first();

        if ($file) {
            $this->fileUploadService->delete($file);
        }
    }

    private function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = Str::upper(Str::random(4).'-'.Str::random(4));
        }

        return $codes;
    }

    private function generateQrCodeDataUri(string $data): string
    {
        $options = new QROptions([
            'outputType' => QRCode::OUTPUT_MARKUP_SVG,
            'eccLevel' => QRCode::ECC_M,
            'scale' => 5,
            'imageBase64' => false,
            'addQuietzone' => true,
        ]);

        $qr = new QRCode($options);
        $svg = $qr->render($data);

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }

    private function formatActivityDescription(string $action, ?string $resourceType, mixed $changes): string
    {
        $descriptions = [
            'login' => 'Signed in to your account',
            'logout' => 'Signed out of your account',
            'failed_login' => 'Failed sign-in attempt',
            'create' => 'Created '.($resourceType ? str_replace('_', ' ', $resourceType) : 'a record'),
            'update' => 'Updated '.($resourceType ? str_replace('_', ' ', $resourceType) : 'a record'),
            'delete' => 'Deleted '.($resourceType ? str_replace('_', ' ', $resourceType) : 'a record'),
            'view' => 'Viewed '.($resourceType ? str_replace('_', ' ', $resourceType) : 'a record'),
            'export' => 'Exported '.($resourceType ? str_replace('_', ' ', $resourceType) : 'data'),
            'print' => 'Printed '.($resourceType ? str_replace('_', ' ', $resourceType) : 'a document'),
            '2fa_enabled' => 'Two-factor authentication enabled',
            '2fa_disabled' => 'Two-factor authentication disabled',
            'password_changed' => 'Password changed',
            'username_changed' => 'Username changed',
        ];

        return $descriptions[$action] ?? ucfirst(str_replace('_', ' ', $action));
    }
}
