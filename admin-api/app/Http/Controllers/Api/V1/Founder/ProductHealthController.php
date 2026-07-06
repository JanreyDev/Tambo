<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Founder;

use App\Http\Controllers\Controller;
use App\Models\Founder\MetricSnapshot;
use App\Models\ProductConnection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProductHealthController extends Controller
{
    /**
     * Get health overview for all active product connections.
     */
    public function overview(): JsonResponse
    {
        $connections = ProductConnection::where('status', '!=', 'inactive')->get();

        $results = $connections->map(function (ProductConnection $connection): array {
            $healthStatus = 'unknown';
            $responseTime = null;
            $errorMessage = null;

            try {
                $startTime = microtime(true);

                $response = Http::timeout(5)
                    ->withToken($connection->api_token)
                    ->get("{$connection->api_base_url}/up");

                $responseTime = (int) round((microtime(true) - $startTime) * 1000);

                if ($response->successful()) {
                    $healthStatus = 'healthy';
                } else {
                    $healthStatus = 'unhealthy';
                    $errorMessage = "HTTP {$response->status()}";
                }
            } catch (\Exception $e) {
                $healthStatus = 'error';
                $errorMessage = $e->getMessage();

                Log::error('Product health check failed', [
                    'product_slug' => $connection->product_slug,
                    'api_base_url' => $connection->api_base_url,
                    'error' => $e->getMessage(),
                ]);
            }

            // Persist the latest health status.
            $connection->update([
                'last_health_check_at' => now(),
                'last_health_status' => $healthStatus,
            ]);

            return [
                'product' => $connection->product_name,
                'slug' => $connection->product_slug,
                'api_status' => $healthStatus === 'healthy' ? 'healthy' : ($healthStatus === 'error' ? 'unhealthy' : 'unknown'),
                'response_time_ms' => $responseTime ?? 0,
                'error_rate' => 0,
                'active_users' => 0,
                'last_checked_at' => now()->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $results->all(),
        ]);
    }

    /**
     * Get detailed metrics for a specific product.
     */
    public function metrics(string $slug): JsonResponse
    {
        $connection = ProductConnection::where('product_slug', $slug)->first();

        if ($connection === null) {
            return response()->json([
                'message' => "Product '{$slug}' not found.",
            ], 404);
        }

        // Fetch recent metric snapshots if product has a mapped droplet.
        $dropletMetrics = [];
        $dropletId = $connection->settings['droplet_id'] ?? null;

        if ($dropletId !== null) {
            $dropletMetrics = MetricSnapshot::forDroplet((int) $dropletId)
                ->recent(hours: 24)
                ->orderByDesc('recorded_at')
                ->limit(288) // 24h at 5min intervals
                ->get()
                ->map(fn (MetricSnapshot $metric) => [
                    'cpu_percent' => $metric->cpu_percent,
                    'memory_percent' => $metric->memory_percent,
                    'disk_percent' => $metric->disk_percent,
                    'bandwidth_in' => $metric->bandwidth_in,
                    'bandwidth_out' => $metric->bandwidth_out,
                    'recorded_at' => $metric->recorded_at->toIso8601String(),
                ])
                ->all();
        }

        // Do a live health check.
        $healthStatus = 'unknown';
        $responseTime = null;

        try {
            $startTime = microtime(true);
            $response = Http::timeout(5)
                ->withToken($connection->api_token)
                ->get("{$connection->api_base_url}/up");
            $responseTime = (int) round((microtime(true) - $startTime) * 1000);
            $healthStatus = $response->successful() ? 'healthy' : 'unhealthy';
        } catch (\Exception $e) {
            $healthStatus = 'error';
        }

        return response()->json([
            'data' => [
                'product' => [
                    'slug' => $connection->product_slug,
                    'name' => $connection->product_name,
                    'api_base_url' => $connection->api_base_url,
                    'status' => $healthStatus,
                    'response_time_ms' => $responseTime,
                    'last_health_check_at' => $connection->last_health_check_at?->toIso8601String(),
                    'settings' => $connection->settings,
                ],
                'metrics' => $dropletMetrics,
                'droplet_id' => $dropletId,
            ],
        ]);
    }
}
