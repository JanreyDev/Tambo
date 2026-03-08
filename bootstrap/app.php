<?php

declare(strict_types=1);

use App\Http\Middleware\BlockSuspiciousRequests;
use App\Http\Middleware\SecurityHeaders;
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
        // Token-based auth only -- no statefulApi() (removes unnecessary CSRF/session overhead).

        // Security headers on every response.
        $middleware->append(SecurityHeaders::class);

        // Block scanners and attack-path probes before routing.
        $middleware->append(BlockSuspiciousRequests::class);

        // Global API rate limiting: 60 requests per minute per IP.
        $middleware->api(prepend: [
            'throttle:60,1',
        ]);

        // Trust Cloudflare proxy headers so rate limiting uses real client IP.
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR |
                     Request::HEADER_X_FORWARDED_HOST |
                     Request::HEADER_X_FORWARDED_PORT |
                     Request::HEADER_X_FORWARDED_PROTO |
                     Request::HEADER_X_FORWARDED_AWS_ELB,
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Unauthenticated requests: JSON 401 for API, redirect to / for browsers.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            return redirect('/');
        });

        // Return JSON 404 for API routes.
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                return response()->json([
                    'message' => 'Resource not found.',
                ], 404);
            }

            return null;
        });

        // Catch truly unhandled exceptions on API routes -- never leak internals.
        // Let Laravel handle ValidationException and HttpExceptionInterface
        // normally (they produce proper JSON responses).
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (! ($request->is('api/*') || $request->wantsJson())) {
                return null;
            }

            if ($e instanceof ValidationException
                || $e instanceof AuthenticationException
                || $e instanceof HttpExceptionInterface) {
                return null;
            }

            return response()->json([
                'message' => 'Internal server error.',
            ], 500);
        });
    })->create();
