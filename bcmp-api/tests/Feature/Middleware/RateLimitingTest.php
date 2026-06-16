<?php

/**
 * Rate Limiting Tests
 *
 * Verifies that throttle middleware is enforced on security-critical endpoints.
 * Rate limits protect against brute-force attacks on auth and enumeration on lookups.
 */

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\User;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->barangay = Barangay::factory()->create();
    $this->user = User::factory()->create([
        'barangay_id' => $this->barangay->id,
        'username' => 'testuser',
        'password' => bcrypt('Password123'),
        'phone' => '09171234567',
    ]);
});

// ── Login Rate Limiting (5 per minute) ──

test('login is rate limited after 5 failed attempts', function () {
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

test('rate limited login returns retry-after header', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/v1/auth/login', [
            'username' => 'testuser',
            'password' => 'wrong',
        ]);
    }

    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'wrong',
    ]);

    $response->assertStatus(429);
    $response->assertHeader('Retry-After');
});

test('successful login also counts toward rate limit', function () {
    // 4 failed attempts
    for ($i = 0; $i < 4; $i++) {
        $this->postJson('/api/v1/auth/login', [
            'username' => 'testuser',
            'password' => 'wrongpassword',
        ]);
    }

    // 1 successful attempt (still counts)
    $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'Password123',
    ]);

    // 6th attempt should be rate limited
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'Password123',
    ]);

    $response->assertStatus(429);
});

// ── Forgot Password Rate Limiting (5 per minute) ──

test('forgot-password is rate limited after 5 attempts', function () {
    Http::fake(['*' => Http::response(['result' => 'OK'], 200)]);

    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/v1/auth/forgot-password', [
            'username' => 'testuser',
        ]);
    }

    $response = $this->postJson('/api/v1/auth/forgot-password', [
        'username' => 'testuser',
    ]);

    $response->assertStatus(429);
});

// ── Check Username Rate Limiting (10 per minute) ──

test('check-username is rate limited after 10 attempts', function () {
    for ($i = 0; $i < 10; $i++) {
        $this->postJson('/api/v1/auth/check-username', [
            'username' => 'testuser',
        ]);
    }

    $response = $this->postJson('/api/v1/auth/check-username', [
        'username' => 'testuser',
    ]);

    $response->assertStatus(429);
});

// ── Verify Reset OTP Rate Limiting (5 per minute) ──

test('verify-reset-otp is rate limited after 5 attempts', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/v1/auth/verify-reset-otp', [
            'username' => 'testuser',
            'code' => '000000',
        ]);
    }

    $response = $this->postJson('/api/v1/auth/verify-reset-otp', [
        'username' => 'testuser',
        'code' => '000000',
    ]);

    $response->assertStatus(429);
});

// ── Reset Password Rate Limiting (5 per minute) ──

test('reset-password is rate limited after 5 attempts', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/v1/auth/reset-password', [
            'username' => 'testuser',
            'reset_token' => 'fake-token',
            'password' => 'NewPassword1',
            'password_confirmation' => 'NewPassword1',
        ]);
    }

    $response = $this->postJson('/api/v1/auth/reset-password', [
        'username' => 'testuser',
        'reset_token' => 'fake-token',
        'password' => 'NewPassword1',
        'password_confirmation' => 'NewPassword1',
    ]);

    $response->assertStatus(429);
});

// ── Unauthenticated endpoints return proper status before rate limit ──

test('login returns 401 for wrong credentials before hitting rate limit', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'wrongpassword',
    ]);

    $response->assertUnauthorized();
});

test('forgot-password returns 422 for missing phone before hitting rate limit', function () {
    $this->user->update(['phone' => null]);

    $response = $this->postJson('/api/v1/auth/forgot-password', [
        'username' => 'testuser',
    ]);

    $response->assertUnprocessable();
});
