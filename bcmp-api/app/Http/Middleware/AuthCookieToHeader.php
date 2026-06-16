<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * AuthCookieToHeader — bridges httpOnly cookie auth to Sanctum's bearer-token model.
 *
 * Web clients receive a `bcmp_token` httpOnly cookie at login. This middleware reads
 * that cookie and injects it as `Authorization: Bearer <token>` BEFORE Sanctum's
 * auth:sanctum middleware runs, so all existing token-validation logic continues
 * to work unchanged across all 230+ routes.
 *
 * Mobile clients keep using the Authorization header directly — this middleware
 * only fills in the header when it's absent and a cookie is present.
 */
class AuthCookieToHeader
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->headers->has('Authorization')) {
            $token = $request->cookie('bcmp_token');
            if (is_string($token) && $token !== '') {
                $request->headers->set('Authorization', 'Bearer '.$token);
            }
        }

        return $next($request);
    }
}
