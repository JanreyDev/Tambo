<?php

use App\Http\Middleware\SetTenantContext;
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
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'tenant' => SetTenantContext::class,
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
        // Return JSON for API 404s
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Resource not found.',
                ], 404);
            }
        });

        // Catch truly unhandled exceptions on API routes — never leak internals.
        // Let Laravel handle ValidationException, AuthenticationException, and
        // HttpExceptionInterface normally (they produce proper JSON responses).
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (! ($request->is('api/*') || $request->expectsJson())) {
                return null;
            }

            // Let Laravel's built-in handlers produce proper responses for these
            if ($e instanceof ValidationException
                || $e instanceof AuthenticationException
                || $e instanceof HttpExceptionInterface) {
                return null;
            }

            // Everything else = 500 with no stack trace leak
            return response()->json([
                'message' => 'Internal server error.',
            ], 500);
        });
    })->create();
