<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\Platform\LoginLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
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
            now()->addDays(30) // Token expires in 30 days
        );

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
            'device_type' => $this->detectDeviceType($request->userAgent()),
            'browser' => $this->detectBrowser($request->userAgent()),
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
            'device_type' => $this->detectDeviceType($request->userAgent()),
            'browser' => $this->detectBrowser($request->userAgent()),
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
     * Send password reset link.
     * For now, logs the reset URL instead of sending email.
     *
     * POST /api/v1/auth/forgot-password
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $email = $request->validated()['email'];

        // Always return success — no user enumeration
        $user = User::where('email', $email)->first();

        if ($user) {
            // Delete existing tokens for this email
            DB::table('password_reset_tokens')->where('email', $email)->delete();

            // Generate hashed token
            $token = Str::random(64);

            DB::table('password_reset_tokens')->insert([
                'email' => $email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]);

            // TODO: Send email with reset link
            // For now, log it so we can test the flow
            $resetUrl = config('app.frontend_url', 'https://staging-bcmp.primex.ventures')
                . '/reset-password?token=' . $token . '&email=' . urlencode($email);

            \Log::info('Password reset requested', [
                'email' => $email,
                'reset_url' => $resetUrl,
            ]);
        }

        return response()->json([
            'message' => 'If an account with that email exists, a password reset link has been sent.',
        ]);
    }

    /**
     * Reset password with token.
     *
     * POST /api/v1/auth/reset-password
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (! $record) {
            return response()->json([
                'message' => 'Invalid or expired reset token.',
            ], 422);
        }

        // Check if token matches
        if (! Hash::check($validated['token'], $record->token)) {
            return response()->json([
                'message' => 'Invalid or expired reset token.',
            ], 422);
        }

        // Check if token is expired (60 minutes)
        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

            return response()->json([
                'message' => 'Reset token has expired. Please request a new one.',
            ], 422);
        }

        // Update password
        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            return response()->json([
                'message' => 'Invalid or expired reset token.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        // Delete used token
        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        // Revoke all existing tokens (force re-login)
        $user->tokens()->delete();

        \Log::info('Password reset successful', [
            'user_id' => $user->id,
            'email' => $user->email,
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
            'preferences' => $user->preferences,
            'barangay' => $user->barangay ? [
                'id' => $user->barangay->id,
                'name' => $user->barangay->name,
                'full_address' => $user->barangay->full_address,
                'logo_url' => $user->barangay->logo_url,
                'status' => $user->barangay->status,
                'sms_credit_balance' => $user->barangay->sms_credit_balance,
                'ai_credit_balance' => $user->barangay->ai_credit_balance,
                'call_credit_balance' => $user->barangay->call_credit_balance,
                'storage_used_bytes' => $user->barangay->storage_used_bytes,
                'storage_limit_bytes' => $user->barangay->storage_limit_bytes,
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
            return 'unknown';
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

        return 'other';
    }
}
