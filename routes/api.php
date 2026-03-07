<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AdminUserController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\PlatformSettingController;
use App\Http\Controllers\Api\V1\ProductConnectionController;
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
