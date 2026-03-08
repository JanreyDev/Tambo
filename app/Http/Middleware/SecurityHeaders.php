<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Adds security headers to every response.
 *
 * Covers OWASP recommended headers for API and web responses.
 * Removes server-identifying headers to reduce attack surface.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        // -- Prevent MIME-type sniffing (IE/Chrome content sniffing attacks) --
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // -- Prevent clickjacking (iframe embedding) --
        $response->headers->set('X-Frame-Options', 'DENY');

        // -- XSS filter for legacy browsers --
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // -- Control referrer information leakage --
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // -- Restrict browser features/APIs --
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

        // -- Content Security Policy --
        // API-only app: no scripts should ever execute.
        // style-src 'unsafe-inline' needed for the status page (welcome.blade.php).
        // img-src 'self' data: allows inline data URIs used by the status page.
        $response->headers->set(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'"
        );

        // -- HSTS: force HTTPS for 1 year, including subdomains --
        // preload flag allows inclusion in browser HSTS preload lists.
        $response->headers->set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );

        // -- Prevent caching of API responses containing sensitive data --
        if ($request->is('api/*')) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate');
            $response->headers->set('Pragma', 'no-cache');
        }

        // -- Remove server-identifying headers --
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }
}
