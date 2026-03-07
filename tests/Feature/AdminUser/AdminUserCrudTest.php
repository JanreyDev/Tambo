<?php

declare(strict_types=1);

use App\Models\AdminUser;
use Tests\Traits\SeedsRoles;

uses(SeedsRoles::class);

beforeEach(function () {
    $this->seedRoles();

    $this->admin = AdminUser::factory()->create([
        'status' => 'active',
    ]);
    $this->token = $this->admin->createToken('test')->plainTextToken;
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
});

test('can list admin users', function () {
    AdminUser::factory()->count(3)->create();

    $response = $this->getJson('/api/v1/admin-users', $this->headers);

    $response->assertOk()
        ->assertJsonStructure([
            'data',
        ]);
});

test('list admin users is paginated', function () {
    AdminUser::factory()->count(30)->create();

    $response = $this->getJson('/api/v1/admin-users?per_page=10', $this->headers);

    $response->assertOk()
        ->assertJsonPath('per_page', 10);
});

test('can filter admin users by status', function () {
    AdminUser::factory()->inactive()->count(2)->create();
    AdminUser::factory()->create(['status' => 'active']);

    $response = $this->getJson('/api/v1/admin-users?status=inactive', $this->headers);

    $response->assertOk();

    $users = collect($response->json('data'));
    $users->each(function ($user) {
        expect($user['status'])->toBe('inactive');
    });
});

test('can filter admin users by role', function () {
    AdminUser::factory()->superAdmin()->create();
    AdminUser::factory()->viewer()->create();

    $response = $this->getJson('/api/v1/admin-users?role=viewer', $this->headers);

    $response->assertOk();

    $users = collect($response->json('data'));
    $users->each(function ($user) {
        expect($user['role'])->toBe('viewer');
    });
});

test('can create admin user', function () {
    $response = $this->postJson('/api/v1/admin-users', [
        'username' => 'newadmin',
        'email' => 'newadmin@pulitika.ph',
        'password' => 'securePass123!',
        'first_name' => 'New',
        'last_name' => 'Admin',
    ], $this->headers);

    $response->assertCreated()
        ->assertJsonPath('data.username', 'newadmin')
        ->assertJsonPath('data.email', 'newadmin@pulitika.ph')
        ->assertJsonPath('data.first_name', 'New')
        ->assertJsonPath('data.last_name', 'Admin');

    $this->assertDatabaseHas('admin_users', [
        'username' => 'newadmin',
        'email' => 'newadmin@pulitika.ph',
    ]);
});

test('can create admin user with role', function () {
    $response = $this->postJson('/api/v1/admin-users', [
        'username' => 'superadmin',
        'email' => 'super@pulitika.ph',
        'password' => 'securePass123!',
        'first_name' => 'Super',
        'last_name' => 'Admin',
        'role' => 'super_admin',
    ], $this->headers);

    $response->assertCreated()
        ->assertJsonPath('data.role', 'super_admin');
});

test('create admin user validates required fields', function () {
    $response = $this->postJson('/api/v1/admin-users', [], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['username', 'email', 'password', 'first_name', 'last_name']);
});

test('create admin user validates unique email', function () {
    $existing = AdminUser::factory()->create(['email' => 'taken@pulitika.ph']);

    $response = $this->postJson('/api/v1/admin-users', [
        'username' => 'another',
        'email' => 'taken@pulitika.ph',
        'password' => 'securePass123!',
        'first_name' => 'Another',
        'last_name' => 'User',
    ], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

test('create admin user validates unique username', function () {
    $existing = AdminUser::factory()->create(['username' => 'taken']);

    $response = $this->postJson('/api/v1/admin-users', [
        'username' => 'taken',
        'email' => 'new@pulitika.ph',
        'password' => 'securePass123!',
        'first_name' => 'New',
        'last_name' => 'User',
    ], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['username']);
});

test('create admin user validates minimum password length', function () {
    $response = $this->postJson('/api/v1/admin-users', [
        'username' => 'short',
        'email' => 'short@pulitika.ph',
        'password' => 'abc',
        'first_name' => 'Short',
        'last_name' => 'Pass',
    ], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

test('create admin user tracks created_by', function () {
    $response = $this->postJson('/api/v1/admin-users', [
        'username' => 'tracked',
        'email' => 'tracked@pulitika.ph',
        'password' => 'securePass123!',
        'first_name' => 'Tracked',
        'last_name' => 'User',
    ], $this->headers);

    $response->assertCreated();

    $this->assertDatabaseHas('admin_users', [
        'username' => 'tracked',
        'created_by' => $this->admin->id,
    ]);
});

test('can view admin user', function () {
    $user = AdminUser::factory()->create();

    $response = $this->getJson("/api/v1/admin-users/{$user->id}", $this->headers);

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                'id',
                'email',
                'username',
                'first_name',
                'last_name',
                'role',
                'status',
                'created_at',
                'updated_at',
            ],
        ])
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.username', $user->username);
});

test('view nonexistent admin user returns 404', function () {
    $fakeId = '00000000-0000-0000-0000-000000000000';

    $response = $this->getJson("/api/v1/admin-users/{$fakeId}", $this->headers);

    $response->assertNotFound();
});

test('can update admin user', function () {
    $user = AdminUser::factory()->create();

    $response = $this->putJson("/api/v1/admin-users/{$user->id}", [
        'first_name' => 'Updated',
    ], $this->headers);

    $response->assertOk()
        ->assertJsonPath('data.first_name', 'Updated');

    $this->assertDatabaseHas('admin_users', [
        'id' => $user->id,
        'first_name' => 'Updated',
    ]);
});

test('can update admin user email', function () {
    $user = AdminUser::factory()->create();

    $response = $this->putJson("/api/v1/admin-users/{$user->id}", [
        'email' => 'updated@pulitika.ph',
    ], $this->headers);

    $response->assertOk()
        ->assertJsonPath('data.email', 'updated@pulitika.ph');
});

test('update admin user validates unique email excludes self', function () {
    $user = AdminUser::factory()->create(['email' => 'self@pulitika.ph']);

    // Updating with own email should succeed
    $response = $this->putJson("/api/v1/admin-users/{$user->id}", [
        'email' => 'self@pulitika.ph',
    ], $this->headers);

    $response->assertOk();
});

test('update admin user rejects duplicate email from another user', function () {
    $userA = AdminUser::factory()->create(['email' => 'a@pulitika.ph']);
    $userB = AdminUser::factory()->create(['email' => 'b@pulitika.ph']);

    $response = $this->putJson("/api/v1/admin-users/{$userB->id}", [
        'email' => 'a@pulitika.ph',
    ], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

test('update admin user tracks updated_by', function () {
    $user = AdminUser::factory()->create();

    $this->putJson("/api/v1/admin-users/{$user->id}", [
        'first_name' => 'Tracked',
    ], $this->headers);

    $this->assertDatabaseHas('admin_users', [
        'id' => $user->id,
        'updated_by' => $this->admin->id,
    ]);
});

test('can soft-delete admin user', function () {
    $user = AdminUser::factory()->create();

    $response = $this->deleteJson("/api/v1/admin-users/{$user->id}", [], $this->headers);

    $response->assertOk()
        ->assertJsonPath('message', 'Admin user deleted successfully.');

    $this->assertSoftDeleted('admin_users', ['id' => $user->id]);
});

test('cannot delete self', function () {
    $response = $this->deleteJson("/api/v1/admin-users/{$this->admin->id}", [], $this->headers);

    $response->assertStatus(403)
        ->assertJsonPath('message', 'You cannot delete your own account.');
});

test('delete revokes target user tokens', function () {
    $user = AdminUser::factory()->create();
    $user->createToken('user-session');

    // Should have 1 token before deletion
    expect($user->tokens()->count())->toBe(1);

    $this->deleteJson("/api/v1/admin-users/{$user->id}", [], $this->headers)
        ->assertOk();

    // All tokens for the deleted user should be removed from the database
    expect($user->tokens()->count())->toBe(0);
});

test('create admin user creates audit log', function () {
    $this->postJson('/api/v1/admin-users', [
        'username' => 'audited',
        'email' => 'audited@pulitika.ph',
        'password' => 'securePass123!',
        'first_name' => 'Audited',
        'last_name' => 'User',
    ], $this->headers);

    $this->assertDatabaseHas('audit_logs', [
        'admin_user_id' => $this->admin->id,
        'action' => 'create',
        'resource_type' => 'admin_user',
    ]);
});

test('update admin user creates audit log', function () {
    $user = AdminUser::factory()->create();

    $this->putJson("/api/v1/admin-users/{$user->id}", [
        'first_name' => 'Changed',
    ], $this->headers);

    $this->assertDatabaseHas('audit_logs', [
        'admin_user_id' => $this->admin->id,
        'action' => 'update',
        'resource_type' => 'admin_user',
        'resource_id' => $user->id,
    ]);
});

test('delete admin user creates audit log', function () {
    $user = AdminUser::factory()->create();

    $this->deleteJson("/api/v1/admin-users/{$user->id}", [], $this->headers);

    $this->assertDatabaseHas('audit_logs', [
        'admin_user_id' => $this->admin->id,
        'action' => 'delete',
        'resource_type' => 'admin_user',
        'resource_id' => $user->id,
    ]);
});

test('admin user crud requires authentication', function () {
    $this->getJson('/api/v1/admin-users')->assertUnauthorized();
    $this->postJson('/api/v1/admin-users', [])->assertUnauthorized();
    $this->getJson('/api/v1/admin-users/fake-id')->assertUnauthorized();
    $this->putJson('/api/v1/admin-users/fake-id', [])->assertUnauthorized();
    $this->deleteJson('/api/v1/admin-users/fake-id')->assertUnauthorized();
});
