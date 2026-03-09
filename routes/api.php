<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AdminUserController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\Founder\ActivityController;
use App\Http\Controllers\Api\V1\Founder\AlertController;
use App\Http\Controllers\Api\V1\Founder\DeploymentController;
use App\Http\Controllers\Api\V1\Founder\FounderAuthController;
use App\Http\Controllers\Api\V1\Founder\InfrastructureController;
use App\Http\Controllers\Api\V1\Founder\MabiniController;
use App\Http\Controllers\Api\V1\Founder\ProductHealthController;
use App\Http\Controllers\Api\V1\Founder\RevenueController;
use App\Http\Controllers\Api\V1\Founder\SecurityController;
use App\Http\Controllers\Api\V1\PlatformSettingController;
use App\Http\Controllers\Api\V1\ProductConnectionController;
use App\Http\Middleware\FounderAuth;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    // Public routes
    Route::post('auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1');

    // Authenticated routes
    Route::middleware('auth:sanctum')->group(function (): void {
        // Auth
        Route::prefix('auth')->group(function (): void {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
            Route::post('logout-all', [AuthController::class, 'logoutAll']);
        });

        // Dashboard
        Route::get('dashboard/overview', [DashboardController::class, 'overview']);
        Route::get('dashboard/product-health', [DashboardController::class, 'productHealth']);

        // Product Connections (no store/destroy — seeded, managed via update only)
        Route::apiResource('product-connections', ProductConnectionController::class)
            ->except(['store', 'destroy']);
        Route::post('product-connections/{id}/check-health', [ProductConnectionController::class, 'checkHealth']);

        // Audit Logs (read-only)
        Route::get('audit-logs', [AuditLogController::class, 'index']);

        // Admin Users (full CRUD)
        Route::apiResource('admin-users', AdminUserController::class);

        // Platform Settings
        Route::get('settings', [PlatformSettingController::class, 'index']);
        Route::put('settings/{group}/{key}', [PlatformSettingController::class, 'update']);
    });
});

// Founder Command Center routes (passcode auth, not Sanctum).
Route::prefix('v1/founder')->group(function (): void {
    Route::post('verify-passcode', [FounderAuthController::class, 'verifyPasscode'])
        ->middleware('throttle:3,1');

    Route::middleware(FounderAuth::class)->group(function (): void {
        // Session management
        Route::post('heartbeat', [FounderAuthController::class, 'heartbeat']);
        Route::post('logout', [FounderAuthController::class, 'logout']);

        // Infrastructure monitoring
        Route::get('infrastructure/droplets', [InfrastructureController::class, 'droplets']);
        Route::get('infrastructure/databases', [InfrastructureController::class, 'databases']);
        Route::get('infrastructure/domains', [InfrastructureController::class, 'domains']);
        Route::get('infrastructure/spaces', [InfrastructureController::class, 'spaces']);

        // Product health
        Route::get('products/health', [ProductHealthController::class, 'overview']);
        Route::get('products/{slug}/metrics', [ProductHealthController::class, 'metrics']);

        // System alerts
        Route::get('alerts', [AlertController::class, 'index']);
        Route::put('alerts/{id}/acknowledge', [AlertController::class, 'acknowledge']);
        Route::put('alerts/{id}/resolve', [AlertController::class, 'resolve']);

        // Mabini AI
        Route::post('mabini/chat', [MabiniController::class, 'chat']);
        Route::get('mabini/insights', [MabiniController::class, 'insights']);
        Route::get('mabini/conversations', [MabiniController::class, 'conversations']);

        // Security feed
        Route::get('security/feed', [SecurityController::class, 'feed']);

        // Deployments
        Route::get('deployments/recent', [DeploymentController::class, 'recent']);

        // Revenue
        Route::get('revenue', [RevenueController::class, 'overview']);

        // Activity timeline
        Route::get('activity', [ActivityController::class, 'timeline']);
    });
});
