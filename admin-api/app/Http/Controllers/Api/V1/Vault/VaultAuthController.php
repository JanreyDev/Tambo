<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Vault;

use App\Http\Controllers\Controller;
use App\Models\Vault\VaultAccessLog;
use App\Models\Vault\VaultSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VaultAuthController extends Controller
{
    /**
     * Verify keyphrase and issue vault session token.
     */
    public function verifyKeyphrase(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'keyphrase' => ['required', 'string'],
        ]);

        $keyphraseHash = config('vault.keyphrase_hash');

        if ($keyphraseHash === null || $keyphraseHash === '') {
            Log::error('Vault auth: VAULT_KEYPHRASE not configured');

            return response()->json([
                'message' => 'Hindi pa available ang vault ngayon. Pakicontact ang PrimeX team.',
            ], 503);
        }

        if (! Hash::check($validated['keyphrase'], $keyphraseHash)) {
            Log::warning('Vault auth: invalid keyphrase attempt', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            VaultAccessLog::log(
                vaultSessionId: null,
                action: 'verify_failed',
                ipAddress: $request->ip(),
                userAgent: $request->userAgent(),
                metadata: ['attempt_ip' => $request->ip()],
            );

            return response()->json([
                'message' => 'Hindi tama ang keyphrase. Pakisubukan ulit.',
            ], 401);
        }

        $plainToken = Str::random(64);
        $tokenHash = hash('sha256', $plainToken);
        $sessionTtlMinutes = (int) config('vault.session_ttl');

        $session = VaultSession::create([
            'token_hash' => $tokenHash,
            'ip_address' => $request->ip() ?? 'unknown',
            'user_agent' => $request->userAgent() ?? 'unknown',
            'expires_at' => now()->addMinutes($sessionTtlMinutes),
            'last_activity_at' => now(),
            'created_at' => now(),
        ]);

        Log::info('Vault auth: session created', [
            'session_id' => $session->id,
            'ip' => $request->ip(),
        ]);

        VaultAccessLog::log(
            vaultSessionId: $session->id,
            action: 'verify_keyphrase',
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'message' => 'Access granted.',
            'data' => [
                'token' => $plainToken,
                'expires_at' => $session->expires_at->toIso8601String(),
                'session_id' => $session->id,
            ],
        ]);
    }

    /**
     * Heartbeat / session status check.
     */
    public function heartbeat(Request $request): JsonResponse
    {
        /** @var VaultSession $session */
        $session = $request->attributes->get('vault_session');

        return response()->json([
            'data' => [
                'session_id' => $session->id,
                'created_at' => $session->created_at->toIso8601String(),
                'expires_at' => $session->expires_at->toIso8601String(),
                'last_activity_at' => $session->last_activity_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Destroy vault session.
     */
    public function logout(Request $request): JsonResponse
    {
        /** @var VaultSession $session */
        $session = $request->attributes->get('vault_session');

        VaultAccessLog::log(
            vaultSessionId: $session->id,
            action: 'logout',
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        $session->delete();

        return response()->json([
            'message' => 'Session destroyed.',
        ]);
    }
}
