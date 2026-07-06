<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\AuditLog;

beforeEach(function () {
    $this->admin = AdminUser::factory()->create(['status' => 'active']);
    $this->token = $this->admin->createToken('test')->plainTextToken;
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
});

test('can list audit logs', function () {
    AuditLog::log(
        adminUserId: $this->admin->id,
        action: 'test_action',
        resourceType: 'admin_user',
        resourceId: $this->admin->id,
        description: 'Test audit entry',
    );

    $response = $this->getJson('/api/v1/audit-logs', $this->headers);

    $response->assertOk()
        ->assertJsonStructure([
            'data',
        ]);
});

test('audit logs are paginated', function () {
    for ($i = 0; $i < 30; $i++) {
        AuditLog::log(
            adminUserId: $this->admin->id,
            action: 'test',
            description: "Log entry {$i}",
        );
    }

    $response = $this->getJson('/api/v1/audit-logs?per_page=10', $this->headers);

    $response->assertOk()
        ->assertJsonPath('per_page', 10);
});

test('can filter audit logs by action', function () {
    AuditLog::log(adminUserId: $this->admin->id, action: 'login');
    AuditLog::log(adminUserId: $this->admin->id, action: 'create');
    AuditLog::log(adminUserId: $this->admin->id, action: 'login');

    $response = $this->getJson('/api/v1/audit-logs?action=login', $this->headers);

    $response->assertOk();

    $logs = collect($response->json('data'));
    $logs->each(function ($log) {
        expect($log['action'])->toBe('login');
    });
});

test('can filter audit logs by resource_type', function () {
    AuditLog::log(adminUserId: $this->admin->id, action: 'create', resourceType: 'admin_user');
    AuditLog::log(adminUserId: $this->admin->id, action: 'update', resourceType: 'platform_setting');

    $response = $this->getJson('/api/v1/audit-logs?resource_type=admin_user', $this->headers);

    $response->assertOk();

    $logs = collect($response->json('data'));
    $logs->each(function ($log) {
        expect($log['resource_type'])->toBe('admin_user');
    });
});

test('can filter audit logs by admin_user_id', function () {
    $otherAdmin = AdminUser::factory()->create();

    AuditLog::log(adminUserId: $this->admin->id, action: 'login');
    AuditLog::log(adminUserId: $otherAdmin->id, action: 'login');

    $response = $this->getJson("/api/v1/audit-logs?admin_user_id={$this->admin->id}", $this->headers);

    $response->assertOk();

    $logs = collect($response->json('data'));
    $logs->each(function ($log) {
        expect($log['admin_user_id'])->toBe($this->admin->id);
    });
});

test('audit logs are ordered by created_at descending', function () {
    AuditLog::log(adminUserId: $this->admin->id, action: 'first');
    AuditLog::log(adminUserId: $this->admin->id, action: 'second');
    AuditLog::log(adminUserId: $this->admin->id, action: 'third');

    $response = $this->getJson('/api/v1/audit-logs', $this->headers);

    $response->assertOk();

    $logs = collect($response->json('data'));
    if ($logs->count() >= 2) {
        $timestamps = $logs->pluck('created_at')->toArray();
        for ($i = 0; $i < count($timestamps) - 1; $i++) {
            expect($timestamps[$i])->toBeGreaterThanOrEqual($timestamps[$i + 1]);
        }
    }
});

test('audit logs includes admin user relation', function () {
    AuditLog::log(
        adminUserId: $this->admin->id,
        action: 'test',
        description: 'Test with user',
    );

    $response = $this->getJson('/api/v1/audit-logs', $this->headers);

    $response->assertOk();

    $logs = collect($response->json('data'));
    $firstLog = $logs->first();
    expect($firstLog)->toHaveKey('admin_user');
});

test('audit logs requires authentication', function () {
    $this->getJson('/api/v1/audit-logs')->assertUnauthorized();
});
