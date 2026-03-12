<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Platform\LoginLog;
use App\Models\User;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function __construct(
        private readonly SmsService $smsService,
    ) {}

    /**
     * Authenticate user and issue Sanctum token.
     *
     * POST /api/v1/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::where('username', $validated['username'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            // Generic response — no user enumeration
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Account is deactivated. Contact your administrator.',
            ], 403);
        }

        // Check barangay is active (unless super admin)
        if (! $user->is_super_admin && $user->barangay) {
            if (! $user->barangay->isActive()) {
                return response()->json([
                    'message' => 'Barangay account is inactive.',
                ], 403);
            }

            if (! $user->barangay->hasSubscription()) {
                return response()->json([
                    'message' => 'Subscription expired. Contact PrimeX support.',
                ], 403);
            }
        }

        // Set tenant context for RLS-protected tables (login happens before middleware sets this)
        // Using SET (session-level) not SET LOCAL (transaction-level) because Laravel doesn't
        // wrap individual queries in explicit transactions — SET LOCAL would vanish immediately.
        // Only on PostgreSQL — SQLite (used in testing) has no RLS.
        if ($user->barangay_id && DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.current_barangay_id = '{$user->barangay_id}'");
        }

        // Revoke existing tokens for this device (single session per device)
        $user->tokens()->where('name', $validated['device_name'] ?? 'web')->delete();

        // Issue new token
        $token = $user->createToken(
            $validated['device_name'] ?? 'web',
            ['*'],
            now()->addHours(12) // Token expires in 12 hours (daily login for gov offices)
        );

        // Store device info in the token for session tracking
        $token->accessToken->update([
            'ip_address' => $request->ip(),
            'device_info' => [
                'device_type' => $this->detectDeviceType($request->userAgent()),
                'browser' => $this->detectBrowser($request->userAgent()),
                'browser_version' => $this->detectBrowserVersion($request->userAgent()),
                'platform' => $this->detectPlatform($request->userAgent()),
                'location' => null, // IP geolocation can be added later
            ],
        ]);

        // Record login
        $user->recordLogin(
            $request->ip(),
            $request->userAgent()
        );

        // Log sign-in
        LoginLog::create([
            'barangay_id' => $user->barangay_id,
            'user_id' => $user->id,
            'action' => 'login',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device_info' => [
                'device_type' => $this->detectDeviceType($request->userAgent()),
                'browser' => $this->detectBrowser($request->userAgent()),
            ],
        ]);

        return response()->json([
            'user' => $this->formatUser($user),
            'token' => $token->plainTextToken,
            'expires_at' => $token->accessToken->expires_at,
        ]);
    }

    /**
     * Get authenticated user profile.
     *
     * GET /api/v1/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load(['barangay']);

        return response()->json($this->formatUser($user));
    }

    /**
     * Revoke current token (logout).
     *
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        // Set tenant context for RLS-protected login_logs table (PostgreSQL only)
        if ($user->barangay_id && DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.current_barangay_id = '{$user->barangay_id}'");
        }

        LoginLog::create([
            'barangay_id' => $user->barangay_id,
            'user_id' => $user->id,
            'action' => 'logout',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device_info' => [
                'device_type' => $this->detectDeviceType($request->userAgent()),
                'browser' => $this->detectBrowser($request->userAgent()),
            ],
        ]);

        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out.',
        ]);
    }

    /**
     * Revoke all tokens (logout from all devices).
     *
     * POST /api/v1/auth/logout-all
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Logged out from all devices.',
        ]);
    }

    /**
     * Check if a username exists in the system.
     * Used by forgot-password flow to validate before enabling OTP send.
     *
     * POST /api/v1/auth/check-username
     */
    public function checkUsername(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string'],
        ]);

        $user = User::where('username', $validated['username'])->first();

        if (! $user) {
            return response()->json([
                'exists' => false,
                'message' => 'Username not found.',
            ]);
        }

        // Mask the phone number for display
        $phoneMasked = null;
        if ($user->phone) {
            $phoneMasked = substr($user->phone, 0, 4).'****'.substr($user->phone, -2);
        }

        return response()->json([
            'exists' => true,
            'has_phone' => (bool) $user->phone,
            'phone_masked' => $phoneMasked,
        ]);
    }

    /**
     * Send password reset OTP via SMS.
     * Looks up user by username, sends OTP to their registered phone.
     *
     * POST /api/v1/auth/forgot-password
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string'],
        ]);

        // Username already validated via check-username endpoint on frontend
        $user = User::where('username', $validated['username'])->first();

        if (! $user || ! $user->phone) {
            return response()->json([
                'message' => 'No phone number registered for this account.',
            ], 422);
        }

        $barangay = $user->barangay;

        // Set tenant context for RLS (SMS transaction logging)
        if ($barangay && DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.current_barangay_id = '{$barangay->id}'");
        }

        $otp = $this->smsService->sendOtp($user->phone, 'password_reset', $barangay, $user->id);

        if (! $otp) {
            return response()->json([
                'message' => 'Failed to send verification code. Please try again.',
            ], 500);
        }

        \Log::info('Password reset OTP sent', [
            'user_id' => $user->id,
            'phone' => substr($user->phone, 0, 4).'****',
        ]);

        $phoneMasked = substr($user->phone, 0, 4).'****'.substr($user->phone, -2);

        return response()->json([
            'message' => "Verification code sent to {$phoneMasked}.",
        ]);
    }

    /**
     * Verify password reset OTP.
     * Returns a one-time reset token if OTP is valid.
     *
     * POST /api/v1/auth/verify-reset-otp
     */
    public function verifyResetOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = User::where('username', $validated['username'])->first();

        if (! $user || ! $user->phone) {
            return response()->json([
                'message' => 'Invalid verification code.',
            ], 422);
        }

        if (! $this->smsService->verifyOtp($user->phone, $validated['code'], 'password_reset')) {
            return response()->json([
                'message' => 'Invalid or expired verification code.',
            ], 422);
        }

        // Generate a short-lived reset token (hashed in cache, 10 min TTL).
        // Only the hash is stored; the plaintext token is returned to the client.
        // This prevents token extraction if the cache backend is compromised.
        $resetToken = bin2hex(random_bytes(32));
        \Illuminate\Support\Facades\Cache::put(
            "password_reset:{$user->id}",
            hash('sha256', $resetToken),
            now()->addMinutes(10)
        );

        return response()->json([
            'message' => 'Code verified.',
            'reset_token' => $resetToken,
            'phone_masked' => substr($user->phone, 0, 4).'****'.substr($user->phone, -2),
        ]);
    }

    /**
     * Reset password with verified reset token.
     *
     * POST /api/v1/auth/reset-password
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string'],
            'reset_token' => ['required', 'string'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);

        $user = User::where('username', $validated['username'])->first();

        if (! $user) {
            return response()->json([
                'message' => 'Invalid or expired reset token.',
            ], 422);
        }

        // Verify the reset token from cache (stored as SHA-256 hash)
        $storedHash = \Illuminate\Support\Facades\Cache::get("password_reset:{$user->id}");

        if (! $storedHash || ! hash_equals($storedHash, hash('sha256', $validated['reset_token']))) {
            return response()->json([
                'message' => 'Invalid or expired reset token.',
            ], 422);
        }

        // Update password
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        // Delete used reset token
        \Illuminate\Support\Facades\Cache::forget("password_reset:{$user->id}");

        // Revoke all existing tokens (force re-login)
        $user->tokens()->delete();

        \Log::info('Password reset successful via SMS OTP', [
            'user_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'Password has been reset successfully. Please sign in with your new password.',
        ]);
    }

    // ── Private Helpers ──

    private function formatUser(User $user): array
    {
        return [
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
            'is_super_admin' => $user->is_super_admin,
            'status' => $user->status,
            'last_login_at' => $user->last_login_at?->toIso8601String(),
            'last_login_ip' => $user->last_login_ip,
            'username_changed_at' => $user->username_changed_at?->toIso8601String(),
            'password_changed_at' => $user->password_changed_at?->toIso8601String(),
            'two_factor_enabled' => $user->hasTwoFactorEnabled(),
            'preferences' => $user->preferences,
            'barangay' => $user->barangay ? [
                'id' => $user->barangay->id,
                'name' => $user->barangay->name,
                'psgc_code' => $user->barangay->psgc_code,
                'full_address' => $user->barangay->full_address,
                'city_municipality' => $user->barangay->city_municipality,
                'province' => $user->barangay->province,
                'zip_code' => $user->barangay->zip_code,
                'logo_url' => $user->barangay->logo_url,
                'status' => $user->barangay->status,
                'sms_credit_balance' => $user->barangay->sms_credit_balance,
                'ai_credit_balance' => $user->barangay->ai_credit_balance,
                'call_credit_balance' => $user->barangay->call_credit_balance,
                'subscription_plan' => $user->barangay->subscription_plan,
                'storage_used_bytes' => $user->barangay->storage_used_bytes,
                'storage_limit_bytes' => $user->barangay->storage_limit_bytes,
                'seal_url' => $user->barangay->seal_url,
                'contact_phone' => $user->barangay->contact_phone,
                'contact_email' => $user->barangay->contact_email,
                'website_url' => $user->barangay->website_url,
                'motto' => $user->barangay->motto,
                'office_hours' => $user->barangay->office_hours,
                'captain_name' => $user->barangay->captain_name,
                'latitude' => $user->barangay->latitude ? (float) $user->barangay->latitude : null,
                'longitude' => $user->barangay->longitude ? (float) $user->barangay->longitude : null,
                'boundary_geojson' => $user->barangay->boundary_geojson,
                'setup_complete' => $user->barangay->setup_complete,
                'established_year' => $user->barangay->established_year,
            ] : null,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ];
    }

    private function detectDeviceType(?string $userAgent): string
    {
        if (! $userAgent) {
            return 'unknown';
        }

        if (preg_match('/Mobile|Android|iPhone/i', $userAgent)) {
            return 'mobile';
        }

        if (preg_match('/Tablet|iPad/i', $userAgent)) {
            return 'tablet';
        }

        return 'desktop';
    }

    private function detectBrowser(?string $userAgent): string
    {
        if (! $userAgent) {
            return 'Unknown';
        }

        if (str_contains($userAgent, 'Firefox')) {
            return 'Firefox';
        }

        if (str_contains($userAgent, 'Edg')) {
            return 'Edge';
        }

        if (str_contains($userAgent, 'Chrome')) {
            return 'Chrome';
        }

        if (str_contains($userAgent, 'Safari')) {
            return 'Safari';
        }

        return 'Other';
    }

    private function detectBrowserVersion(?string $userAgent): ?string
    {
        if (! $userAgent) {
            return null;
        }

        $patterns = [
            'Firefox' => '/Firefox\/([\d.]+)/',
            'Edg' => '/Edg\/([\d.]+)/',
            'Chrome' => '/Chrome\/([\d.]+)/',
            'Safari' => '/Version\/([\d.]+)/',
        ];

        foreach ($patterns as $browser => $pattern) {
            if (str_contains($userAgent, $browser) && preg_match($pattern, $userAgent, $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    private function detectPlatform(?string $userAgent): string
    {
        if (! $userAgent) {
            return 'Unknown';
        }

        if (str_contains($userAgent, 'Windows')) {
            return 'Windows';
        }

        if (str_contains($userAgent, 'Macintosh') || str_contains($userAgent, 'Mac OS')) {
            return 'macOS';
        }

        if (str_contains($userAgent, 'Linux') && ! str_contains($userAgent, 'Android')) {
            return 'Linux';
        }

        if (str_contains($userAgent, 'Android')) {
            return 'Android';
        }

        if (str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad')) {
            return 'iOS';
        }

        return 'Unknown';
    }
}
