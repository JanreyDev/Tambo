<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\AdminUser;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Authenticate an admin user and issue a Sanctum token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $adminUser = AdminUser::where('username', $validated['username'])->first();

        if ($adminUser === null || ! Hash::check($validated['password'], $adminUser->password)) {
            Log::warning('Failed login attempt', [
                'username' => $validated['username'],
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if ($adminUser->status !== 'active') {
            Log::warning('Login attempt on inactive account', [
                'username' => $validated['username'],
                'status' => $adminUser->status,
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Your account is not active. Contact your administrator.',
            ], 403);
        }

        $deviceName = $validated['device_name'] ?? 'primex-admin';

        $token = $adminUser->createToken(
            name: $deviceName,
            expiresAt: now()->addDays(30),
        );

        $adminUser->recordLogin(
            ipAddress: $request->ip() ?? 'unknown',
            userAgent: $request->userAgent(),
        );

        $adminUser->load('roles', 'permissions');

        return response()->json([
            'message' => 'Login successful.',
            'data' => [
                'user' => [
                    'id' => $adminUser->id,
                    'email' => $adminUser->email,
                    'username' => $adminUser->username,
                    'first_name' => $adminUser->first_name,
                    'last_name' => $adminUser->last_name,
                    'middle_name' => $adminUser->middle_name,
                    'full_name' => $adminUser->full_name,
                    'phone' => $adminUser->phone,
                    'photo_url' => $adminUser->photo_url,
                    'role' => $adminUser->role,
                    'status' => $adminUser->status,
                    'roles' => $adminUser->roles->pluck('name'),
                    'permissions' => $adminUser->getAllPermissions()->pluck('name'),
                    'last_login_at' => $adminUser->last_login_at,
                    'preferences' => $adminUser->preferences,
                ],
                'token' => $token->plainTextToken,
                'expires_at' => now()->addDays(30)->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get the authenticated admin user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $adminUser = $request->user();
        $adminUser->load('roles', 'permissions');

        return response()->json([
            'data' => [
                'id' => $adminUser->id,
                'email' => $adminUser->email,
                'username' => $adminUser->username,
                'first_name' => $adminUser->first_name,
                'last_name' => $adminUser->last_name,
                'middle_name' => $adminUser->middle_name,
                'full_name' => $adminUser->full_name,
                'phone' => $adminUser->phone,
                'photo_url' => $adminUser->photo_url,
                'role' => $adminUser->role,
                'status' => $adminUser->status,
                'roles' => $adminUser->roles->pluck('name'),
                'permissions' => $adminUser->getAllPermissions()->pluck('name'),
                'last_login_at' => $adminUser->last_login_at,
                'preferences' => $adminUser->preferences,
            ],
        ]);
    }

    /**
     * Logout the current session (revoke current token).
     */
    public function logout(Request $request): JsonResponse
    {
        $adminUser = $request->user();

        AuditLog::log(
            adminUserId: $adminUser->id,
            action: 'logout',
            resourceType: 'admin_user',
            resourceId: $adminUser->id,
            description: "Admin user {$adminUser->username} logged out",
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Logout all sessions (revoke all tokens).
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $adminUser = $request->user();

        AuditLog::log(
            adminUserId: $adminUser->id,
            action: 'logout_all',
            resourceType: 'admin_user',
            resourceId: $adminUser->id,
            description: "Admin user {$adminUser->username} revoked all sessions",
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'All sessions revoked successfully.',
        ]);
    }
}
