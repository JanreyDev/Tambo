<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\ProductConnection;

beforeEach(function () {
    $this->admin = AdminUser::factory()->create(['status' => 'active']);
    $this->token = $this->admin->createToken('test')->plainTextToken;
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
});

test('can get dashboard overview', function () {
    $response = $this->getJson('/api/v1/dashboard/overview', $this->headers);

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                'products',
                'audit_logs_last_24h',
                'admin_users' => [
                    'total',
                    'active',
                ],
            ],
        ]);
});

test('dashboard overview returns correct admin user counts', function () {
    AdminUser::factory()->count(2)->create(['status' => 'active']);
    AdminUser::factory()->inactive()->create();

    $response = $this->getJson('/api/v1/dashboard/overview', $this->headers);

    $response->assertOk();

    $data = $response->json('data.admin_users');
    // 3 active (2 new + 1 from beforeEach) + 1 inactive = 4 total
    expect($data['total'])->toBe(4);
    expect($data['active'])->toBe(3);
});

test('dashboard overview returns product connections', function () {
    ProductConnection::create([
        'product_slug' => 'bcmp',
        'product_name' => 'BCMP',
        'api_base_url' => 'https://v5-api.kapitan.ph',
        'api_token' => 'test-token',
        'status' => 'active',
    ]);

    $response = $this->getJson('/api/v1/dashboard/overview', $this->headers);

    $response->assertOk();

    $products = $response->json('data.products');
    expect($products)->toHaveCount(1);
    expect($products[0]['product_slug'])->toBe('bcmp');
});

test('dashboard overview counts recent audit logs', function () {
    AuditLog::log(
        adminUserId: $this->admin->id,
        action: 'test',
        description: 'Test audit log',
    );

    $response = $this->getJson('/api/v1/dashboard/overview', $this->headers);

    $response->assertOk();

    // At least 1 audit log in last 24h (the one we just created)
    expect($response->json('data.audit_logs_last_24h'))->toBeGreaterThanOrEqual(1);
});

test('dashboard overview requires authentication', function () {
    $response = $this->getJson('/api/v1/dashboard/overview');

    $response->assertUnauthorized();
});

test('product health endpoint requires authentication', function () {
    $response = $this->getJson('/api/v1/dashboard/product-health');

    $response->assertUnauthorized();
});
