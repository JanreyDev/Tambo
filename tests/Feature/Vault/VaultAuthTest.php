<?php

declare(strict_types=1);

use App\Models\Vault\VaultAccessLog;
use App\Models\Vault\VaultSession;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    config(['vault.keyphrase_hash' => Hash::make('test-keyphrase')]);
    config(['vault.session_ttl' => 240]);
});

test('verify keyphrase with correct keyphrase returns token', function () {
    $response = $this->postJson('/api/v1/vault/verify-keyphrase', [
        'keyphrase' => 'test-keyphrase',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'message',
            'data' => [
                'token',
                'expires_at',
                'session_id',
            ],
        ])
        ->assertJsonPath('message', 'Access granted.');

    $token = $response->json('data.token');
    expect($token)->toBeString()->toHaveLength(64);
});

test('verify keyphrase creates vault session in database', function () {
    $this->postJson('/api/v1/vault/verify-keyphrase', [
        'keyphrase' => 'test-keyphrase',
    ]);

    expect(VaultSession::count())->toBe(1);

    $session = VaultSession::first();
    expect($session->token_hash)->toBeString()->toHaveLength(64);
    expect($session->expires_at)->not->toBeNull();
});

test('verify keyphrase logs successful access', function () {
    $this->postJson('/api/v1/vault/verify-keyphrase', [
        'keyphrase' => 'test-keyphrase',
    ]);

    $this->assertDatabaseHas('vault_access_logs', [
        'action' => 'verify_keyphrase',
    ]);
});

test('verify keyphrase fails with wrong keyphrase', function () {
    $response = $this->postJson('/api/v1/vault/verify-keyphrase', [
        'keyphrase' => 'wrong-keyphrase',
    ]);

    $response->assertUnauthorized()
        ->assertJsonPath('message', 'Hindi tama ang keyphrase. Pakisubukan ulit.');
});

test('verify keyphrase logs failed attempt', function () {
    $this->postJson('/api/v1/vault/verify-keyphrase', [
        'keyphrase' => 'wrong-keyphrase',
    ]);

    $this->assertDatabaseHas('vault_access_logs', [
        'action' => 'verify_failed',
    ]);
});

test('verify keyphrase fails with missing keyphrase', function () {
    $response = $this->postJson('/api/v1/vault/verify-keyphrase', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['keyphrase']);
});

test('verify keyphrase returns 503 when not configured', function () {
    config(['vault.keyphrase_hash' => null]);

    $response = $this->postJson('/api/v1/vault/verify-keyphrase', [
        'keyphrase' => 'anything',
    ]);

    $response->assertStatus(503);
});

test('heartbeat returns session status', function () {
    $response = $this->postJson('/api/v1/vault/verify-keyphrase', [
        'keyphrase' => 'test-keyphrase',
    ]);

    $token = $response->json('data.token');

    $response = $this->getJson('/api/v1/vault/heartbeat', [
        'Authorization' => "Bearer {$token}",
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                'session_id',
                'created_at',
                'expires_at',
                'last_activity_at',
            ],
        ]);
});

test('heartbeat fails without token', function () {
    $response = $this->getJson('/api/v1/vault/heartbeat');

    $response->assertUnauthorized()
        ->assertJsonPath('message', 'Authentication required.');
});

test('heartbeat fails with invalid token', function () {
    $response = $this->getJson('/api/v1/vault/heartbeat', [
        'Authorization' => 'Bearer invalid-token-here',
    ]);

    $response->assertUnauthorized()
        ->assertJsonPath('message', 'Invalid session.');
});

test('heartbeat fails with expired session', function () {
    $response = $this->postJson('/api/v1/vault/verify-keyphrase', [
        'keyphrase' => 'test-keyphrase',
    ]);

    $token = $response->json('data.token');
    $sessionId = $response->json('data.session_id');

    // Force expire the session
    VaultSession::where('id', $sessionId)->update([
        'expires_at' => now()->subMinute(),
    ]);

    $response = $this->getJson('/api/v1/vault/heartbeat', [
        'Authorization' => "Bearer {$token}",
    ]);

    $response->assertUnauthorized()
        ->assertJsonPath('message', 'Session expired.');

    // Session should be deleted
    expect(VaultSession::find($sessionId))->toBeNull();
});

test('logout destroys session', function () {
    $response = $this->postJson('/api/v1/vault/verify-keyphrase', [
        'keyphrase' => 'test-keyphrase',
    ]);

    $token = $response->json('data.token');
    $sessionId = $response->json('data.session_id');

    $response = $this->postJson('/api/v1/vault/logout', [], [
        'Authorization' => "Bearer {$token}",
    ]);

    $response->assertOk()
        ->assertJsonPath('message', 'Session destroyed.');

    // Session should be deleted
    expect(VaultSession::find($sessionId))->toBeNull();

    // Logout should be logged
    $this->assertDatabaseHas('vault_access_logs', [
        'vault_session_id' => $sessionId,
        'action' => 'logout',
    ]);
});

test('logout logs the access', function () {
    $response = $this->postJson('/api/v1/vault/verify-keyphrase', [
        'keyphrase' => 'test-keyphrase',
    ]);

    $token = $response->json('data.token');

    $this->postJson('/api/v1/vault/logout', [], [
        'Authorization' => "Bearer {$token}",
    ]);

    $this->assertDatabaseHas('vault_access_logs', [
        'action' => 'logout',
    ]);
});
