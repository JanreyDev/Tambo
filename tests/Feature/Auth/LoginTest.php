<?php

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\User;

beforeEach(function () {
    $this->barangay = Barangay::factory()->create();
    $this->user = User::factory()->create([
        'barangay_id' => $this->barangay->id,
        'username' => 'testuser',
        'password' => bcrypt('password123'),
        'status' => 'active',
    ]);
});

// ── Login ──

test('user can login with valid credentials', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'token',
            'user' => ['id', 'username', 'email', 'first_name', 'last_name'],
            'expires_at',
        ]);
});

test('login returns user profile with barangay info', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.username', 'testuser')
        ->assertJsonPath('user.barangay.id', $this->barangay->id)
        ->assertJsonPath('user.barangay.name', $this->barangay->name);
});

test('login fails with invalid password', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
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

    // Generic message to prevent user enumeration
    $response->assertUnauthorized()
        ->assertJsonPath('message', 'Invalid credentials.');
});

test('login fails with missing fields', function () {
    $response = $this->postJson('/api/v1/auth/login', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['username', 'password']);
});

test('login fails when password is too short', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'short',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

test('login fails for deactivated user', function () {
    $this->user->update(['status' => 'deactivated']);

    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'password123',
    ]);

    $response->assertForbidden()
        ->assertJsonPath('message', 'Account is deactivated. Contact your administrator.');
});

test('login fails when barangay is inactive', function () {
    $this->barangay->update(['status' => 'suspended']);

    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'password123',
    ]);

    $response->assertForbidden()
        ->assertJsonPath('message', 'Barangay account is inactive.');
});

test('login fails when subscription is expired', function () {
    $this->barangay->update(['subscription_expires_at' => now()->subDay()]);

    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'password123',
    ]);

    $response->assertForbidden()
        ->assertJsonPath('message', 'Subscription expired. Contact PrimeX support.');
});

test('super admin can login without barangay checks', function () {
    $superAdmin = User::factory()->superAdmin()->create([
        'username' => 'superadmin',
        'password' => bcrypt('password123'),
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'superadmin',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['token', 'user'])
        ->assertJsonPath('user.is_super_admin', true);
});

test('login issues a token with 30-day expiry', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'password123',
    ]);

    $response->assertOk();

    $expiresAt = $response->json('expires_at');
    expect($expiresAt)->not->toBeNull();

    // Token should expire approximately 30 days from now
    $expiry = \Carbon\Carbon::parse($expiresAt);
    $daysUntilExpiry = now()->diffInDays($expiry, false);
    expect($daysUntilExpiry)->toBeBetween(29, 31);
});

test('login records last login timestamp and IP', function () {
    $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'password123',
    ]);

    $this->user->refresh();
    expect($this->user->last_login_at)->not->toBeNull();
    expect($this->user->last_login_ip)->not->toBeNull();
});

test('login accepts optional device name', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'password123',
        'device_name' => 'Samsung Galaxy S24',
    ]);

    $response->assertOk();
});

// ── Rate Limiting ──

test('login is rate limited after 5 attempts', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/v1/auth/login', [
            'username' => 'testuser',
            'password' => 'wrongpassword',
        ]);
    }

    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'wrongpassword',
    ]);

    $response->assertStatus(429);
});

// ── Profile (GET /auth/me) ──

test('authenticated user can get their profile', function () {
    $token = $this->user->createToken('test')->plainTextToken;

    $response = $this->getJson('/api/v1/auth/me', [
        'Authorization' => "Bearer {$token}",
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_super_admin', 'status', 'barangay', 'roles', 'permissions',
        ])
        ->assertJsonPath('username', 'testuser');
});

test('profile includes barangay details', function () {
    $token = $this->user->createToken('test')->plainTextToken;

    $response = $this->getJson('/api/v1/auth/me', [
        'Authorization' => "Bearer {$token}",
    ]);

    $response->assertOk()
        ->assertJsonPath('barangay.id', $this->barangay->id)
        ->assertJsonPath('barangay.name', $this->barangay->name);
});

test('unauthenticated request to profile returns 401', function () {
    $response = $this->getJson('/api/v1/auth/me');

    $response->assertUnauthorized();
});

test('invalid token returns 401', function () {
    $response = $this->getJson('/api/v1/auth/me', [
        'Authorization' => 'Bearer invalid-token-value',
    ]);

    $response->assertUnauthorized();
});

// ── Logout ──

test('user can logout and token is revoked', function () {
    $token = $this->user->createToken('test')->plainTextToken;

    $response = $this->postJson('/api/v1/auth/logout', [], [
        'Authorization' => "Bearer {$token}",
    ]);

    $response->assertOk()
        ->assertJsonPath('message', 'Logged out.');

    // Verify token was deleted from database
    expect($this->user->tokens()->count())->toBe(0);
});

test('user can logout from all devices', function () {
    // Create multiple tokens
    $token1 = $this->user->createToken('device1')->plainTextToken;
    $this->user->createToken('device2')->plainTextToken;

    expect($this->user->tokens()->count())->toBe(2);

    $response = $this->postJson('/api/v1/auth/logout-all', [], [
        'Authorization' => "Bearer {$token1}",
    ]);

    $response->assertOk()
        ->assertJsonPath('message', 'Logged out from all devices.');

    // All tokens should be revoked from database
    expect($this->user->tokens()->count())->toBe(0);
});

test('unauthenticated logout returns 401', function () {
    $response = $this->postJson('/api/v1/auth/logout');

    $response->assertUnauthorized();
});
