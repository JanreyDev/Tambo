<?php

/**
 * Token Expiry Tests
 *
 * Verifies Sanctum token lifecycle: expiry enforcement, rejected expired tokens,
 * and session management. Tokens expire after 12 hours per AuthController.
 */

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;

beforeEach(function () {
    $this->barangay = Barangay::factory()->create();
    $this->user = User::factory()->create([
        'barangay_id' => $this->barangay->id,
        'username' => 'testuser',
        'password' => bcrypt('Password123'),
    ]);
});

// ── Token Expiry ──

test('login issues a token with approximately 12 hour expiry', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'Password123',
    ]);

    $response->assertOk();

    $expiresAt = $response->json('expires_at');
    expect($expiresAt)->not->toBeNull();

    $expiry = \Carbon\Carbon::parse($expiresAt);
    $hoursUntilExpiry = now()->diffInHours($expiry, false);
    expect($hoursUntilExpiry)->toBeBetween(11, 13);
});

test('expired token is rejected on authenticated endpoint', function () {
    $token = $this->user->createToken('test', ['*'], now()->subHour());

    $response = $this->getJson('/api/v1/auth/me', [
        'Authorization' => "Bearer {$token->plainTextToken}",
    ]);

    $response->assertUnauthorized();
});

test('non-expired token is accepted', function () {
    $token = $this->user->createToken('test', ['*'], now()->addHours(12));

    $response = $this->getJson('/api/v1/auth/me', [
        'Authorization' => "Bearer {$token->plainTextToken}",
    ]);

    $response->assertOk();
});

test('token expiring in 1 minute still works', function () {
    $token = $this->user->createToken('test', ['*'], now()->addMinute());

    $response = $this->getJson('/api/v1/auth/me', [
        'Authorization' => "Bearer {$token->plainTextToken}",
    ]);

    $response->assertOk();
});

// ── Token Revocation ──

test('logout revokes only the current token', function () {
    $token1 = $this->user->createToken('device1');
    $token2 = $this->user->createToken('device2');

    expect($this->user->tokens()->count())->toBe(2);

    $this->postJson('/api/v1/auth/logout', [], [
        'Authorization' => "Bearer {$token1->plainTextToken}",
    ]);

    // Only token1 should be deleted
    expect($this->user->tokens()->count())->toBe(1);

    // token2 should still work
    $response = $this->getJson('/api/v1/auth/me', [
        'Authorization' => "Bearer {$token2->plainTextToken}",
    ]);
    $response->assertOk();
});

test('logout-all revokes every token', function () {
    $token1 = $this->user->createToken('device1');
    $this->user->createToken('device2');
    $this->user->createToken('device3');

    expect($this->user->tokens()->count())->toBe(3);

    $this->postJson('/api/v1/auth/logout-all', [], [
        'Authorization' => "Bearer {$token1->plainTextToken}",
    ]);

    expect($this->user->tokens()->count())->toBe(0);
});

test('revoked token cannot access authenticated endpoints', function () {
    $token = $this->user->createToken('test');

    $this->postJson('/api/v1/auth/logout', [], [
        'Authorization' => "Bearer {$token->plainTextToken}",
    ]);

    // Reset auth guards to clear Sanctum's cached user from the same request lifecycle
    $this->app['auth']->forgetGuards();

    $response = $this->getJson('/api/v1/auth/me', [
        'Authorization' => "Bearer {$token->plainTextToken}",
    ]);

    $response->assertUnauthorized();
});

// ── Login replaces tokens for same device ──

test('login replaces existing token for same device name', function () {
    // Create an initial token with device name 'web'
    $this->user->createToken('web');
    expect($this->user->tokens()->where('name', 'web')->count())->toBe(1);

    // Login again (default device_name is 'web')
    $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'Password123',
    ]);

    // Should still have only 1 token named 'web' (old one deleted, new one created)
    expect($this->user->tokens()->where('name', 'web')->count())->toBe(1);
});

test('login with different device name creates separate token', function () {
    $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'Password123',
        'device_name' => 'Samsung Galaxy S24',
    ]);

    $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'Password123',
        'device_name' => 'Desktop Chrome',
    ]);

    expect($this->user->tokens()->count())->toBe(2);
});

// ── Token stores device metadata ──

test('login token stores IP address', function () {
    $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'Password123',
    ]);

    $token = $this->user->tokens()->first();
    expect($token->ip_address)->not->toBeNull();
});

test('login token stores device info', function () {
    $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'Password123',
    ]);

    $token = $this->user->tokens()->first();
    expect($token->device_info)->toBeArray();
    expect($token->device_info)->toHaveKeys(['device_type', 'browser', 'platform']);
});
