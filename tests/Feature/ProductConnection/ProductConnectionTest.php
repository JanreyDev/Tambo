<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ProductConnection;

beforeEach(function () {
    $this->admin = AdminUser::factory()->create(['status' => 'active']);
    $this->token = $this->admin->createToken('test')->plainTextToken;
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
});

test('can list product connections', function () {
    ProductConnection::create([
        'product_slug' => 'bcmp',
        'product_name' => 'BCMP',
        'api_base_url' => 'https://staging-api-bcmp.primex.ventures',
        'api_token' => 'test-token',
        'status' => 'active',
    ]);

    $response = $this->getJson('/api/v1/product-connections', $this->headers);

    $response->assertOk()
        ->assertJsonStructure([
            'data',
        ]);

    $connections = $response->json('data');
    expect($connections)->toHaveCount(1);
    expect($connections[0]['product_slug'])->toBe('bcmp');
});

test('product connections do not expose api_token directly', function () {
    ProductConnection::create([
        'product_slug' => 'bcmp',
        'product_name' => 'BCMP',
        'api_base_url' => 'https://staging-api-bcmp.primex.ventures',
        'api_token' => 'secret-token-value',
        'status' => 'active',
    ]);

    $response = $this->getJson('/api/v1/product-connections', $this->headers);

    $response->assertOk();

    $connections = $response->json('data');
    // The API response should not include the raw api_token
    expect($connections[0])->not->toHaveKey('api_token');
});

test('can view single product connection', function () {
    $connection = ProductConnection::create([
        'product_slug' => 'lgmp',
        'product_name' => 'LGMP',
        'api_base_url' => 'https://staging-api-lgmp.primex.ventures',
        'api_token' => 'test-token',
        'status' => 'active',
    ]);

    $response = $this->getJson("/api/v1/product-connections/{$connection->id}", $this->headers);

    $response->assertOk()
        ->assertJsonPath('data.product_slug', 'lgmp')
        ->assertJsonPath('data.product_name', 'LGMP');
});

test('can update product connection', function () {
    $connection = ProductConnection::create([
        'product_slug' => 'bcmp',
        'product_name' => 'BCMP',
        'api_base_url' => 'https://old-url.primex.ventures',
        'api_token' => 'test-token',
        'status' => 'active',
    ]);

    $response = $this->putJson("/api/v1/product-connections/{$connection->id}", [
        'api_base_url' => 'https://new-url.primex.ventures',
    ], $this->headers);

    $response->assertOk()
        ->assertJsonPath('data.api_base_url', 'https://new-url.primex.ventures');
});

test('can update product connection status', function () {
    $connection = ProductConnection::create([
        'product_slug' => 'pdmp',
        'product_name' => 'PDMP',
        'api_base_url' => 'https://staging-api-pdmp.primex.ventures',
        'api_token' => 'test-token',
        'status' => 'active',
    ]);

    $response = $this->putJson("/api/v1/product-connections/{$connection->id}", [
        'status' => 'inactive',
    ], $this->headers);

    $response->assertOk()
        ->assertJsonPath('data.status', 'inactive');
});

test('update product connection validates status values', function () {
    $connection = ProductConnection::create([
        'product_slug' => 'bcmp',
        'product_name' => 'BCMP',
        'api_base_url' => 'https://staging-api-bcmp.primex.ventures',
        'api_token' => 'test-token',
        'status' => 'active',
    ]);

    $response = $this->putJson("/api/v1/product-connections/{$connection->id}", [
        'status' => 'invalid_status',
    ], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

test('update product connection validates url format', function () {
    $connection = ProductConnection::create([
        'product_slug' => 'bcmp',
        'product_name' => 'BCMP',
        'api_base_url' => 'https://staging-api-bcmp.primex.ventures',
        'api_token' => 'test-token',
        'status' => 'active',
    ]);

    $response = $this->putJson("/api/v1/product-connections/{$connection->id}", [
        'api_base_url' => 'not-a-url',
    ], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['api_base_url']);
});

test('update product connection creates audit log', function () {
    $connection = ProductConnection::create([
        'product_slug' => 'bcmp',
        'product_name' => 'BCMP',
        'api_base_url' => 'https://staging-api-bcmp.primex.ventures',
        'api_token' => 'test-token',
        'status' => 'active',
    ]);

    $this->putJson("/api/v1/product-connections/{$connection->id}", [
        'status' => 'inactive',
    ], $this->headers);

    $this->assertDatabaseHas('audit_logs', [
        'admin_user_id' => $this->admin->id,
        'action' => 'update',
        'resource_type' => 'product_connection',
        'resource_id' => $connection->id,
    ]);
});

test('view nonexistent product connection returns 404', function () {
    $fakeId = '00000000-0000-0000-0000-000000000000';

    $response = $this->getJson("/api/v1/product-connections/{$fakeId}", $this->headers);

    $response->assertNotFound();
});

test('product connections do not have store endpoint', function () {
    $response = $this->postJson('/api/v1/product-connections', [
        'product_slug' => 'new',
        'product_name' => 'New Product',
    ], $this->headers);

    $response->assertStatus(405);
});

test('product connections do not have destroy endpoint', function () {
    $connection = ProductConnection::create([
        'product_slug' => 'bcmp',
        'product_name' => 'BCMP',
        'api_base_url' => 'https://staging-api-bcmp.primex.ventures',
        'api_token' => 'test-token',
        'status' => 'active',
    ]);

    $response = $this->deleteJson("/api/v1/product-connections/{$connection->id}", [], $this->headers);

    $response->assertStatus(405);
});

test('product connections require authentication', function () {
    $this->getJson('/api/v1/product-connections')->assertUnauthorized();
});
