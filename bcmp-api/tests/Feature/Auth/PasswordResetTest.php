<?php

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->barangay = Barangay::factory()->create();
    $this->user = User::factory()->create([
        'barangay_id' => $this->barangay->id,
        'username' => 'testuser',
        'phone' => '09171234567',
        'password' => bcrypt('OldPassword1'),
    ]);
});

// ── Check Username (POST /auth/check-username) ──

test('check-username returns exists true for valid username', function () {
    $response = $this->postJson('/api/v1/auth/check-username', [
        'username' => 'testuser',
    ]);

    $response->assertOk()
        ->assertJsonPath('exists', true)
        ->assertJsonPath('has_phone', true);

    // Phone should be masked
    expect($response->json('phone_masked'))->toContain('****');
});

test('check-username returns exists false for nonexistent username', function () {
    $response = $this->postJson('/api/v1/auth/check-username', [
        'username' => 'nonexistent_user',
    ]);

    $response->assertOk()
        ->assertJsonPath('exists', false);
});

test('check-username validates required username field', function () {
    $response = $this->postJson('/api/v1/auth/check-username', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['username']);
});

test('check-username shows no phone when user has no phone', function () {
    $this->user->update(['phone' => null]);

    $response = $this->postJson('/api/v1/auth/check-username', [
        'username' => 'testuser',
    ]);

    $response->assertOk()
        ->assertJsonPath('exists', true)
        ->assertJsonPath('has_phone', false)
        ->assertJsonPath('phone_masked', null);
});

// ── Forgot Password (POST /auth/forgot-password) ──

test('forgot-password sends OTP via SMS', function () {
    // Mock the TxtBox SMS API
    Http::fake([
        '*' => Http::response(['result' => 'OK'], 200),
    ]);

    $response = $this->postJson('/api/v1/auth/forgot-password', [
        'username' => 'testuser',
    ]);

    $response->assertOk();
    expect($response->json('message'))->toContain('Verification code sent');
});

test('forgot-password fails for user without phone', function () {
    $this->user->update(['phone' => null]);

    $response = $this->postJson('/api/v1/auth/forgot-password', [
        'username' => 'testuser',
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'No phone number registered for this account.');
});

test('forgot-password fails for nonexistent username', function () {
    $response = $this->postJson('/api/v1/auth/forgot-password', [
        'username' => 'ghost_user',
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'No phone number registered for this account.');
});

test('forgot-password validates required username', function () {
    $response = $this->postJson('/api/v1/auth/forgot-password', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['username']);
});

test('forgot-password is rate limited after 5 attempts', function () {
    Http::fake([
        '*' => Http::response(['result' => 'OK'], 200),
    ]);

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

// ── Verify Reset OTP (POST /auth/verify-reset-otp) ──

test('verify-reset-otp succeeds with valid OTP', function () {
    // Place a known OTP in cache (mimicking what sendOtp does)
    Cache::put('otp:password_reset:09171234567', '123456', now()->addMinutes(5));

    $response = $this->postJson('/api/v1/auth/verify-reset-otp', [
        'username' => 'testuser',
        'code' => '123456',
    ]);

    $response->assertOk()
        ->assertJsonPath('message', 'Code verified.')
        ->assertJsonStructure(['reset_token', 'phone_masked']);
});

test('verify-reset-otp fails with invalid OTP', function () {
    Cache::put('otp:password_reset:09171234567', '123456', now()->addMinutes(5));

    $response = $this->postJson('/api/v1/auth/verify-reset-otp', [
        'username' => 'testuser',
        'code' => '999999',
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Invalid or expired verification code.');
});

test('verify-reset-otp fails with expired OTP', function () {
    // Do NOT set any OTP in cache — simulates expired/missing OTP

    $response = $this->postJson('/api/v1/auth/verify-reset-otp', [
        'username' => 'testuser',
        'code' => '123456',
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Invalid or expired verification code.');
});

test('verify-reset-otp fails for nonexistent username', function () {
    $response = $this->postJson('/api/v1/auth/verify-reset-otp', [
        'username' => 'ghost_user',
        'code' => '123456',
    ]);

    $response->assertUnprocessable();
});

test('verify-reset-otp validates code length', function () {
    $response = $this->postJson('/api/v1/auth/verify-reset-otp', [
        'username' => 'testuser',
        'code' => '12',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['code']);
});

// ── Reset Password (POST /auth/reset-password) ──

test('reset-password succeeds with valid reset token', function () {
    $resetToken = bin2hex(random_bytes(32));
    Cache::put(
        "password_reset:{$this->user->id}",
        hash('sha256', $resetToken),
        now()->addMinutes(10)
    );

    $response = $this->postJson('/api/v1/auth/reset-password', [
        'username' => 'testuser',
        'reset_token' => $resetToken,
        'password' => 'NewPassword1',
        'password_confirmation' => 'NewPassword1',
    ]);

    $response->assertOk()
        ->assertJsonPath('message', 'Password has been reset successfully. Please sign in with your new password.');

    // Verify can login with new password
    $loginResponse = $this->postJson('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'NewPassword1',
    ]);

    $loginResponse->assertOk();
});

test('reset-password fails with invalid reset token', function () {
    $resetToken = bin2hex(random_bytes(32));
    Cache::put(
        "password_reset:{$this->user->id}",
        hash('sha256', $resetToken),
        now()->addMinutes(10)
    );

    $response = $this->postJson('/api/v1/auth/reset-password', [
        'username' => 'testuser',
        'reset_token' => 'invalid-token-value',
        'password' => 'NewPassword1',
        'password_confirmation' => 'NewPassword1',
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Invalid or expired reset token.');
});

test('reset-password fails with expired reset token', function () {
    // No token in cache — simulates expired

    $response = $this->postJson('/api/v1/auth/reset-password', [
        'username' => 'testuser',
        'reset_token' => 'some-old-token',
        'password' => 'NewPassword1',
        'password_confirmation' => 'NewPassword1',
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Invalid or expired reset token.');
});

test('reset-password validates password requirements', function () {
    $resetToken = bin2hex(random_bytes(32));
    Cache::put(
        "password_reset:{$this->user->id}",
        hash('sha256', $resetToken),
        now()->addMinutes(10)
    );

    $response = $this->postJson('/api/v1/auth/reset-password', [
        'username' => 'testuser',
        'reset_token' => $resetToken,
        'password' => 'weak',
        'password_confirmation' => 'weak',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

test('reset-password requires password confirmation', function () {
    $resetToken = bin2hex(random_bytes(32));
    Cache::put(
        "password_reset:{$this->user->id}",
        hash('sha256', $resetToken),
        now()->addMinutes(10)
    );

    $response = $this->postJson('/api/v1/auth/reset-password', [
        'username' => 'testuser',
        'reset_token' => $resetToken,
        'password' => 'NewPassword1',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

test('reset-password revokes all existing tokens', function () {
    // Create some existing tokens
    $this->user->createToken('device1');
    $this->user->createToken('device2');
    expect($this->user->tokens()->count())->toBe(2);

    $resetToken = bin2hex(random_bytes(32));
    Cache::put(
        "password_reset:{$this->user->id}",
        hash('sha256', $resetToken),
        now()->addMinutes(10)
    );

    $this->postJson('/api/v1/auth/reset-password', [
        'username' => 'testuser',
        'reset_token' => $resetToken,
        'password' => 'NewPassword1',
        'password_confirmation' => 'NewPassword1',
    ]);

    expect($this->user->tokens()->count())->toBe(0);
});

test('reset-password deletes used reset token from cache', function () {
    $resetToken = bin2hex(random_bytes(32));
    Cache::put(
        "password_reset:{$this->user->id}",
        hash('sha256', $resetToken),
        now()->addMinutes(10)
    );

    $this->postJson('/api/v1/auth/reset-password', [
        'username' => 'testuser',
        'reset_token' => $resetToken,
        'password' => 'NewPassword1',
        'password_confirmation' => 'NewPassword1',
    ]);

    // Token should be consumed — second attempt should fail
    $response = $this->postJson('/api/v1/auth/reset-password', [
        'username' => 'testuser',
        'reset_token' => $resetToken,
        'password' => 'AnotherPassword1',
        'password_confirmation' => 'AnotherPassword1',
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Invalid or expired reset token.');
});
