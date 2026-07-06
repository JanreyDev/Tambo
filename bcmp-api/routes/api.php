<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\Admin\AdminBarangayController;
use App\Http\Controllers\Api\V1\Admin\MarketplaceAdminController;
use App\Http\Controllers\Api\V1\Admin\PlatformUpdateController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PsgcController;
use App\Http\Controllers\Api\V1\Tenant\AiController;
use App\Http\Controllers\Api\V1\Tenant\AssetController;
use App\Http\Controllers\Api\V1\Tenant\AttendanceRecordController;
use App\Http\Controllers\Api\V1\Tenant\BarangayPostController;
use App\Http\Controllers\Api\V1\Tenant\BarangaySettingsController;
use App\Http\Controllers\Api\V1\Tenant\BlotterController;
use App\Http\Controllers\Api\V1\Tenant\BudgetController;
use App\Http\Controllers\Api\V1\Tenant\CashbookEntryController;
use App\Http\Controllers\Api\V1\Tenant\CollectionsDepositController;
use App\Http\Controllers\Api\V1\Tenant\CouncilController;
use App\Http\Controllers\Api\V1\Tenant\CouncilSessionController;
use App\Http\Controllers\Api\V1\Tenant\DashboardController;
use App\Http\Controllers\Api\V1\Tenant\DisbursementVoucherController;
use App\Http\Controllers\Api\V1\Tenant\DocumentRouteController;
use App\Http\Controllers\Api\V1\Tenant\DocumentTemplateController;
use App\Http\Controllers\Api\V1\Tenant\DriveController;
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
use App\Http\Controllers\Api\V1\Tenant\AddressEntryController;
use App\Http\Controllers\Api\V1\Tenant\MapController;
use App\Http\Controllers\Api\V1\Tenant\MarketplaceController;
use App\Http\Controllers\Api\V1\Tenant\MessageController;
use App\Http\Controllers\Api\V1\Tenant\UserController;
use App\Http\Controllers\Api\V1\Tenant\OfficeController;
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
use App\Http\Controllers\Api\V1\Tenant\VoterController;
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
        // turnstile middleware is a no-op when TURNSTILE_SECRET_KEY is unset (current dev state).
        // Set the key in prod .env to activate bot defense on these endpoints.
        Route::post('login', [AuthController::class, 'login'])
            ->middleware(['throttle:5,1', 'turnstile']); // 5/min IP + Turnstile bot gate
        Route::post('check-username', [AuthController::class, 'checkUsername'])
            ->middleware('throttle:10,1'); // 10/min — read-only username lookup
        Route::post('forgot-password', [AuthController::class, 'forgotPassword'])
            ->middleware(['throttle:5,1', 'turnstile']); // 5/min + Turnstile (SMS spam defense)
        Route::post('verify-reset-otp', [AuthController::class, 'verifyResetOtp'])
            ->middleware('throttle:5,1'); // 5/min — OTP guesses already rate-limited tightly
        Route::post('reset-password', [AuthController::class, 'resetPassword'])
            ->middleware(['throttle:5,1', 'turnstile']); // 5/min + Turnstile
    });

    // ── PSGC lookup routes (public -- geographic data, used by founder dashboard proxy) ──
    Route::prefix('psgc')->group(function () {
        Route::get('provinces', [PsgcController::class, 'provinces']);
        Route::get('provinces/{code}/cities', [PsgcController::class, 'cities']);
        Route::get('cities/{code}/barangays', [PsgcController::class, 'barangays']);
    });

    // ── Authenticated ──

    Route::middleware(['auth:sanctum'])->group(function () {

        // Auth
        Route::prefix('auth')->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
            Route::post('logout-all', [AuthController::class, 'logoutAll']);
        });

        // Per-account preferences (UI language, etc.) — small, frequent, separate from profile
        Route::patch('me/preferences', [AuthController::class, 'updatePreferences']);

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

            // Marketplace admin — global product catalog + cross-barangay orders
            Route::prefix('marketplace')->group(function () {
                Route::get('products', [MarketplaceAdminController::class, 'index']);
                Route::post('products', [MarketplaceAdminController::class, 'store']);
                Route::put('products/{id}', [MarketplaceAdminController::class, 'update']);
                Route::delete('products/{id}', [MarketplaceAdminController::class, 'destroy']);
                Route::get('orders', [MarketplaceAdminController::class, 'orders']);
                Route::patch('orders/{id}/status', [MarketplaceAdminController::class, 'updateOrderStatus']);
            });
        });

        // ── Tenant-scoped routes ──

        Route::middleware(['tenant'])->group(function () {

            // ── Barangay Settings ──
            Route::prefix('settings')->group(function () {
                Route::get('/', [BarangaySettingsController::class, 'show']);
                Route::patch('/', [BarangaySettingsController::class, 'update']);
                Route::get('/usage', [BarangaySettingsController::class, 'usage']);
                Route::post('/logo', [BarangaySettingsController::class, 'uploadLogo'])->middleware('throttle:10,1');
                Route::post('/seal', [BarangaySettingsController::class, 'uploadSeal'])->middleware('throttle:10,1');
                Route::post('/municipality-logo', [BarangaySettingsController::class, 'uploadMunicipalityLogo'])->middleware('throttle:10,1');
                Route::get('/boundary', [BarangaySettingsController::class, 'showBoundary']);
                Route::post('/boundary/refresh', [BarangaySettingsController::class, 'refreshBoundary'])->middleware('throttle:6,1');
            });

            // ── Staff User Management ──
            Route::get('roles', [UserController::class, 'roles']);
            Route::get('permissions', [UserController::class, 'permissions']);
            Route::apiResource('users', UserController::class);

            // Dashboard
            Route::prefix('dashboard')->group(function () {
                Route::get('stats', [DashboardController::class, 'stats']);
                Route::get('activity', [DashboardController::class, 'activity']);
                Route::get('recent-residents', [DashboardController::class, 'recentResidents']);
                Route::get('sign-ins', [DashboardController::class, 'signIns']);
                Route::get('credits', [DashboardController::class, 'credits']);
                Route::get('document-trend', [DashboardController::class, 'documentTrend']);
                Route::get('pending-requests', [DashboardController::class, 'pendingRequests']);
                Route::get('upcoming-events', [DashboardController::class, 'upcomingEvents']);
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

            // ── Voters ──
            Route::get('voters/stats', [VoterController::class, 'stats']);
            Route::get('voters/precincts', [VoterController::class, 'precincts']);
            Route::post('voters/preview', [VoterController::class, 'preview']);
            Route::post('voters/import', [VoterController::class, 'import']);
            Route::delete('voters', [VoterController::class, 'clear']);
            Route::apiResource('voters', VoterController::class)->only(['index']);
            Route::get('voters/{voter}/suggestions', [VoterController::class, 'suggestions']);
            Route::post('voters/{voter}/link', [VoterController::class, 'link']);
            Route::post('voters/{voter}/unlink', [VoterController::class, 'unlink']);

            // ── Records ──
            Route::post('residents/send-otp', [ResidentController::class, 'sendOtp']);
            Route::post('residents/check-duplicate', [ResidentController::class, 'checkDuplicate']);
            Route::get('residents/export', [ResidentController::class, 'export']);
            Route::post('residents/import/preview', [ResidentController::class, 'importPreview']);
            Route::post('residents/import', [ResidentController::class, 'import']);
            Route::get('residents/import/batches', [ResidentController::class, 'importBatches']);
            Route::delete('residents/import/batches/{batchId}', [ResidentController::class, 'rollbackImport']);
            Route::get('residents/{resident}/activity', [ResidentController::class, 'activity']);
            Route::get('residents/{resident}/print', [ResidentController::class, 'printRecord']);
            Route::post('residents/{resident}/sms', [ResidentController::class, 'sendSms'])
                ->middleware('throttle:10,1'); // 10 SMS per minute per user
            Route::post('residents/{resident}/email', [ResidentController::class, 'sendEmail']);
            Route::get('residents/{resident}/sms-history', [ResidentController::class, 'smsHistory']);
            Route::post('residents/{resident}/restore', [ResidentController::class, 'restore']);
            Route::delete('residents/{resident}/force', [ResidentController::class, 'forceDelete']);
            Route::apiResource('residents', ResidentController::class);

            // ── Address Entries (Smart combobox learned values per barangay) ──
            Route::get('address-entries', [AddressEntryController::class, 'index']);
            Route::post('address-entries', [AddressEntryController::class, 'store']);

            // ── Map ──
            Route::prefix('map')->group(function () {
                Route::get('residents', [MapController::class, 'residents']);
                Route::get('stats', [MapController::class, 'stats']);
                Route::get('layers', [MapController::class, 'layers']);
            });
            Route::get('establishments/export', [EstablishmentController::class, 'export']);
            Route::post('establishments/import/preview', [EstablishmentController::class, 'importPreview']);
            Route::post('establishments/import', [EstablishmentController::class, 'import']);
            Route::get('establishments/stats', [EstablishmentController::class, 'stats']);
            Route::post('establishments/check-duplicate', [EstablishmentController::class, 'checkDuplicate']);
            Route::post('establishments/{id}/permit', [EstablishmentController::class, 'permit']);
            Route::post('establishments/{id}/renew', [EstablishmentController::class, 'renew']);
            Route::post('establishments/{id}/close', [EstablishmentController::class, 'close']);
            Route::get('establishments/{id}/transactions', [EstablishmentController::class, 'transactions']);
            Route::post('establishments/{id}/sms', [EstablishmentController::class, 'sendSms']);
            Route::get('establishments/{id}/sms-history', [EstablishmentController::class, 'smsHistory']);
            Route::get('establishments/{id}/activity', [EstablishmentController::class, 'activity']);
            Route::apiResource('establishments', EstablishmentController::class);

            Route::get('lots-buildings/export', [LotBuildingController::class, 'export']);
            Route::post('lots-buildings/import/preview', [LotBuildingController::class, 'importPreview']);
            Route::post('lots-buildings/import', [LotBuildingController::class, 'import']);
            Route::get('lots-buildings/stats', [LotBuildingController::class, 'stats']);
            Route::post('lots-buildings/check-duplicate', [LotBuildingController::class, 'checkDuplicate']);
            Route::post('lots-buildings/{id}/clearance', [LotBuildingController::class, 'clearance']);
            Route::get('lots-buildings/{id}/transactions', [LotBuildingController::class, 'transactions']);
            Route::post('lots-buildings/{id}/sms', [LotBuildingController::class, 'sendSms']);
            Route::get('lots-buildings/{id}/sms-history', [LotBuildingController::class, 'smsHistory']);
            Route::get('lots-buildings/{id}/activity', [LotBuildingController::class, 'activity']);
            Route::apiResource('lots-buildings', LotBuildingController::class);
            Route::apiResource('households', HouseholdController::class);

            // ── Officials ──
            Route::apiResource('puroks', PurokController::class);
            Route::apiResource('officials', OfficialController::class);
            Route::apiResource('councils', CouncilController::class);
            Route::apiResource('council-sessions', CouncilSessionController::class);

            // ── Documents ──
            Route::post('document-templates/{id}/clone', [DocumentTemplateController::class, 'clone']);
            Route::apiResource('document-templates', DocumentTemplateController::class);
            Route::get('issued-documents/stats', [IssuedDocumentController::class, 'stats']);
            Route::post('issued-documents/ai-fill', [IssuedDocumentController::class, 'aiFill']);
            Route::apiResource('issued-documents', IssuedDocumentController::class);
            Route::get('issued-documents/{id}/pdf', [IssuedDocumentController::class, 'downloadPdf']);
            Route::post('issued-documents/{id}/regenerate', [IssuedDocumentController::class, 'regeneratePdf']);
            Route::apiResource('document-routes', DocumentRouteController::class);

            // ── Judicial ──
            Route::get('kp-cases/stats', [KpCaseController::class, 'stats']);
            Route::post('kp-cases/{id}/sms', [KpCaseController::class, 'sendSms']);
            Route::get('kp-cases/{id}/sms-history', [KpCaseController::class, 'smsHistory']);
            Route::get('kp-cases/{id}/activity', [KpCaseController::class, 'activity']);
            Route::post('kp-cases/{id}/log-document', [KpCaseController::class, 'logDocument']);
            Route::post('kp-cases/{id}/generate-document', [KpCaseController::class, 'generateDocument']);
            Route::apiResource('kp-cases', KpCaseController::class)->except(['destroy']);
            Route::apiResource('kp-case-parties', KpCasePartyController::class);
            Route::apiResource('kp-case-hearings', KpCaseHearingController::class);
            Route::get('blotters/stats', [BlotterController::class, 'stats']);
            Route::post('blotters/{id}/generate-document', [BlotterController::class, 'generateDocument']);
            Route::apiResource('blotters', BlotterController::class);
            // ── VAWC (RA 9262 — restricted access, permission-gated) ──
            Route::middleware('permission:vawc.view')->group(function () {
                Route::get('vawc-cases', [VawcCaseController::class, 'index']);
                Route::get('vawc-cases/{id}', [VawcCaseController::class, 'show']);
            });
            Route::middleware('permission:vawc.create')->group(function () {
                Route::post('vawc-cases', [VawcCaseController::class, 'store']);
                Route::post('vawc-cases/{id}/generate-document', [VawcCaseController::class, 'generateDocument']);
            });
            Route::middleware('permission:vawc.edit')->group(function () {
                Route::put('vawc-cases/{id}', [VawcCaseController::class, 'update']);
                Route::patch('vawc-cases/{id}', [VawcCaseController::class, 'update']);
            });
            Route::delete('vawc-cases/{id}', [VawcCaseController::class, 'destroy'])
                ->middleware('permission:vawc.delete');

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
            Route::apiResource('offices', OfficeController::class);
            Route::apiResource('employees', EmployeeController::class);
            Route::apiResource('attendance-records', AttendanceRecordController::class);

            // ── Public Portal (admin-side management) ──
            Route::apiResource('posts', BarangayPostController::class);
            Route::apiResource('public-complaints', PublicComplaintController::class)->except(['store', 'destroy']);
            Route::apiResource('public-document-requests', PublicDocumentRequestController::class)->except(['store', 'destroy']);

            // ── Messages (internal email) ──
            Route::prefix('messages')->group(function () {
                Route::get('/', [MessageController::class, 'index']);
                Route::post('/', [MessageController::class, 'store']);
                Route::get('users', [MessageController::class, 'users']);
                Route::get('{id}', [MessageController::class, 'show']);
                Route::patch('{id}', [MessageController::class, 'update']);
                Route::delete('{id}', [MessageController::class, 'destroy']);
            });

            // ── Marketplace ──
            Route::prefix('marketplace')->group(function () {
                Route::get('products', [MarketplaceController::class, 'products']);
                Route::get('products/{id}', [MarketplaceController::class, 'product']);
                Route::get('cart', [MarketplaceController::class, 'cart']);
                Route::post('cart', [MarketplaceController::class, 'addToCart']);
                Route::patch('cart/{id}', [MarketplaceController::class, 'updateCart']);
                Route::delete('cart/{id}', [MarketplaceController::class, 'removeFromCart']);
                Route::get('orders', [MarketplaceController::class, 'orders']);
                Route::get('orders/{id}', [MarketplaceController::class, 'order']);
                Route::post('checkout', [MarketplaceController::class, 'checkout']);
                Route::patch('orders/{id}/cancel', [MarketplaceController::class, 'cancelOrder']);
            });

            // ── Drive ──
            Route::prefix('drive')->group(function () {
                Route::get('stats', [DriveController::class, 'stats']);
                Route::get('folders', [DriveController::class, 'folders']);
                Route::post('folders', [DriveController::class, 'createFolder']);
                Route::get('folders/{id}', [DriveController::class, 'folder']);
                Route::patch('folders/{id}', [DriveController::class, 'updateFolder']);
                Route::delete('folders/{id}', [DriveController::class, 'deleteFolder']);
                Route::get('files', [DriveController::class, 'files']);
                Route::post('files', [DriveController::class, 'upload']);
                Route::get('files/{id}/download', [DriveController::class, 'download']);
                Route::patch('files/{id}', [DriveController::class, 'updateFile']);
                Route::delete('files/{id}', [DriveController::class, 'deleteFile']);
            });
        });
    });
});

Route::get('/debug/force-regenerate', function() {
    \Artisan::call('view:clear');
    $doc = \App\Models\Tenant\Documents\IssuedDocument::latest()->first();
    $tmpl = \App\Models\Tenant\Documents\DocumentTemplate::find($doc->template_id);
    $b = \App\Models\Admin\Barangay::find($doc->barangay_id);
    $svc = app(\App\Services\DocumentPdfService::class);
    $file = $svc->generateAndStore($doc, $tmpl, $b, null, null);
    $doc->update(['pdf_file_id' => $file->id]);
    return response('Regenerated latest document! ID: ' . $doc->id . ' File ID: ' . $file->id);
});

Route::get('/debug/seed-sample-voters', function() {
    $tambo = \App\Models\Admin\Barangay::where('name', 'Tambo')->first();
    if ($tambo) {
        \App\Models\Tenant\Voter::where('barangay_id', $tambo->id)->delete();
        $voters = [
            [
                'last_name' => 'Dela Cruz',
                'first_name' => 'Juan',
                'middle_name' => 'Santos',
                'full_name' => 'DELA CRUZ, JUAN SANTOS',
                'precinct_number' => '0019C',
                'address' => 'Purok 3, Rizal St.',
                'application_number' => '1420-0019C-A1526JDS20000',
            ],
            [
                'last_name' => 'Delacruz',
                'first_name' => 'Juanito',
                'middle_name' => 'S',
                'full_name' => 'DELACRUZ, JUANITO S',
                'precinct_number' => '0019C',
                'address' => 'Blk 2 Lot 11, Rizal St',
                'application_number' => '1420-0019C-A1526JDS20001',
            ],
            [
                'last_name' => 'Reyes',
                'first_name' => 'Robert',
                'middle_name' => 'Aquino',
                'full_name' => 'REYES, ROBERT AQUINO',
                'precinct_number' => '0020A',
                'address' => 'Purok 2, Mabini St.',
                'application_number' => '1420-0020A-R1108RAA20000',
            ],
            [
                'last_name' => 'Dicon',
                'first_name' => 'Lorna',
                'middle_name' => 'Fernandez',
                'full_name' => 'DICON, LORNA FERNANDEZ',
                'precinct_number' => '0021B',
                'address' => 'Purok 4, Luna St.',
                'application_number' => '1420-0021B-D0403LFD20000',
            ],
            [
                'last_name' => 'De Los Santos',
                'first_name' => 'Arman',
                'middle_name' => null,
                'full_name' => 'DE LOS SANTOS, ARMAN',
                'precinct_number' => '0022C',
                'address' => 'Purok 5, Del Pilar St.',
                'application_number' => '1420-0022C-D0620ADS20000',
            ],
        ];
        foreach ($voters as $v) {
            \App\Models\Tenant\Voter::create(array_merge($v, [
                'barangay_id' => $tambo->id,
                'resident_id' => null,
                'matched_at' => null,
                'imported_at' => now(),
            ]));
        }
        return response('Sample voters seeded successfully! Added 5 records for Barangay Tambo.');
    }
    return response('Barangay Tambo not found.', 404);
});

