<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Vault\VaultAccessLog;
use App\Models\Vault\VaultSession;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class VaultAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearerToken = $request->bearerToken();

        if ($bearerToken === null || $bearerToken === '') {
            $this->logAccessAttempt($request, null, 'missing_token');

            return $this->unauthorizedResponse('Authentication required.');
        }

        $tokenHash = hash('sha256', $bearerToken);

        $session = VaultSession::where('token_hash', $tokenHash)->first();

        if ($session === null) {
            $this->logAccessAttempt($request, null, 'invalid_token');

            return $this->unauthorizedResponse('Invalid session.');
        }

        if ($session->isExpired()) {
            $this->logAccessAttempt($request, $session->id, 'expired_session');
            $session->delete();

            return $this->unauthorizedResponse('Session expired.');
        }

        // No idle timeout for vault -- family needs time to read.

        $session->touchActivity();

        $request->attributes->set('vault_session', $session);

        return $next($request);
    }

    private function unauthorizedResponse(string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
        ], 401);
    }

    private function logAccessAttempt(Request $request, ?string $sessionId, string $reason): void
    {
        Log::warning('Vault auth failed', [
            'reason' => $reason,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'path' => $request->path(),
        ]);

        VaultAccessLog::log(
            vaultSessionId: $sessionId,
            action: 'vault_auth_failed',
            resourceType: 'vault_session',
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
            metadata: [
                'reason' => $reason,
                'path' => $request->path(),
            ],
        );
    }
}
