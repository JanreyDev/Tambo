<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\Tenant\DashboardController;
use App\Http\Controllers\Api\V1\Tenant\ResidentController;
use App\Http\Controllers\Api\V1\Tenant\EstablishmentController;
use App\Http\Controllers\Api\V1\Tenant\LotBuildingController;
use App\Http\Controllers\Api\V1\Admin\PlatformUpdateController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — V1
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api/v1 via RouteServiceProvider.
| Auth: Laravel Sanctum token-based authentication.
| Tenant: SetTenantContext middleware sets PostgreSQL RLS context.
|
*/

Route::prefix('v1')->group(function () {

    // ── Public (no auth) ──

    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login'])
            ->middleware('throttle:5,1'); // 5 attempts per minute — brute force protection
    });

    // ── Authenticated ──

    Route::middleware(['auth:sanctum'])->group(function () {

        // Auth
        Route::prefix('auth')->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
            Route::post('logout-all', [AuthController::class, 'logoutAll']);
        });

        // Platform updates (no tenant context needed)
        Route::get('platform-updates', [PlatformUpdateController::class, 'index']);

        // ── Tenant-scoped routes ──

        Route::middleware(['tenant'])->group(function () {

            // Dashboard
            Route::prefix('dashboard')->group(function () {
                Route::get('stats', [DashboardController::class, 'stats']);
                Route::get('activity', [DashboardController::class, 'activity']);
                Route::get('sign-ins', [DashboardController::class, 'signIns']);
                Route::get('credits', [DashboardController::class, 'credits']);
            });

            // Records
            Route::apiResource('residents', ResidentController::class);
            Route::apiResource('establishments', EstablishmentController::class);
            Route::apiResource('lots-buildings', LotBuildingController::class);

            // Judicial (stubs — will be built out)
            // Route::apiResource('kp-cases', KpCaseController::class);
            // Route::apiResource('blotters', BlotterController::class);
            // Route::apiResource('vawc-cases', VawcCaseController::class);

            // Documents (stubs)
            // Route::apiResource('document-templates', DocumentTemplateController::class);
            // Route::apiResource('issued-documents', IssuedDocumentController::class);

            // Officials
            // Route::apiResource('officials', OfficialController::class);
            // Route::apiResource('puroks', PurokController::class);
        });
    });
});
