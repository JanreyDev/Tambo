<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AdminUserController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\Founder\ActivityController;
use App\Http\Controllers\Api\V1\Founder\AlertController;
use App\Http\Controllers\Api\V1\Founder\BcmpDocumentTemplateController;
use App\Http\Controllers\Api\V1\Founder\BcmpMarketplaceController;
use App\Http\Controllers\Api\V1\Founder\BcmpTenantController;
use App\Http\Controllers\Api\V1\Founder\DeploymentController;
use App\Http\Controllers\Api\V1\Founder\FounderAuthController;
use App\Http\Controllers\Api\V1\Founder\InfrastructureController;
use App\Http\Controllers\Api\V1\Founder\MabiniController;
use App\Http\Controllers\Api\V1\Founder\ProductHealthController;
use App\Http\Controllers\Api\V1\Founder\PsgcProxyController;
use App\Http\Controllers\Api\V1\Founder\RevenueController;
use App\Http\Controllers\Api\V1\Founder\SecurityController;
use App\Http\Controllers\Api\V1\PlatformSettingController;
use App\Http\Controllers\Api\V1\ProductConnectionController;
use App\Http\Controllers\Api\V1\Vault\VaultAuthController;
use App\Http\Controllers\Api\V1\Vault\VaultController;
use App\Http\Middleware\FounderAuth;
use App\Http\Middleware\VaultAuth;
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
    Route::post('verify-passcode', [FounderAuthController::class, 'verifyPasscode']);

    Route::middleware(FounderAuth::class)->group(function (): void {
        // Session management
        Route::get('heartbeat', [FounderAuthController::class, 'heartbeat']);
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

        // PSGC lookups (proxied to bcmp-api)
        Route::get('psgc/provinces', [PsgcProxyController::class, 'provinces']);
        Route::get('psgc/provinces/{code}/cities', [PsgcProxyController::class, 'cities']);
        Route::get('psgc/cities/{code}/barangays', [PsgcProxyController::class, 'barangays']);

        // BCMP tenant management (proxied to bcmp-api)
        Route::apiResource('bcmp/tenants', BcmpTenantController::class);
        Route::get('bcmp/tenants/{id}/stats', [BcmpTenantController::class, 'stats']);
        Route::post('bcmp/tenants/{id}/recalculate-storage', [BcmpTenantController::class, 'recalculateStorage']);
        Route::post('bcmp/recalculate-storage-all', [BcmpTenantController::class, 'recalculateStorageAll']);
        Route::get('bcmp/subscription-stats', [BcmpTenantController::class, 'subscriptionStats']);
        Route::get('bcmp/pricing', [BcmpTenantController::class, 'pricing']);
        Route::put('bcmp/pricing/{key}', [BcmpTenantController::class, 'updatePricing']);

        // BCMP tenant user management (proxied to bcmp-api)
        Route::post('bcmp/tenants/{id}/users/{userId}/suspend', [BcmpTenantController::class, 'suspendUser']);
        Route::post('bcmp/tenants/{id}/users/{userId}/activate', [BcmpTenantController::class, 'activateUser']);
        Route::post('bcmp/tenants/{id}/users/{userId}/reset-password', [BcmpTenantController::class, 'resetUserPassword']);
        Route::patch('bcmp/tenants/{id}/users/{userId}', [BcmpTenantController::class, 'updateUser']);

        // BCMP tenant data views (proxied to bcmp-api)
        Route::get('bcmp/tenants/{id}/residents', [BcmpTenantController::class, 'residents']);
        Route::get('bcmp/tenants/{id}/files', [BcmpTenantController::class, 'files']);

        // BCMP system document templates (proxied to bcmp-api via super-admin token)
        // barangay_id = null on all templates managed here → auto-visible to all tenants
        Route::apiResource('bcmp/document-templates', BcmpDocumentTemplateController::class)
            ->except(['create', 'edit']);

        // BCMP marketplace admin — product catalog + cross-barangay orders (proxied to bcmp-api)
        Route::prefix('bcmp/marketplace')->group(function () {
            Route::get('products', [BcmpMarketplaceController::class, 'products']);
            Route::post('products', [BcmpMarketplaceController::class, 'storeProduct']);
            Route::put('products/{id}', [BcmpMarketplaceController::class, 'updateProduct']);
            Route::delete('products/{id}', [BcmpMarketplaceController::class, 'destroyProduct']);
            Route::get('orders', [BcmpMarketplaceController::class, 'orders']);
            Route::patch('orders/{id}/status', [BcmpMarketplaceController::class, 'updateOrderStatus']);
        });
    });
});

// Family Vault routes (keyphrase auth, separate from Sanctum and Founder).
Route::prefix('v1/vault')->group(function (): void {
    Route::post('verify-keyphrase', [VaultAuthController::class, 'verifyKeyphrase'])
        ->middleware('throttle:3,60');

    Route::middleware(VaultAuth::class)->group(function (): void {
        // Session management
        Route::get('heartbeat', [VaultAuthController::class, 'heartbeat']);
        Route::post('logout', [VaultAuthController::class, 'logout']);

        // Vault content
        Route::get('categories', [VaultController::class, 'categories']);
        Route::get('categories/{category}', [VaultController::class, 'entriesByCategory']);
        Route::get('guide', [VaultController::class, 'guide']);
        Route::get('entries/{id}', [VaultController::class, 'show']);
    });
});
