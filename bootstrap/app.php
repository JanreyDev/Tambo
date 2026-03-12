<?php

use App\Http\Middleware\BlockSuspiciousRequests;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SetTenantContext;
use App\Http\Middleware\SuperAdminOnly;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        // health: '/up', -- Disabled: exposes diagnostic info. Status page at / is sufficient.
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'tenant' => SetTenantContext::class,
            'super_admin' => SuperAdminOnly::class,
        ]);

        // ── Global middleware (runs on every request) ──
        // Order matters: block suspicious requests first, then add security headers.
        $middleware->prepend(BlockSuspiciousRequests::class);
        $middleware->append(SecurityHeaders::class);

        // ── Global API rate limiting ──
        // 60 requests per minute per IP across all API routes.
        // Per-endpoint throttling (login 5/min, OTP 5/min, etc.) still applies on top.
        $middleware->api(prepend: [
            'throttle:api',
        ]);

        // Trust Cloudflare proxy headers so rate limiting uses real client IP.
        // Without this, Laravel sees Cloudflare's IP and rate-limits all clients as one.
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR |
                     Request::HEADER_X_FORWARDED_HOST |
                     Request::HEADER_X_FORWARDED_PORT |
                     Request::HEADER_X_FORWARDED_PROTO |
                     Request::HEADER_X_FORWARDED_AWS_ELB,
        );

        // Token-based auth only — no statefulApi() needed.
        // statefulApi() adds CSRF validation which silently breaks
        // JSON body parsing on FormRequest routes.
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Unauthenticated requests: JSON clients get 401, browsers redirect to status page.
        // Without this, Sanctum tries to redirect to a `login` named route which doesn't
        // exist (API-only app), causing a 500 RouteNotFoundException.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return redirect('/');
        });

        // Return JSON for API 404s, redirect browser 404s to status page.
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Resource not found.',
                ], 404);
            }

            return redirect('/');
        });

        // Catch truly unhandled exceptions on API routes — never leak internals.
        // Let Laravel handle ValidationException and HttpExceptionInterface normally.
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (! ($request->is('api/*') || $request->expectsJson())) {
                return null;
            }

            // Let Laravel's built-in handlers produce proper responses for these
            if ($e instanceof ValidationException
                || $e instanceof HttpExceptionInterface) {
                return null;
            }

            // Log the actual error for debugging
            \Log::error('Unhandled exception', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            // In debug mode, show the actual error for development
            if (config('app.debug')) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'file' => $e->getFile().':'.$e->getLine(),
                ], 500);
            }

            // Everything else = 500 with no stack trace leak
            return response()->json([
                'message' => 'Internal server error.',
            ], 500);
        });
    })->create();
