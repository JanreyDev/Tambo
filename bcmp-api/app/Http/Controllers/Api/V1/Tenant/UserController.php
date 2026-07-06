<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Define assignable roles for a Barangay Admin.
     */
    private const ASSIGNABLE_ROLES = [
        'secretary',
        'treasurer',
        'kagawad',
        'health_worker',
        'tanod',
        'vawc_desk_officer',
        'staff'
    ];

    /**
     * Group permissions logically for the checkbox-based access UI.
     */
    private const PERMISSION_GROUPS = [
        'Residents' => [
            'residents.view' => 'View resident profiles',
            'residents.create' => 'Add new residents',
            'residents.edit' => 'Edit resident profiles',
            'residents.delete' => 'Delete resident profiles',
        ],
        'Establishments' => [
            'establishments.view' => 'View business establishments',
            'establishments.create' => 'Add new establishments',
            'establishments.edit' => 'Edit establishments',
            'establishments.delete' => 'Delete establishments',
        ],
        'Lots & Buildings' => [
            'lots-buildings.view' => 'View lots and buildings',
            'lots-buildings.create' => 'Add new lots/buildings',
            'lots-buildings.edit' => 'Edit lots/buildings',
            'lots-buildings.delete' => 'Delete lots/buildings',
        ],
        'Documents & Clearances' => [
            'documents.view' => 'View document requests',
            'documents.create' => 'Create document clearances',
            'documents.edit' => 'Edit document clearances',
            'documents.delete' => 'Delete documents',
            'documents.approve' => 'Approve/sign clearances',
        ],
        'Judicial & Security' => [
            'kp-cases.view' => 'View Katarungang Pambarangay cases',
            'kp-cases.create' => 'Add KP hearing cases',
            'kp-cases.edit' => 'Edit KP hearing cases',
            'blotters.view' => 'View blotter logs',
            'blotters.create' => 'Create blotter reports',
            'blotters.edit' => 'Edit blotter reports',
            'vawc.view' => 'View sensitive VAWC cases',
            'vawc.create' => 'Add VAWC cases',
            'vawc.edit' => 'Edit VAWC cases',
            'vawc.delete' => 'Delete VAWC cases',
        ],
        'Officials & Governance' => [
            'officials.view' => 'View Barangay officials',
            'officials.manage' => 'Manage Council and Officials roster',
        ],
        'Finance & Payments' => [
            'finance.view' => 'View transactions and ledgers',
            'finance.create' => 'Record fees and collections',
            'finance.approve' => 'Approve vouchers and disbursements',
        ],
        'SMS & Notifications' => [
            'sms.send' => 'Send single SMS texts',
            'sms.blast' => 'Send community SMS blasts',
        ],
        'System Tools' => [
            'settings.view' => 'View settings',
            'settings.manage' => 'Modify barangay preferences and configuration',
            'ai.access' => 'Access Mabini AI assistant features',
        ]
    ];
    /**
     * Enforce staff management authorization checks.
     */
    private function authorizeAdmin(): void
    {
        $user = auth()->user();
        if (!$user || (!$user->isSuperAdmin() && !$user->hasRole('kapitan') && !$user->hasPermissionTo('settings.manage', 'sanctum'))) {
            abort(403, 'Unauthorized staff management access.');
        }
    }

    /**
     * List all users of this Barangay.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin();
        $barangayId = auth()->user()->barangay_id;

        $users = User::where('barangay_id', $barangayId)
            ->with(['roles:id,name', 'permissions:id,name'])
            ->orderBy('first_name')
            ->get();

        $formatted = $users->map(fn($u) => $this->formatUser($u));

        return response()->json($formatted);
    }

    /**
     * Get system assignable roles.
     */
    public function roles(): JsonResponse
    {
        $this->authorizeAdmin();
        return response()->json(self::ASSIGNABLE_ROLES);
    }

    /**
     * Get system permissions grouped by category.
     */
    public function permissions(): JsonResponse
    {
        $this->authorizeAdmin();
        return response()->json(self::PERMISSION_GROUPS);
    }

    /**
     * Add a new staff user.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdmin();
        $barangayId = auth()->user()->barangay_id;

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'extension_name' => ['nullable', 'string', 'max:50'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', Rule::in(self::ASSIGNABLE_ROLES)],
            'custom_permissions' => ['nullable', 'array'],
            'custom_permissions.*' => ['string', 'exists:permissions,name']
        ]);

        $user = User::create([
            'barangay_id' => $barangayId,
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'extension_name' => $validated['extension_name'] ?? null,
            'username' => $validated['username'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'status' => 'active',
        ]);

        $user->assignRole($validated['role']);

        if (!empty($validated['custom_permissions'])) {
            $user->syncPermissions($validated['custom_permissions']);
        }

        return response()->json($this->formatUser($user), 201);
    }

    /**
     * Get user details.
     */
    public function show(string $id): JsonResponse
    {
        $this->authorizeAdmin();
        $barangayId = auth()->user()->barangay_id;

        $user = User::where('id', $id)
            ->where('barangay_id', $barangayId)
            ->firstOrFail();

        return response()->json($this->formatUser($user));
    }

    /**
     * Update staff details, roles, and permissions.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $this->authorizeAdmin();
        $barangayId = auth()->user()->barangay_id;

        $user = User::where('id', $id)
            ->where('barangay_id', $barangayId)
            ->firstOrFail();

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'extension_name' => ['nullable', 'string', 'max:50'],
            'username' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', 'string', Rule::in(self::ASSIGNABLE_ROLES)],
            'status' => ['required', Rule::in(['active', 'suspended'])],
            'custom_permissions' => ['nullable', 'array'],
            'custom_permissions.*' => ['string', 'exists:permissions,name']
        ]);

        $updateData = [
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'extension_name' => $validated['extension_name'] ?? null,
            'username' => $validated['username'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'status' => $validated['status'],
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        // Update role
        $user->syncRoles([$validated['role']]);

        // Sync custom permissions
        $permissions = $validated['custom_permissions'] ?? [];
        $user->syncPermissions($permissions);

        return response()->json($this->formatUser($user));
    }

    /**
     * Delete a staff user.
     */
    public function destroy(string $id): JsonResponse
    {
        $this->authorizeAdmin();
        $current = auth()->user();
        $barangayId = $current->barangay_id;

        $user = User::where('id', $id)
            ->where('barangay_id', $barangayId)
            ->firstOrFail();

        if ($user->id === $current->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 400);
        }

        $user->delete();

        return response()->json(['message' => 'Staff user deleted successfully.']);
    }

    /**
     * Format user output to include clean roles and permissions names.
     */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'middle_name' => $user->middle_name,
            'last_name' => $user->last_name,
            'extension_name' => $user->extension_name,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'role' => $user->roles->first()?->name ?? 'staff',
            'custom_permissions' => $user->permissions->pluck('name')->toArray()
        ];
    }
}
