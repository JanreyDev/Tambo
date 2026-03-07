<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ProductConnection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProductConnectionController extends Controller
{
    /**
     * List all product connections.
     */
    public function index(): JsonResponse
    {
        $connections = ProductConnection::orderBy('product_name')->get();

        return response()->json([
            'data' => $connections->map(fn (ProductConnection $connection) => [
                'id' => $connection->id,
                'product_slug' => $connection->product_slug,
                'product_name' => $connection->product_name,
                'api_base_url' => $connection->api_base_url,
                'status' => $connection->status,
                'is_healthy' => $connection->isHealthy(),
                'last_health_check_at' => $connection->last_health_check_at,
                'last_health_status' => $connection->last_health_status,
                'settings' => $connection->settings,
                'created_at' => $connection->created_at,
                'updated_at' => $connection->updated_at,
            ]),
        ]);
    }

    /**
     * Show a single product connection.
     */
    public function show(string $id): JsonResponse
    {
        $connection = ProductConnection::findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $connection->id,
                'product_slug' => $connection->product_slug,
                'product_name' => $connection->product_name,
                'api_base_url' => $connection->api_base_url,
                'status' => $connection->status,
                'is_healthy' => $connection->isHealthy(),
                'last_health_check_at' => $connection->last_health_check_at,
                'last_health_status' => $connection->last_health_status,
                'settings' => $connection->settings,
                'created_at' => $connection->created_at,
                'updated_at' => $connection->updated_at,
            ],
        ]);
    }

    /**
     * Update a product connection's settings.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $connection = ProductConnection::findOrFail($id);

        $validated = $request->validate([
            'api_base_url' => ['sometimes', 'string', 'url:http,https', 'max:500'],
            'api_token' => ['sometimes', 'string'],
            'status' => ['sometimes', 'string', 'in:active,inactive,error'],
            'settings' => ['sometimes', 'nullable', 'array'],
        ]);

        $connection->update($validated);

        AuditLog::log(
            adminUserId: $request->user()->id,
            action: 'update',
            resourceType: 'product_connection',
            resourceId: $connection->id,
            description: "Updated product connection: {$connection->product_name}",
            metadata: ['updated_fields' => array_keys($validated)],
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'message' => 'Product connection updated successfully.',
            'data' => [
                'id' => $connection->id,
                'product_slug' => $connection->product_slug,
                'product_name' => $connection->product_name,
                'api_base_url' => $connection->api_base_url,
                'status' => $connection->status,
                'is_healthy' => $connection->isHealthy(),
                'last_health_check_at' => $connection->last_health_check_at,
                'last_health_status' => $connection->last_health_status,
                'settings' => $connection->settings,
                'updated_at' => $connection->updated_at,
            ],
        ]);
    }

    /**
     * Check health of a specific product connection.
     */
    public function checkHealth(Request $request, string $id): JsonResponse
    {
        $connection = ProductConnection::findOrFail($id);

        $healthStatus = 'unhealthy';
        $responseTime = null;
        $errorMessage = null;

        try {
            $startTime = microtime(true);

            $response = Http::timeout(5)
                ->withToken($connection->api_token)
                ->get("{$connection->api_base_url}/up");

            $responseTime = round((microtime(true) - $startTime) * 1000);

            if ($response->successful()) {
                $healthStatus = 'healthy';
            } else {
                $healthStatus = 'unhealthy';
                $errorMessage = "HTTP {$response->status()}";
            }
        } catch (\Exception $exception) {
            $healthStatus = 'error';
            $errorMessage = $exception->getMessage();

            Log::error('Product health check failed', [
                'product_slug' => $connection->product_slug,
                'api_base_url' => $connection->api_base_url,
                'error' => $exception->getMessage(),
            ]);
        }

        $connection->update([
            'last_health_check_at' => now(),
            'last_health_status' => $healthStatus,
        ]);

        AuditLog::log(
            adminUserId: $request->user()->id,
            action: 'health_check',
            resourceType: 'product_connection',
            resourceId: $connection->id,
            description: "Health check for {$connection->product_name}: {$healthStatus}",
            metadata: [
                'health_status' => $healthStatus,
                'response_time_ms' => $responseTime,
                'error' => $errorMessage,
            ],
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'data' => [
                'id' => $connection->id,
                'product_slug' => $connection->product_slug,
                'product_name' => $connection->product_name,
                'status' => $healthStatus,
                'response_time_ms' => $responseTime,
                'error' => $errorMessage,
                'checked_at' => now()->toIso8601String(),
            ],
        ]);
    }
}
