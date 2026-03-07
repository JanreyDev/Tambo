<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\ProductConnection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    /**
     * Get the dashboard overview with product statuses and recent activity.
     */
    public function overview(): JsonResponse
    {
        $productConnections = ProductConnection::all();

        $productStatuses = $productConnections->map(fn (ProductConnection $connection) => [
            'id' => $connection->id,
            'product_slug' => $connection->product_slug,
            'product_name' => $connection->product_name,
            'status' => $connection->status,
            'is_healthy' => $connection->isHealthy(),
            'last_health_check_at' => $connection->last_health_check_at,
            'last_health_status' => $connection->last_health_status,
        ]);

        $recentAuditLogCount = AuditLog::where('created_at', '>=', now()->subDay())->count();
        $adminUserCount = AdminUser::count();
        $activeAdminUserCount = AdminUser::where('status', 'active')->count();

        return response()->json([
            'data' => [
                'products' => $productStatuses,
                'audit_logs_last_24h' => $recentAuditLogCount,
                'admin_users' => [
                    'total' => $adminUserCount,
                    'active' => $activeAdminUserCount,
                ],
            ],
        ]);
    }

    /**
     * Check health of all product API connections.
     */
    public function productHealth(): JsonResponse
    {
        $connections = ProductConnection::where('status', '!=', 'inactive')->get();

        $results = $connections->map(function (ProductConnection $connection) {
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

            return [
                'id' => $connection->id,
                'product_slug' => $connection->product_slug,
                'product_name' => $connection->product_name,
                'status' => $healthStatus,
                'response_time_ms' => $responseTime,
                'error' => $errorMessage,
                'checked_at' => now()->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $results,
        ]);
    }
}
