<?php

declare(strict_types=1);

use App\Models\Vault\VaultEntry;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    config(['vault.keyphrase_hash' => Hash::make('test-keyphrase')]);
    config(['vault.session_ttl' => 240]);

    // Authenticate and get a vault token
    $response = $this->postJson('/api/v1/vault/verify-keyphrase', [
        'keyphrase' => 'test-keyphrase',
    ]);

    $this->vaultToken = $response->json('data.token');

    // Seed some test entries
    seedVaultEntries();
});

test('categories returns entry counts', function () {
    $response = $this->getJson('/api/v1/vault/categories', [
        'Authorization' => "Bearer {$this->vaultToken}",
    ]);

    $response->assertOk()
        ->assertJsonStructure(['data']);

    $data = $response->json('data');
    expect($data)->toHaveKey('guide');
    expect($data['guide'])->toBeGreaterThan(0);
});

test('categories logs access', function () {
    $this->getJson('/api/v1/vault/categories', [
        'Authorization' => "Bearer {$this->vaultToken}",
    ]);

    $this->assertDatabaseHas('vault_access_logs', [
        'action' => 'view_categories',
        'resource_type' => 'vault_category',
    ]);
});

test('entries by category returns decrypted content', function () {
    $response = $this->getJson('/api/v1/vault/categories/guide', [
        'Authorization' => "Bearer {$this->vaultToken}",
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'title', 'content', 'sort_order', 'metadata', 'updated_at'],
            ],
        ]);

    $entries = $response->json('data');
    expect($entries)->not->toBeEmpty();

    // Content should be decrypted (readable text, not encrypted blob)
    $firstEntry = $entries[0];
    expect($firstEntry['content'])->toContain('test');
});

test('entries by invalid category returns 404', function () {
    $response = $this->getJson('/api/v1/vault/categories/nonexistent', [
        'Authorization' => "Bearer {$this->vaultToken}",
    ]);

    $response->assertNotFound()
        ->assertJsonPath('message', 'Invalid category.');
});

test('guide returns ordered steps', function () {
    $response = $this->getJson('/api/v1/vault/guide', [
        'Authorization' => "Bearer {$this->vaultToken}",
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'step_number', 'title', 'content', 'metadata'],
            ],
        ]);

    $steps = $response->json('data');
    expect($steps)->not->toBeEmpty();
});

test('show returns single entry', function () {
    $entry = VaultEntry::active()->first();

    $response = $this->getJson("/api/v1/vault/entries/{$entry->id}", [
        'Authorization' => "Bearer {$this->vaultToken}",
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'data' => ['id', 'category', 'title', 'content', 'sort_order', 'metadata', 'updated_at'],
        ])
        ->assertJsonPath('data.id', $entry->id);
});

test('show returns 404 for nonexistent entry', function () {
    $response = $this->getJson('/api/v1/vault/entries/00000000-0000-0000-0000-000000000000', [
        'Authorization' => "Bearer {$this->vaultToken}",
    ]);

    $response->assertNotFound()
        ->assertJsonPath('message', 'Entry not found.');
});

/**
 * Seed test vault entries for access tests.
 */
function seedVaultEntries(): void
{
    $entries = [
        ['category' => 'guide', 'title' => 'Step 1', 'content' => 'This is a test guide step 1.', 'sort_order' => 1],
        ['category' => 'guide', 'title' => 'Step 2', 'content' => 'This is a test guide step 2.', 'sort_order' => 2],
        ['category' => 'business_overview', 'title' => 'Overview', 'content' => 'This is a test business overview.', 'sort_order' => 1],
        ['category' => 'financial', 'title' => 'Finances', 'content' => 'This is test financial data.', 'sort_order' => 1],
    ];

    foreach ($entries as $data) {
        $entry = new VaultEntry;
        $entry->category = $data['category'];
        $entry->title = $data['title'];
        $entry->setContent($data['content']);
        $entry->sort_order = $data['sort_order'];
        $entry->is_active = true;
        $entry->metadata = null;
        $entry->created_at = now();
        $entry->updated_at = now();
        $entry->save();
    }
}
