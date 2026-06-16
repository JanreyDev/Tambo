<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Platform\LoginLog;
use App\Models\User;
use App\Services\SmsService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rules\Password;
use Symfony\Component\HttpFoundation\Cookie;

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
    /**
     * Account lockout policy — server-side defense vs frontend bypass.
     * After 10 failures within the decay window, lock for 15 minutes.
     * Decay window means we wipe the counter if the last failure was >60 min ago
     * (someone fat-fingering their password an hour later shouldn't carry old strikes).
     */
    private const MAX_FAILED_ATTEMPTS = 10;
    private const LOCKOUT_MINUTES = 15;
    private const FAILURE_DECAY_MINUTES = 60;

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::where('username', $validated['username'])->first();

        // Server-side lockout check — fires BEFORE password verification so a locked
        // account never reveals whether the password was right (anti-enumeration intact).
        if ($user && $user->isLockedOut()) {
            $this->logFailedLogin(
                $request,
                $validated['username'],
                $user->id,
                $user->barangay_id,
                'account_locked',
            );

            return response()->json([
                'message' => 'Invalid credentials.',
                'retry_after' => $user->secondsUntilUnlock(),
            ], 423);
        }

        // password_verify auto-detects the algorithm from the hash prefix
        // ($2y$ = bcrypt, $argon2id$ = argon2id) so this works during the
        // bcrypt -> argon2id transition without throwing on mismatched drivers.
        $passwordValid = $user && password_verify($validated['password'], $user->password);

        if (! $user || ! $passwordValid) {
            // Increment counter + possibly lock the account.
            if ($user) {
                $this->recordFailedAttemptAndMaybeLock($user);
            }

            // Audit the failed attempt — never reveal which field was wrong.
            // Logs even when user is null (probes for usernames are forensic signal).
            $this->logFailedLogin(
                $request,
                $validated['username'],
                $user?->id,
                $user?->barangay_id,
                $user ? 'invalid_password' : 'unknown_username',
            );

            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if ($user->status !== 'active') {
            $this->logFailedLogin(
                $request,
                $validated['username'],
                $user->id,
                $user->barangay_id,
                'account_inactive',
            );

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
            // Parameterized via bindings — UUID is type-validated upstream, but SET cannot accept bindings.
            // Re-validate as UUID to defend against any unexpected mutation.
            $sanitizedBarangayId = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', (string) $user->barangay_id)
                ? $user->barangay_id
                : null;
            if ($sanitizedBarangayId) {
                DB::statement("SET app.current_barangay_id = '{$sanitizedBarangayId}'");
            }
        }

        // Transparent hash migration — bcrypt -> Argon2id silently on successful login.
        // Use password_get_info to detect the stored algorithm without calling Laravel's
        // strict driver-specific needsRehash (which throws on cross-algorithm checks).
        $stored = password_get_info($user->password);
        $isArgon2id = ($stored['algo'] ?? null) === PASSWORD_ARGON2ID;
        if (! $isArgon2id) {
            $user->password = Hash::make($validated['password']);
            $user->saveQuietly();
        }

        // Capture pre-login state for the new-device SMS alert BEFORE recordLogin overwrites it.
        $previousLoginIp = $user->last_login_ip;
        $previousLoginAt = $user->last_login_at;
        $isFirstLogin = $previousLoginIp === null;

        // Reset lockout counter atomically on successful authentication.
        if ($user->failed_login_attempts > 0 || $user->locked_until !== null) {
            $user->forceFill([
                'failed_login_attempts' => 0,
                'locked_until' => null,
                'last_failed_login_at' => null,
            ])->saveQuietly();
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

        // New-device SMS alert: scaffolded but disabled. Enable via FEATURE_NEW_DEVICE_SMS_ALERT=true.
        // Skipped on first-ever login (no prior IP to compare). Failures are silent — alerting
        // must never block authentication.
        if (env('FEATURE_NEW_DEVICE_SMS_ALERT', false)
            && ! $isFirstLogin
            && $previousLoginIp !== $request->ip()) {
            $this->notifyNewDeviceLogin($user, $previousLoginIp, $previousLoginAt, $request);
        }

        // Issue httpOnly secure cookie alongside the JSON token.
        // Web clients ignore the body token (cookie is auto-attached on subsequent requests).
        // Mobile clients (Flutter) ignore the cookie and use the body token via Authorization header.
        // Same token, two delivery mechanisms — XSS-stolen tokens become impossible on web.
        $expiresAt = $token->accessToken->expires_at;
        // Compute seconds-until-expiry via UNIX timestamps — Carbon 3's diffInSeconds
        // returns signed values and direction-sensitive results that misbehave here.
        $maxAgeSeconds = max(60, $expiresAt->getTimestamp() - time());
        $isProduction = app()->environment('production');

        $response = response()->json([
            'user' => $this->formatUser($user),
            'token' => $token->plainTextToken, // retained for mobile + backward compat
            'expires_at' => $expiresAt,
        ]);

        // bcmp_token: httpOnly — actual auth credential; JS cannot read it.
        $response->withCookie(new Cookie(
            name: 'bcmp_token',
            value: $token->plainTextToken,
            expire: time() + $maxAgeSeconds,
            path: '/',
            domain: null,
            secure: $isProduction,
            httpOnly: true,
            raw: false,
            sameSite: Cookie::SAMESITE_LAX,
        ));

        // bcmp_auth: readable by Next.js middleware (route protection only — no sensitive data).
        $response->withCookie(new Cookie(
            name: 'bcmp_auth',
            value: '1',
            expire: time() + $maxAgeSeconds,
            path: '/',
            domain: null,
            secure: $isProduction,
            httpOnly: false,
            raw: false,
            sameSite: Cookie::SAMESITE_LAX,
        ));

        return $response;
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
     * Update the authenticated user's per-account preferences.
     * Currently supports preferred_language (UI language).
     *
     * PATCH /api/v1/me/preferences
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'preferred_language' => ['nullable', 'string', 'in:en,fil'],
        ]);

        $user = $request->user();

        if (array_key_exists('preferred_language', $validated)) {
            $user->preferred_language = $validated['preferred_language'] ?? 'en';
            $user->save();
        }

        return response()->json([
            'message' => 'Preferences updated.',
            'preferred_language' => $user->preferred_language,
        ]);
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

        // Clear both auth cookies — expire immediately and overwrite any existing value.
        $isProduction = app()->environment('production');
        $clearTokenCookie = new Cookie(
            name: 'bcmp_token',
            value: '',
            expire: 1,
            path: '/',
            domain: null,
            secure: $isProduction,
            httpOnly: true,
            raw: false,
            sameSite: Cookie::SAMESITE_LAX,
        );
        $clearAuthCookie = new Cookie(
            name: 'bcmp_auth',
            value: '',
            expire: 1,
            path: '/',
            domain: null,
            secure: $isProduction,
            httpOnly: false,
            raw: false,
            sameSite: Cookie::SAMESITE_LAX,
        );

        return response()->json([
            'message' => 'Logged out.',
        ])->withCookie($clearTokenCookie)->withCookie($clearAuthCookie);
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

    /**
     * Record a failed attempt and lock the account if the threshold is hit.
     * Uses an atomic increment to avoid race conditions under parallel requests.
     * Resets the counter if the last failure was more than FAILURE_DECAY_MINUTES ago
     * (don't punish a user who fat-fingered once an hour ago).
     */
    private function recordFailedAttemptAndMaybeLock(User $user): void
    {
        $now = now();
        $decayThreshold = $now->copy()->subMinutes(self::FAILURE_DECAY_MINUTES);

        $shouldReset = $user->last_failed_login_at !== null
            && $user->last_failed_login_at->lt($decayThreshold);

        $newAttempts = $shouldReset ? 1 : ($user->failed_login_attempts ?? 0) + 1;
        $shouldLock = $newAttempts >= self::MAX_FAILED_ATTEMPTS;

        $user->forceFill([
            'failed_login_attempts' => $newAttempts,
            'last_failed_login_at' => $now,
            'locked_until' => $shouldLock ? $now->copy()->addMinutes(self::LOCKOUT_MINUTES) : $user->locked_until,
        ])->saveQuietly();
    }

    /**
     * Send the user an SMS alert when they log in from an IP not seen on their last session.
     * Best-effort — never blocks the login flow. SMS provider failures are logged silently.
     */
    private function notifyNewDeviceLogin(
        User $user,
        ?string $previousIp,
        ?\Illuminate\Support\Carbon $previousAt,
        Request $request,
    ): void {
        try {
            if (! $user->phone) {
                return;
            }

            $previousLabel = $previousAt
                ? $previousAt->setTimezone('Asia/Manila')->format('M j, g:i A')
                : 'unknown time';
            $previousIpLabel = $previousIp ?: 'unknown IP';
            $newDevice = $this->detectBrowser($request->userAgent()).' on '.$this->detectPlatform($request->userAgent());

            $message = "kapitan.ph: New login detected.\n"
                ."Device: {$newDevice}\n"
                ."IP: {$request->ip()}\n"
                ."Previous: {$previousIpLabel} at {$previousLabel}\n"
                ."If this wasn't you, change your password immediately.";

            $this->smsService->send(
                phone: $user->phone,
                message: $message,
                barangay: $user->barangay,
                source: 'security_alert_new_device',
                sourceId: $user->id,
            );
        } catch (\Throwable $e) {
            \Log::warning('New-device login alert failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Log a failed login attempt to the audit trail.
     * Captures IP, UA, device fingerprint, and the failure reason — forensic signal for credential stuffing.
     * Never reveals the failure reason to the client (caller still returns generic 401).
     */
    private function logFailedLogin(
        Request $request,
        string $attemptedUsername,
        ?string $userId,
        ?string $barangayId,
        string $reason,
    ): void {
        // RLS context — if we know the user, set it so the insert lands correctly.
        if ($barangayId && DB::getDriverName() === 'pgsql') {
            $sanitized = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $barangayId) ? $barangayId : null;
            if ($sanitized) {
                DB::statement("SET app.current_barangay_id = '{$sanitized}'");
            }
        }

        try {
            LoginLog::create([
                'barangay_id' => $barangayId,
                'user_id' => $userId,
                'attempted_username' => substr($attemptedUsername, 0, 64),
                'action' => 'login_failed',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'device_info' => [
                    'device_type' => $this->detectDeviceType($request->userAgent()),
                    'browser' => $this->detectBrowser($request->userAgent()),
                    'attempted_username' => substr($attemptedUsername, 0, 64),
                    'reason' => $reason,
                ],
            ]);
        } catch (\Throwable $e) {
            // Never let audit failure block the login flow — log to Laravel log instead.
            \Log::warning('Failed to write login_failed audit entry', [
                'reason' => $reason,
                'error' => $e->getMessage(),
            ]);
        }

        // Fire Telegram alert for HIGH-SIGNAL failed attempts:
        //   1. Any attempt against a super_admin account (low-frequency, high-stakes)
        //   2. 3+ failed attempts for the same known user within 5 minutes (targeting)
        //   3. 10+ failed attempts from the same IP within 10 minutes (credential stuffing)
        try {
            $shouldAlert = false;
            $alertReason = '';

            // Trigger 1: super_admin probe
            if ($userId) {
                $userIsAdmin = (bool) User::where('id', $userId)->where('is_super_admin', true)->exists();
                if ($userIsAdmin) {
                    $shouldAlert = true;
                    $alertReason = 'super_admin attempt';
                }
            }

            // Trigger 2: per-username burst
            if (! $shouldAlert && $userId) {
                $userBurst = LoginLog::where('user_id', $userId)
                    ->where('action', 'login_failed')
                    ->where('created_at', '>=', now()->subMinutes(5))
                    ->count();
                if ($userBurst >= 3) {
                    $shouldAlert = true;
                    $alertReason = "{$userBurst} failures in 5min";
                }
            }

            // Trigger 3: per-IP burst (catches credential stuffing across usernames)
            if (! $shouldAlert) {
                $ipBurst = LoginLog::where('ip_address', $request->ip())
                    ->where('action', 'login_failed')
                    ->where('created_at', '>=', now()->subMinutes(10))
                    ->count();
                if ($ipBurst >= 10) {
                    $shouldAlert = true;
                    $alertReason = "{$ipBurst} failures from IP in 10min";
                }
            }

            if ($shouldAlert) {
                $this->sendTelegramSecurityAlert(
                    title: 'BCMP failed login',
                    payload: [
                        'username' => substr($attemptedUsername, 0, 64),
                        'reason' => $reason,
                        'trigger' => $alertReason,
                        'ip' => $request->ip(),
                        'user_agent' => substr((string) $request->userAgent(), 0, 120),
                    ],
                );
            }
        } catch (\Throwable $e) {
            \Log::warning('Telegram alert dispatch failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Send a security alert to the operator Telegram channel.
     * Fire-and-forget with a tight timeout — never blocks the request path more than 2s.
     * No-ops silently when bot token or chat id is unconfigured (local dev).
     */
    private function sendTelegramSecurityAlert(string $title, array $payload): void
    {
        $token = (string) config('services.telegram.bot_token', env('TELEGRAM_BOT_TOKEN', ''));
        $chatId = (string) config('services.telegram.alert_chat_id', env('TELEGRAM_CHAT_ID_JEAGER', ''));
        if ($token === '' || $chatId === '') {
            return;
        }

        $lines = ["🚨 *{$title}*"];
        foreach ($payload as $k => $v) {
            // Escape Markdown V1 metacharacters that would break formatting
            $safe = str_replace(['*', '_', '`', '['], ['', '', '', ''], (string) $v);
            $lines[] = "*".ucfirst((string) $k)."*: `{$safe}`";
        }
        $lines[] = "_".now()->toIso8601String()."_";

        try {
            Http::timeout(2)->retry(1, 200)->asJson()->post(
                "https://api.telegram.org/bot{$token}/sendMessage",
                [
                    'chat_id' => $chatId,
                    'text' => implode("\n", $lines),
                    'parse_mode' => 'Markdown',
                    'disable_web_page_preview' => true,
                ],
            );
        } catch (ConnectionException $e) {
            \Log::warning('Telegram connection failed', ['error' => $e->getMessage()]);
        }
    }

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
            'preferred_language' => $user->preferred_language ?? 'en',
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
                'municipality_logo_url' => $user->barangay->municipality_logo_url,
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
