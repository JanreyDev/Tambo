<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\Admin\AdminBarangayController;
use App\Http\Controllers\Api\V1\Admin\PlatformUpdateController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PsgcController;
use App\Http\Controllers\Api\V1\Tenant\AiController;
use App\Http\Controllers\Api\V1\Tenant\AssetController;
use App\Http\Controllers\Api\V1\Tenant\AttendanceRecordController;
use App\Http\Controllers\Api\V1\Tenant\BarangayPostController;
use App\Http\Controllers\Api\V1\Tenant\BlotterController;
use App\Http\Controllers\Api\V1\Tenant\BudgetController;
use App\Http\Controllers\Api\V1\Tenant\CashbookEntryController;
use App\Http\Controllers\Api\V1\Tenant\CollectionsDepositController;
use App\Http\Controllers\Api\V1\Tenant\CouncilController;
use App\Http\Controllers\Api\V1\Tenant\CouncilSessionController;
use App\Http\Controllers\Api\V1\Tenant\BarangaySettingsController;
use App\Http\Controllers\Api\V1\Tenant\DashboardController;
use App\Http\Controllers\Api\V1\Tenant\DisbursementVoucherController;
use App\Http\Controllers\Api\V1\Tenant\DocumentRouteController;
use App\Http\Controllers\Api\V1\Tenant\DocumentTemplateController;
use App\Http\Controllers\Api\V1\Tenant\EmployeeController;
use App\Http\Controllers\Api\V1\Tenant\EstablishmentController;
use App\Http\Controllers\Api\V1\Tenant\EvacuationController;
use App\Http\Controllers\Api\V1\Tenant\FileController;
use App\Http\Controllers\Api\V1\Tenant\GadPlanController;
use App\Http\Controllers\Api\V1\Tenant\HazardPinController;
use App\Http\Controllers\Api\V1\Tenant\HouseholdController;
use App\Http\Controllers\Api\V1\Tenant\InventoryCategoryController;
use App\Http\Controllers\Api\V1\Tenant\InventoryItemController;
use App\Http\Controllers\Api\V1\Tenant\InventoryTransactionController;
use App\Http\Controllers\Api\V1\Tenant\IssuedDocumentController;
use App\Http\Controllers\Api\V1\Tenant\KpCaseController;
use App\Http\Controllers\Api\V1\Tenant\KpCaseHearingController;
use App\Http\Controllers\Api\V1\Tenant\KpCasePartyController;
use App\Http\Controllers\Api\V1\Tenant\LotBuildingController;
use App\Http\Controllers\Api\V1\Tenant\OfficialController;
use App\Http\Controllers\Api\V1\Tenant\PaymentController;
use App\Http\Controllers\Api\V1\Tenant\PettyCashVoucherController;
use App\Http\Controllers\Api\V1\Tenant\PublicComplaintController;
use App\Http\Controllers\Api\V1\Tenant\PublicDocumentRequestController;
use App\Http\Controllers\Api\V1\Tenant\PurokController;
use App\Http\Controllers\Api\V1\Tenant\ResidentController;
use App\Http\Controllers\Api\V1\Tenant\SmsTransactionController;
use App\Http\Controllers\Api\V1\Tenant\SupplierController;
use App\Http\Controllers\Api\V1\Tenant\TanodController;
use App\Http\Controllers\Api\V1\Tenant\TanodDutyScheduleController;
use App\Http\Controllers\Api\V1\Tenant\TanodIncidentReportController;
use App\Http\Controllers\Api\V1\Tenant\TanodPatrolLogController;
use App\Http\Controllers\Api\V1\Tenant\VawcCaseController;
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
        Route::post('check-username', [AuthController::class, 'checkUsername'])
            ->middleware('throttle:10,1'); // 10 attempts per minute — username lookup
        Route::post('forgot-password', [AuthController::class, 'forgotPassword'])
            ->middleware('throttle:5,1'); // 5 attempts per minute
        Route::post('verify-reset-otp', [AuthController::class, 'verifyResetOtp'])
            ->middleware('throttle:5,1'); // 5 attempts per minute
        Route::post('reset-password', [AuthController::class, 'resetPassword'])
            ->middleware('throttle:5,1'); // 5 attempts per minute
    });

    // ── Authenticated ──

    Route::middleware(['auth:sanctum'])->group(function () {

        // Auth
        Route::prefix('auth')->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
            Route::post('logout-all', [AuthController::class, 'logoutAll']);
        });

        // Account
        Route::prefix('account')->group(function () {
            Route::get('profile', [AccountController::class, 'profile']);
            Route::patch('profile', [AccountController::class, 'updateProfile']);
            Route::post('check-username', [AccountController::class, 'checkUsername'])
                ->middleware('throttle:10,1');
            Route::patch('username', [AccountController::class, 'updateUsername']);
            Route::post('avatar', [AccountController::class, 'uploadAvatar']);
            Route::delete('avatar', [AccountController::class, 'deleteAvatar']);
            Route::patch('password', [AccountController::class, 'updatePassword']);
            Route::get('sessions', [AccountController::class, 'sessions']);
            Route::delete('sessions/{tokenId}', [AccountController::class, 'revokeSession']);
            Route::get('activity', [AccountController::class, 'activity']);
            Route::patch('preferences', [AccountController::class, 'updatePreferences']);
            Route::post('phone/send-otp', [AccountController::class, 'sendPhoneOtp'])
                ->middleware('throttle:5,1');
            Route::post('phone/verify', [AccountController::class, 'verifyPhone'])
                ->middleware('throttle:5,1');
            Route::post('email/send-otp', [AccountController::class, 'sendEmailOtp'])
                ->middleware('throttle:5,1');
            Route::post('email/verify', [AccountController::class, 'verifyEmail'])
                ->middleware('throttle:5,1');
            Route::post('data-export', [AccountController::class, 'requestDataExport']);
            Route::post('request-deletion', [AccountController::class, 'requestDeletion']);

            // Two-factor authentication
            Route::prefix('2fa')->group(function () {
                Route::post('setup', [AccountController::class, 'setup2FA']);
                Route::post('enable', [AccountController::class, 'enable2FA']);
                Route::post('disable', [AccountController::class, 'disable2FA']);
                Route::get('recovery-codes', [AccountController::class, 'getRecoveryCodes']);
                Route::post('recovery-codes/regenerate', [AccountController::class, 'regenerateRecoveryCodes']);
            });
        });

        // Platform updates (no tenant context needed)
        Route::get('platform-updates', [PlatformUpdateController::class, 'index']);

        // ── Admin routes (super_admin only, no tenant context) ──
        Route::prefix('admin')->middleware('super_admin')->group(function () {
            Route::apiResource('barangays', AdminBarangayController::class);
            Route::get('barangays-subscription-stats', [AdminBarangayController::class, 'subscriptionStats']);
            Route::get('barangays/{barangay}/stats', [AdminBarangayController::class, 'stats']);
            Route::post('barangays/{barangay}/recalculate-storage', [AdminBarangayController::class, 'recalculateStorage']);
            Route::post('barangays/recalculate-storage-all', [AdminBarangayController::class, 'recalculateStorageAll']);

            // User account management
            Route::post('barangays/{barangay}/users/{user}/suspend', [AdminBarangayController::class, 'suspendUser']);
            Route::post('barangays/{barangay}/users/{user}/activate', [AdminBarangayController::class, 'activateUser']);
            Route::post('barangays/{barangay}/users/{user}/reset-password', [AdminBarangayController::class, 'resetUserPassword']);
            Route::patch('barangays/{barangay}/users/{user}', [AdminBarangayController::class, 'updateUser']);

            // Barangay data views (admin)
            Route::get('barangays/{barangay}/residents', [AdminBarangayController::class, 'residents']);
            Route::get('barangays/{barangay}/files', [AdminBarangayController::class, 'files']);
        });

        // ── PSGC lookup routes (for onboarding cascading dropdowns) ──
        Route::prefix('psgc')->group(function () {
            Route::get('provinces', [PsgcController::class, 'provinces']);
            Route::get('provinces/{code}/cities', [PsgcController::class, 'cities']);
            Route::get('cities/{code}/barangays', [PsgcController::class, 'barangays']);
        });

        // ── Tenant-scoped routes ──

        Route::middleware(['tenant'])->group(function () {

            // ── Barangay Settings ──
            Route::prefix('settings')->group(function () {
                Route::get('/', [BarangaySettingsController::class, 'show']);
                Route::patch('/', [BarangaySettingsController::class, 'update']);
                Route::get('/usage', [BarangaySettingsController::class, 'usage']);
                Route::post('/logo', [BarangaySettingsController::class, 'uploadLogo']);
                Route::post('/seal', [BarangaySettingsController::class, 'uploadSeal']);
            });

            // Dashboard
            Route::prefix('dashboard')->group(function () {
                Route::get('stats', [DashboardController::class, 'stats']);
                Route::get('activity', [DashboardController::class, 'activity']);
                Route::get('sign-ins', [DashboardController::class, 'signIns']);
                Route::get('credits', [DashboardController::class, 'credits']);
            });

            // ── Mabini AI ──
            Route::prefix('ai')->group(function () {
                Route::get('credits', [AiController::class, 'credits']);
                Route::get('conversations', [AiController::class, 'index']);
                Route::post('conversations', [AiController::class, 'store'])
                    ->middleware('throttle:30,1');
                Route::get('conversations/{conversation}', [AiController::class, 'show']);
                Route::post('conversations/{conversation}/messages', [AiController::class, 'sendMessage'])
                    ->middleware('throttle:30,1');
                Route::delete('conversations/{conversation}', [AiController::class, 'destroy']);
            });

            // ── SMS Transactions ──
            Route::prefix('sms-transactions')->group(function () {
                Route::get('/', [SmsTransactionController::class, 'index']);
                Route::get('summary', [SmsTransactionController::class, 'summary']);
            });

            // ── Files ──
            Route::post('files', [FileController::class, 'store']);
            Route::get('files/{id}/url', [FileController::class, 'url']);
            Route::delete('files/{id}', [FileController::class, 'destroy']);

            // ── Records ──
            Route::post('residents/check-duplicate', [ResidentController::class, 'checkDuplicate']);
            Route::apiResource('residents', ResidentController::class);
            Route::apiResource('establishments', EstablishmentController::class);
            Route::apiResource('lots-buildings', LotBuildingController::class);
            Route::apiResource('households', HouseholdController::class);

            // ── Officials ──
            Route::apiResource('puroks', PurokController::class);
            Route::apiResource('officials', OfficialController::class);
            Route::apiResource('councils', CouncilController::class);
            Route::apiResource('council-sessions', CouncilSessionController::class);

            // ── Documents ──
            Route::apiResource('document-templates', DocumentTemplateController::class);
            Route::apiResource('issued-documents', IssuedDocumentController::class);
            Route::apiResource('document-routes', DocumentRouteController::class);

            // ── Judicial ──
            Route::apiResource('kp-cases', KpCaseController::class);
            Route::apiResource('kp-case-parties', KpCasePartyController::class);
            Route::apiResource('kp-case-hearings', KpCaseHearingController::class);
            Route::apiResource('blotters', BlotterController::class);
            Route::apiResource('vawc-cases', VawcCaseController::class);

            // ── Tanod ──
            Route::apiResource('tanods', TanodController::class);
            Route::apiResource('tanod-duty-schedules', TanodDutyScheduleController::class);
            Route::apiResource('tanod-patrol-logs', TanodPatrolLogController::class);
            Route::apiResource('tanod-incident-reports', TanodIncidentReportController::class);

            // ── Finance ──
            Route::apiResource('budgets', BudgetController::class);
            Route::apiResource('disbursement-vouchers', DisbursementVoucherController::class);
            Route::apiResource('petty-cash-vouchers', PettyCashVoucherController::class);
            Route::apiResource('payments', PaymentController::class);
            Route::apiResource('collections-deposits', CollectionsDepositController::class);
            Route::apiResource('cashbook-entries', CashbookEntryController::class);

            // ── Assets / Inventory ──
            Route::apiResource('suppliers', SupplierController::class);
            Route::apiResource('inventory-categories', InventoryCategoryController::class);
            Route::apiResource('inventory-items', InventoryItemController::class);
            Route::apiResource('inventory-transactions', InventoryTransactionController::class)->except(['update']);
            Route::apiResource('assets', AssetController::class);

            // ── Disaster ──
            Route::apiResource('hazard-pins', HazardPinController::class);
            Route::apiResource('evacuations', EvacuationController::class);

            // ── GAD ──
            Route::apiResource('gad-plans', GadPlanController::class);

            // ── HRIS ──
            Route::apiResource('employees', EmployeeController::class);
            Route::apiResource('attendance-records', AttendanceRecordController::class);

            // ── Public Portal (admin-side management) ──
            Route::apiResource('posts', BarangayPostController::class);
            Route::apiResource('public-complaints', PublicComplaintController::class)->except(['store', 'destroy']);
            Route::apiResource('public-document-requests', PublicDocumentRequestController::class)->except(['store', 'destroy']);
        });
    });
});
