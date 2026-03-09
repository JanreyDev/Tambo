<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\AuditLog;
use App\Models\Founder\FounderSession;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class FounderAuth
{
    /**
     * Handle an incoming request by validating the founder session token.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $bearerToken = $request->bearerToken();

        if ($bearerToken === null || $bearerToken === '') {
            $this->logAccessAttempt($request, 'missing_token');

            return $this->unauthorizedResponse('Authentication required.');
        }

        $tokenHash = hash('sha256', $bearerToken);

        $session = FounderSession::where('token_hash', $tokenHash)->first();

        if ($session === null) {
            $this->logAccessAttempt($request, 'invalid_token');

            return $this->unauthorizedResponse('Invalid session.');
        }

        if ($session->isExpired()) {
            $this->logAccessAttempt($request, 'expired_session');
            $session->delete();

            return $this->unauthorizedResponse('Session expired.');
        }

        $idleTimeout = (int) config('founder.idle_timeout');

        if ($session->isIdle($idleTimeout)) {
            $this->logAccessAttempt($request, 'idle_timeout');
            $session->delete();

            return $this->unauthorizedResponse('Session timed out due to inactivity.');
        }

        // Session is valid -- update last activity and continue.
        $session->touchActivity();

        // Store session on request for downstream use.
        $request->attributes->set('founder_session', $session);

        return $next($request);
    }

    /**
     * Return a standard 401 JSON response.
     */
    private function unauthorizedResponse(string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
        ], 401);
    }

    /**
     * Log founder access attempts for security auditing.
     */
    private function logAccessAttempt(Request $request, string $reason): void
    {
        Log::warning('Founder auth failed', [
            'reason' => $reason,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'path' => $request->path(),
        ]);

        AuditLog::log(
            adminUserId: null,
            action: 'founder_auth_failed',
            resourceType: 'founder_session',
            description: "Founder auth failed: {$reason}",
            metadata: [
                'reason' => $reason,
                'path' => $request->path(),
            ],
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );
    }
}
