<?php

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\User;

beforeEach(function () {
    $this->barangay = Barangay::factory()->create();
    $this->user = User::factory()->create([
        'barangay_id' => $this->barangay->id,
        'username' => 'testuser',
        'password' => 'password123',
        'status' => 'active',
    ]);
    $this->token = $this->user->createToken('test')->plainTextToken;
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
});

// ──────────────────────────────────────────────────────────────
// Default + /auth/me returns preferred_language
// ──────────────────────────────────────────────────────────────

test('new user defaults to preferred_language = en', function () {
    expect($this->user->fresh()->preferred_language)->toBe('en');
});

test('GET /auth/me returns preferred_language', function () {
    $response = $this->getJson('/api/v1/auth/me', $this->headers);

    $response->assertOk()
        ->assertJsonPath('preferred_language', 'en');
});

// ──────────────────────────────────────────────────────────────
// PATCH /me/preferences — happy path
// ──────────────────────────────────────────────────────────────

test('user can switch to Filipino', function () {
    $response = $this->patchJson('/api/v1/me/preferences', [
        'preferred_language' => 'fil',
    ], $this->headers);

    $response->assertOk()
        ->assertJsonPath('preferred_language', 'fil');

    expect($this->user->fresh()->preferred_language)->toBe('fil');
});

test('user can switch back to English', function () {
    $this->user->update(['preferred_language' => 'fil']);

    $response = $this->patchJson('/api/v1/me/preferences', [
        'preferred_language' => 'en',
    ], $this->headers);

    $response->assertOk()
        ->assertJsonPath('preferred_language', 'en');

    expect($this->user->fresh()->preferred_language)->toBe('en');
});

test('round-trip: PATCH then GET /auth/me reflects new value', function () {
    $this->patchJson('/api/v1/me/preferences', ['preferred_language' => 'fil'], $this->headers)->assertOk();

    $response = $this->getJson('/api/v1/auth/me', $this->headers);
    $response->assertOk()->assertJsonPath('preferred_language', 'fil');
});

// ──────────────────────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────────────────────

test('invalid language code is rejected', function () {
    $response = $this->patchJson('/api/v1/me/preferences', [
        'preferred_language' => 'es', // Spanish — not allowed
    ], $this->headers);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['preferred_language']);
});

test('non-string language is rejected', function () {
    $response = $this->patchJson('/api/v1/me/preferences', [
        'preferred_language' => 123,
    ], $this->headers);

    $response->assertStatus(422);
});

// ──────────────────────────────────────────────────────────────
// Auth + tenant isolation
// ──────────────────────────────────────────────────────────────

test('unauthenticated request to PATCH preferences returns 401', function () {
    $response = $this->patchJson('/api/v1/me/preferences', [
        'preferred_language' => 'fil',
    ]);

    $response->assertStatus(401);
});

test('one users preference does not bleed to another', function () {
    $otherUser = User::factory()->create([
        'barangay_id' => $this->barangay->id,
        'status' => 'active',
    ]);

    $this->patchJson('/api/v1/me/preferences', ['preferred_language' => 'fil'], $this->headers)->assertOk();

    expect($this->user->fresh()->preferred_language)->toBe('fil');
    expect($otherUser->fresh()->preferred_language)->toBe('en'); // unchanged
});
