<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * VerifyTurnstile — Cloudflare Turnstile bot-defense gate.
 *
 * Apply to high-risk endpoints (login, forgot-password, verify-reset-otp, signup).
 * Browser submits a Turnstile token via `cf-turnstile-response` body field or header.
 * We POST that token to Cloudflare's siteverify endpoint to confirm the user is human.
 *
 * Behavior:
 *   - TURNSTILE_SECRET_KEY unset → no-op (dev / before CF setup). Logs once per request.
 *   - Token missing on protected request → 400 with neutral message (no fingerprinting).
 *   - Siteverify rejects token → 400 with neutral message.
 *   - Siteverify network failure → fail-open with a warning log (never block legit users
 *     on CF outage; rate limit + lockout still in place).
 */
class VerifyTurnstile
{
    private const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    private const REQUEST_TIMEOUT_SECONDS = 3;

    public function handle(Request $request, Closure $next): Response
    {
        $secret = (string) env('TURNSTILE_SECRET_KEY', '');
        if ($secret === '') {
            // Not configured yet — skip silently. Production deploy must set this.
            return $next($request);
        }

        $token = $request->input('cf-turnstile-response')
            ?? $request->header('cf-turnstile-response');

        if (! is_string($token) || $token === '') {
            return response()->json([
                'message' => 'Verification required. Please complete the bot check and retry.',
            ], 400);
        }

        try {
            $response = Http::timeout(self::REQUEST_TIMEOUT_SECONDS)
                ->asForm()
                ->post(self::SITEVERIFY_URL, [
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $request->ip(),
                ]);

            $body = $response->json();
            $success = (bool) ($body['success'] ?? false);

            if (! $success) {
                Log::info('Turnstile rejected', [
                    'ip' => $request->ip(),
                    'errors' => $body['error-codes'] ?? [],
                ]);

                return response()->json([
                    'message' => 'Verification failed. Please retry.',
                ], 400);
            }
        } catch (\Throwable $e) {
            // Fail-open on CF outage — rate limit + lockout + audit still defend.
            Log::warning('Turnstile siteverify unreachable, allowing request', [
                'ip' => $request->ip(),
                'error' => $e->getMessage(),
            ]);
        }

        return $next($request);
    }
}
