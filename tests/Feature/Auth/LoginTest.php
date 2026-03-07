<?php

declare(strict_types=1);

use App\Models\AdminUser;

beforeEach(function () {
    $this->user = AdminUser::factory()->create([
        'username' => 'admin',
        'password' => 'password123',
        'status' => 'active',
    ]);
});

test('admin can login with valid credentials', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'admin',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'message',
            'data' => [
                'user' => ['id', 'email', 'username', 'first_name', 'last_name'],
                'token',
                'expires_at',
            ],
        ])
        ->assertJsonPath('data.user.username', 'admin');
});

test('login returns sanctum token', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'admin',
        'password' => 'password123',
    ]);

    $response->assertOk();

    $token = $response->json('data.token');
    expect($token)->toBeString()->not->toBeEmpty();
});

test('login records last login timestamp', function () {
    $this->postJson('/api/v1/auth/login', [
        'username' => 'admin',
        'password' => 'password123',
    ]);

    $this->user->refresh();

    expect($this->user->last_login_at)->not->toBeNull();
    expect($this->user->last_login_ip)->not->toBeNull();
});

test('login fails with invalid credentials', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'admin',
        'password' => 'wrongpassword',
    ]);

    $response->assertUnauthorized()
        ->assertJsonPath('message', 'Invalid credentials.');
});

test('login fails with nonexistent username', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'nonexistent',
        'password' => 'password123',
    ]);

    $response->assertUnauthorized();
});

test('login fails with missing fields', function () {
    $response = $this->postJson('/api/v1/auth/login', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['username', 'password']);
});

test('login fails with missing username', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'password' => 'password123',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['username']);
});

test('login fails with missing password', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'admin',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

test('login fails for inactive account', function () {
    $this->user->update(['status' => 'inactive']);

    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'admin',
        'password' => 'password123',
    ]);

    $response->assertForbidden()
        ->assertJsonPath('message', 'Your account is not active. Contact your administrator.');
});

test('login fails for suspended account', function () {
    $this->user->update(['status' => 'suspended']);

    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'admin',
        'password' => 'password123',
    ]);

    $response->assertForbidden();
});

test('login accepts optional device_name', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'admin',
        'password' => 'password123',
        'device_name' => 'test-device',
    ]);

    $response->assertOk();
});

test('authenticated admin can get profile', function () {
    $token = $this->user->createToken('test')->plainTextToken;

    $response = $this->getJson('/api/v1/auth/me', [
        'Authorization' => "Bearer {$token}",
    ]);

    $response->assertOk()
        ->assertJsonPath('data.username', 'admin')
        ->assertJsonStructure([
            'data' => [
                'id',
                'email',
                'username',
                'first_name',
                'last_name',
                'role',
                'status',
            ],
        ]);
});

test('admin can logout', function () {
    $token = $this->user->createToken('test')->plainTextToken;

    $response = $this->postJson('/api/v1/auth/logout', [], [
        'Authorization' => "Bearer {$token}",
    ]);

    $response->assertOk()
        ->assertJsonPath('message', 'Logged out successfully.');

    // Token should be deleted from the database
    expect($this->user->tokens()->count())->toBe(0);
});

test('admin can logout all sessions', function () {
    $token1 = $this->user->createToken('device-1')->plainTextToken;
    $token2 = $this->user->createToken('device-2')->plainTextToken;

    // Should have 2 tokens before logout
    expect($this->user->tokens()->count())->toBe(2);

    $response = $this->postJson('/api/v1/auth/logout-all', [], [
        'Authorization' => "Bearer {$token1}",
    ]);

    $response->assertOk()
        ->assertJsonPath('message', 'All sessions revoked successfully.');

    // All tokens should be deleted from the database
    expect($this->user->tokens()->count())->toBe(0);
});

test('unauthenticated request to me returns 401', function () {
    $response = $this->getJson('/api/v1/auth/me');

    $response->assertUnauthorized();
});

test('unauthenticated request to logout returns 401', function () {
    $response = $this->postJson('/api/v1/auth/logout');

    $response->assertUnauthorized();
});

test('login is rate limited', function () {
    for ($i = 0; $i < 6; $i++) {
        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'admin',
            'password' => 'wrongpassword',
        ]);
    }

    $response->assertStatus(429);
});

test('login creates audit log entry', function () {
    $this->postJson('/api/v1/auth/login', [
        'username' => 'admin',
        'password' => 'password123',
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'admin_user_id' => $this->user->id,
        'action' => 'login',
        'resource_type' => 'admin_user',
    ]);
});

test('logout creates audit log entry', function () {
    $token = $this->user->createToken('test')->plainTextToken;

    $this->postJson('/api/v1/auth/logout', [], [
        'Authorization' => "Bearer {$token}",
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'admin_user_id' => $this->user->id,
        'action' => 'logout',
        'resource_type' => 'admin_user',
    ]);
});
