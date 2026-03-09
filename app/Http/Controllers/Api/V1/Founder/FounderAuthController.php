<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Founder;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Founder\FounderSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FounderAuthController extends Controller
{
    /**
     * Verify the founder passcode and issue a session token.
     */
    public function verifyPasscode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'passcode' => ['required', 'string'],
        ]);

        $passcodeHash = config('founder.passcode_hash');

        if ($passcodeHash === null || $passcodeHash === '') {
            Log::error('Founder auth: FOUNDER_PASSCODE not configured');

            return response()->json([
                'message' => 'Authentication unavailable.',
            ], 503);
        }

        if (! Hash::check($validated['passcode'], $passcodeHash)) {
            Log::warning('Founder auth: invalid passcode attempt', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            AuditLog::log(
                adminUserId: null,
                action: 'founder_passcode_failed',
                resourceType: 'founder_session',
                description: 'Invalid founder passcode attempt',
                metadata: ['attempt_ip' => $request->ip()],
                ipAddress: $request->ip(),
                userAgent: $request->userAgent(),
            );

            return response()->json([
                'message' => 'Invalid passcode.',
            ], 401);
        }

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
