<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Apply security headers to every response.
 *
 * Prevents clickjacking, MIME-type sniffing, XSS reflection attacks,
 * information leakage, and enforces HTTPS via HSTS.
 */
class SecurityHeaders
{
    /**
     * Baseline security headers (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
     * are set at the Nginx layer (snippets/security-headers-api.conf).
     *
     * This middleware handles app-layer concerns Nginx cannot:
     * - Enforce CSP (not just report-only)
     * - Prevent caching of API responses with sensitive government data
     * - Strip PHP/server identification headers
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        // Enforce CSP at app layer (Nginx sets Report-Only; app enforces)
        $response->headers->set(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'none'; style-src 'unsafe-inline'; img-src 'self'; frame-ancestors 'none'",
        );

        // Prevent caching of API responses (sensitive government data)
        if ($request->is('api/*')) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate');
            $response->headers->set('Pragma', 'no-cache');
        }

        // Remove server identification headers
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }
}
