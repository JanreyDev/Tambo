<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Founder;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Founder\FounderSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FounderAuthController extends Controller
{
    private const MAX_ATTEMPTS = 3;

    private const LOCKOUT_SECONDS = 60;

    /**
     * Verify the founder passcode and issue a session token.
     *
     * Rate limiting: locks for 60s after 3 consecutive failed attempts.
     * Successful login resets the counter.
     */
    public function verifyPasscode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'passcode' => ['required', 'string'],
        ]);

        $ip = $request->ip() ?? 'unknown';
        $cacheKey = 'founder_attempts:'.$ip;
        $lockKey = 'founder_locked:'.$ip;

        // Check if currently locked out
        $lockedUntil = Cache::get($lockKey);
        if ($lockedUntil && now()->timestamp < $lockedUntil) {
            $retryAfter = $lockedUntil - now()->timestamp;

            return response()->json([
                'message' => 'Too many failed attempts. Try again later.',
                'retry_after' => $retryAfter,
            ], 429)->header('Retry-After', (string) $retryAfter);
        }

        $passcodeHash = config('founder.passcode_hash');

        if ($passcodeHash === null || $passcodeHash === '') {
            Log::error('Founder auth: FOUNDER_PASSCODE not configured');

            return response()->json([
                'message' => 'Authentication unavailable.',
            ], 503);
        }

        if (! Hash::check($validated['passcode'], $passcodeHash)) {
            // Increment failed attempts
            $attempts = (int) Cache::get($cacheKey, 0) + 1;
            Cache::put($cacheKey, $attempts, self::LOCKOUT_SECONDS);

            Log::warning('Founder auth: invalid passcode attempt', [
                'ip' => $ip,
                'attempt' => $attempts,
                'user_agent' => $request->userAgent(),
            ]);

            AuditLog::log(
                adminUserId: null,
                action: 'founder_passcode_failed',
                resourceType: 'founder_session',
                description: "Invalid founder passcode attempt ({$attempts}/".self::MAX_ATTEMPTS.')',
                metadata: ['attempt_ip' => $ip, 'attempt_count' => $attempts],
                ipAddress: $ip,
                userAgent: $request->userAgent(),
            );

            // Lock after MAX_ATTEMPTS failed tries
            if ($attempts >= self::MAX_ATTEMPTS) {
                $lockUntil = now()->timestamp + self::LOCKOUT_SECONDS;
                Cache::put($lockKey, $lockUntil, self::LOCKOUT_SECONDS);
                Cache::forget($cacheKey);

                return response()->json([
                    'message' => 'Too many failed attempts. Try again later.',
                    'retry_after' => self::LOCKOUT_SECONDS,
                ], 429)->header('Retry-After', (string) self::LOCKOUT_SECONDS);
            }

            $remaining = self::MAX_ATTEMPTS - $attempts;

            return response()->json([
                'message' => "Invalid passcode. {$remaining} attempt(s) remaining.",
            ], 401);
        }

        // Success -- clear failed attempt counter
        Cache::forget($cacheKey);
        Cache::forget($lockKey);

        // Generate a cryptographically secure 64-character token.
        $plainToken = Str::random(64);
        $tokenHash = hash('sha256', $plainToken);

        $sessionTtlMinutes = (int) config('founder.session_ttl');

        $session = FounderSession::create([
            'token_hash' => $tokenHash,
            'ip_address' => $request->ip() ?? 'unknown',
            'user_agent' => $request->userAgent() ?? 'unknown',
            'expires_at' => now()->addMinutes($sessionTtlMinutes),
            'last_activity_at' => now(),
            'created_at' => now(),
        ]);

        Log::info('Founder auth: session created', [
            'session_id' => $session->id,
            'ip' => $request->ip(),
        ]);

        AuditLog::log(
            adminUserId: null,
            action: 'founder_login',
            resourceType: 'founder_session',
            resourceId: $session->id,
            description: 'Founder authenticated successfully',
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'message' => 'Authentication successful.',
            'data' => [
                'token' => $plainToken,
                'expires_at' => $session->expires_at->toIso8601String(),
                'session_id' => $session->id,
            ],
        ]);
    }

    /**
     * Return current session info (heartbeat / keep-alive).
     */
    public function heartbeat(Request $request): JsonResponse
    {
        /** @var FounderSession $session */
        $session = $request->attributes->get('founder_session');

        return response()->json([
            'data' => [
                'session_id' => $session->id,
                'created_at' => $session->created_at->toIso8601String(),
                'expires_at' => $session->expires_at->toIso8601String(),
                'last_activity_at' => $session->last_activity_at->toIso8601String(),
                'ip_address' => $session->ip_address,
            ],
        ]);
    }

    /**
     * Destroy the current founder session.
     */
    public function logout(Request $request): JsonResponse
    {
        /** @var FounderSession $session */
        $session = $request->attributes->get('founder_session');

        AuditLog::log(
            adminUserId: null,
            action: 'founder_logout',
            resourceType: 'founder_session',
            resourceId: $session->id,
            description: 'Founder session destroyed',
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        $session->delete();

        return response()->json([
            'message' => 'Session destroyed.',
        ]);
    }
}
