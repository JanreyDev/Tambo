<?php

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\User;

beforeEach(function () {
    $this->barangay = Barangay::factory()->create();
    // Pass raw password — Eloquent's 'hashed' cast runs the configured driver (argon2id).
    // bcrypt() here would clash with the 'hashed' cast verification when driver=argon2id.
    $this->user = User::factory()->create([
        'barangay_id' => $this->barangay->id,
        'username' => 'testuser',
        'password' => 'password123',
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
        'password' => 'password123',
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

    // Token should expire approximately 12 hours from now
    $expiry = \Carbon\Carbon::parse($expiresAt);
    $hoursUntilExpiry = now()->diffInHours($expiry, false);
    expect($hoursUntilExpiry)->toBeBetween(11, 13);
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

// ── Security: Lockout, Audit, Hash Migration, Cookies ──

test('failed login increments failed_login_attempts counter', function () {
    $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'wrongpassword',
    ]);

    $this->user->refresh();
    expect($this->user->failed_login_attempts)->toBe(1);
    expect($this->user->last_failed_login_at)->not->toBeNull();
    expect($this->user->locked_until)->toBeNull();
});

test('account locks after 10 failed attempts', function () {
    // Seed counter to 9 — one more failure should lock the account.
    $this->user->forceFill([
        'failed_login_attempts' => 9,
        'last_failed_login_at' => now(),
    ])->saveQuietly();

    // 10th failure — note: throttle:5/min would fire first, so we bypass it for this test
    $response = $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class)
        ->postJson('/api/v1/auth/login', [
            'username' => 'testuser',
            'password' => 'wrongpassword',
        ]);

    $response->assertUnauthorized();

    $this->user->refresh();
    expect($this->user->failed_login_attempts)->toBe(10);
    expect($this->user->locked_until)->not->toBeNull();
    expect($this->user->isLockedOut())->toBeTrue();
});

test('locked account rejects even correct password with 423', function () {
    $this->user->forceFill([
        'failed_login_attempts' => 10,
        'locked_until' => now()->addMinutes(15),
    ])->saveQuietly();

    $response = $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class)
        ->postJson('/api/v1/auth/login', [
            'username' => 'testuser',
            'password' => 'password123', // CORRECT password
        ]);

    $response->assertStatus(423)
        ->assertJsonPath('message', 'Invalid credentials.') // anti-enumeration maintained
        ->assertJsonStructure(['message', 'retry_after']);

    expect($response->json('retry_after'))->toBeGreaterThan(0);
});

test('successful login resets lockout counter', function () {
    $this->user->forceFill([
        'failed_login_attempts' => 7,
        'last_failed_login_at' => now()->subMinute(),
    ])->saveQuietly();

    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'password123',
    ]);

    $response->assertOk();

    $this->user->refresh();
    expect($this->user->failed_login_attempts)->toBe(0);
    expect($this->user->locked_until)->toBeNull();
    expect($this->user->last_failed_login_at)->toBeNull();
});

test('failure counter decays after 60 minutes of clean state', function () {
    // Old strike from 2 hours ago — should reset the counter to 1, not increment to 6
    $this->user->forceFill([
        'failed_login_attempts' => 5,
        'last_failed_login_at' => now()->subHours(2),
    ])->saveQuietly();

    $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'wrongpassword',
    ]);

    $this->user->refresh();
    expect($this->user->failed_login_attempts)->toBe(1);
});

test('unknown-username probe is audited with attempted_username', function () {
    $this->postJson('/api/v1/auth/login', [
        'username' => 'definitely_not_a_real_user',
        'password' => 'WhateverPassword123',
    ]);

    $log = \App\Models\Platform\LoginLog::where('action', 'login_failed')
        ->where('attempted_username', 'definitely_not_a_real_user')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->user_id)->toBeNull();
    expect($log->ip_address)->not->toBeNull();
});

test('failed login audit captures reason and device fingerprint', function () {
    $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'wrongpassword',
    ]);

    $log = \App\Models\Platform\LoginLog::where('action', 'login_failed')
        ->where('user_id', $this->user->id)
        ->first();

    expect($log)->not->toBeNull();
    expect($log->device_info['reason'] ?? null)->toBe('invalid_password');
    expect($log->device_info['attempted_username'] ?? null)->toBe('testuser');
});

test('bcrypt hash is silently migrated to argon2id on successful login', function () {
    // Manually plant a bcrypt hash via raw DB update — bypasses the 'hashed' cast which
    // would normally reject cross-algorithm assignment under the argon2id default driver.
    $bcryptHash = password_hash('password123', PASSWORD_BCRYPT, ['cost' => 4]);
    \Illuminate\Support\Facades\DB::table('users')
        ->where('id', $this->user->id)
        ->update(['password' => $bcryptHash]);

    $this->user->refresh();
    expect($this->user->password)->toStartWith('$2y$'); // bcrypt confirmed

    $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'password123',
    ]);

    $this->user->refresh();
    expect($this->user->password)->toStartWith('$argon2id$'); // migrated transparently
});

test('login sets bcmp_token and bcmp_auth cookies', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'password123',
    ]);

    $response->assertOk();

    // Cookies are NOT encrypted (raw bearer token + flag); assertCookie would try to decrypt.
    $cookies = collect($response->headers->getCookies())->keyBy(fn ($c) => $c->getName());

    expect($cookies->has('bcmp_token'))->toBeTrue();
    expect($cookies->has('bcmp_auth'))->toBeTrue();
    expect($cookies->get('bcmp_token')->isHttpOnly())->toBeTrue();
    expect($cookies->get('bcmp_auth')->isHttpOnly())->toBeFalse();
    expect($cookies->get('bcmp_auth')->getValue())->toBe('1');
    expect($cookies->get('bcmp_token')->getSameSite())->toBe('lax');
});

test('logout clears bcmp_token and bcmp_auth cookies', function () {
    $token = $this->user->createToken('test')->plainTextToken;

    $response = $this->postJson('/api/v1/auth/logout', [], [
        'Authorization' => "Bearer {$token}",
    ]);

    $response->assertOk();

    $cookies = collect($response->headers->getCookies())->keyBy(fn ($c) => $c->getName());
    expect($cookies->get('bcmp_token')?->getExpiresTime() ?? 0)->toBeLessThan(time());
    expect($cookies->get('bcmp_auth')?->getExpiresTime() ?? 0)->toBeLessThan(time());
});

test('username regex rejects invalid characters', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'user;DROP TABLE users;--',
        'password' => 'password123',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['username']);
});

test('username max length enforced at 64 chars', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => str_repeat('a', 65),
        'password' => 'password123',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['username']);
});

test('password max length enforced at 128 chars', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => str_repeat('a', 129),
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});
