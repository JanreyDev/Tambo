<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\PlatformSetting;

beforeEach(function () {
    $this->admin = AdminUser::factory()->create(['status' => 'active']);
    $this->token = $this->admin->createToken('test')->plainTextToken;
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
});

test('can list settings', function () {
    PlatformSetting::set('general', 'app_name', 'PrimeX', 'string', 'Application name');
    PlatformSetting::set('general', 'maintenance_mode', 'false', 'boolean', 'Maintenance toggle');

    $response = $this->getJson('/api/v1/settings', $this->headers);

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                'general',
            ],
        ]);
});

test('settings are grouped by category', function () {
    PlatformSetting::set('general', 'app_name', 'PrimeX');
    PlatformSetting::set('email', 'smtp_host', 'localhost');

    $response = $this->getJson('/api/v1/settings', $this->headers);

    $response->assertOk();

    $data = $response->json('data');
    expect($data)->toHaveKeys(['general', 'email']);
});

test('can update a setting', function () {
    PlatformSetting::set('general', 'app_name', 'PrimeX', 'string', 'Application name');

    $response = $this->putJson('/api/v1/settings/general/app_name', [
        'value' => 'PrimeX Admin',
    ], $this->headers);

    $response->assertOk()
        ->assertJsonPath('data.value', 'PrimeX Admin')

        ->assertJsonPath('message', 'Setting updated successfully.');
});

test('update setting creates audit log', function () {
    PlatformSetting::set('general', 'app_name', 'PrimeX');

    $this->putJson('/api/v1/settings/general/app_name', [
        'value' => 'Changed',
    ], $this->headers);

    $this->assertDatabaseHas('audit_logs', [
        'admin_user_id' => $this->admin->id,
        'action' => 'update',
        'resource_type' => 'platform_setting',
    ]);
});

test('update nonexistent setting returns 404', function () {
    $response = $this->putJson('/api/v1/settings/nonexistent/key', [
        'value' => 'test',
    ], $this->headers);

    $response->assertNotFound();
});

test('update setting accepts null value', function () {
    PlatformSetting::set('general', 'optional', 'something');

    $response = $this->putJson('/api/v1/settings/general/optional', [
        'value' => null,
    ], $this->headers);

    $response->assertOk();
});

test('settings requires authentication', function () {
    $this->getJson('/api/v1/settings')->assertUnauthorized();
});

test('update settings requires authentication', function () {
    PlatformSetting::set('general', 'app_name', 'PrimeX');

    $this->putJson('/api/v1/settings/general/app_name', [
        'value' => 'test',
    ])->assertUnauthorized();
});
