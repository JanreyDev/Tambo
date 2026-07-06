<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    /**
     * List all admin users with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'string', 'in:active,inactive,suspended'],
            'role' => ['sometimes', 'string', 'in:super_admin,admin,viewer'],
            'search' => ['sometimes', 'string', 'max:255'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = AdminUser::with('roles')
            ->orderBy('last_name')
            ->orderBy('first_name');

        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (isset($validated['role'])) {
            $query->where('role', $validated['role']);
        }

        if (isset($validated['search'])) {
            $searchTerm = $validated['search'];
            $query->where(function ($q) use ($searchTerm): void {
                $q->where('first_name', 'ilike', "%{$searchTerm}%")
                    ->orWhere('last_name', 'ilike', "%{$searchTerm}%")
                    ->orWhere('username', 'ilike', "%{$searchTerm}%")
                    ->orWhere('email', 'ilike', "%{$searchTerm}%");
            });
        }

        $perPage = $validated['per_page'] ?? 25;
        $users = $query->paginate($perPage);

        return response()->json($users);
    }

    /**
     * Show a single admin user.
     */
    public function show(string $id): JsonResponse
    {
        $adminUser = AdminUser::with('roles', 'permissions')->findOrFail($id);

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
                'created_at' => $adminUser->created_at,
                'updated_at' => $adminUser->updated_at,
            ],
        ]);
    }

    /**
     * Create a new admin user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255', 'unique:admin_users,email'],
            'username' => ['required', 'string', 'max:100', 'unique:admin_users,username', 'alpha_dash'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'role' => ['sometimes', 'string', 'in:super_admin,admin,viewer'],
            'status' => ['sometimes', 'string', 'in:active,inactive,suspended'],
        ]);

        $validated['created_by'] = $request->user()->id;

        $adminUser = AdminUser::create($validated);

        // Assign Spatie role matching the role column
        $spatieRole = $validated['role'] ?? 'admin';
        $adminUser->assignRole($spatieRole);

        AuditLog::log(
            adminUserId: $request->user()->id,
            action: 'create',
            resourceType: 'admin_user',
            resourceId: $adminUser->id,
            description: "Created admin user: {$adminUser->username}",
            metadata: ['role' => $spatieRole],
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'message' => 'Admin user created successfully.',
            'data' => [
                'id' => $adminUser->id,
                'email' => $adminUser->email,
                'username' => $adminUser->username,
                'first_name' => $adminUser->first_name,
                'last_name' => $adminUser->last_name,
                'role' => $adminUser->role,
                'status' => $adminUser->status,
            ],
        ], 201);
    }

    /**
     * Update an existing admin user.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $adminUser = AdminUser::findOrFail($id);

        $validated = $request->validate([
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('admin_users', 'email')->ignore($adminUser->id)],
            'username' => ['sometimes', 'string', 'max:100', 'alpha_dash', Rule::unique('admin_users', 'username')->ignore($adminUser->id)],
            'password' => ['sometimes', 'string', 'min:8', 'max:255'],
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'middle_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'photo_url' => ['sometimes', 'nullable', 'string', 'url:http,https', 'max:500'],
            'role' => ['sometimes', 'string', 'in:super_admin,admin,viewer'],
            'status' => ['sometimes', 'string', 'in:active,inactive,suspended'],
            'preferences' => ['sometimes', 'nullable', 'array'],
        ]);

        $validated['updated_by'] = $request->user()->id;

        $adminUser->update($validated);

        // Sync Spatie role if role column was updated
        if (isset($validated['role'])) {
            $adminUser->syncRoles([$validated['role']]);
        }

        AuditLog::log(
            adminUserId: $request->user()->id,
            action: 'update',
            resourceType: 'admin_user',
            resourceId: $adminUser->id,
            description: "Updated admin user: {$adminUser->username}",
            metadata: ['updated_fields' => array_keys($validated)],
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'message' => 'Admin user updated successfully.',
            'data' => [
                'id' => $adminUser->id,
                'email' => $adminUser->email,
                'username' => $adminUser->username,
                'first_name' => $adminUser->first_name,
                'last_name' => $adminUser->last_name,
                'middle_name' => $adminUser->middle_name,
                'full_name' => $adminUser->full_name,
                'role' => $adminUser->role,
                'status' => $adminUser->status,
            ],
        ]);
    }

    /**
     * Soft-delete an admin user.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $adminUser = AdminUser::findOrFail($id);

        // Prevent self-deletion
        if ($adminUser->id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], 403);
        }

        $adminUser->update(['deleted_by' => $request->user()->id]);
        $adminUser->tokens()->delete();
        $adminUser->delete();

        AuditLog::log(
            adminUserId: $request->user()->id,
            action: 'delete',
            resourceType: 'admin_user',
            resourceId: $adminUser->id,
            description: "Deleted admin user: {$adminUser->username}",
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'message' => 'Admin user deleted successfully.',
        ]);
    }
}
