<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestId
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->header('X-Request-ID') ?? (string) Str::uuid();

        // Make available throughout the app
        app()->instance('request-id', $requestId);

        // Add to log context so every Log:: call includes it
        \Illuminate\Support\Facades\Log::shareContext(['request_id' => $requestId]);

        $response = $next($request);

        // Return in response header for frontend correlation
        $response->headers->set('X-Request-ID', $requestId);

        return $response;
    }
}
