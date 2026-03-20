<?php

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\Platform\AuditLog;
use App\Models\Tenant\Resident;
use App\Models\User;

beforeEach(function () {
    $this->barangay = Barangay::factory()->create();
    $this->user = User::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);
    $this->token = $this->user->createToken('test')->plainTextToken;
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
});

// ── Resident View Logging ──

test('viewing a resident creates an audit log entry', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->getJson("/api/v1/residents/{$resident->id}", $this->headers);

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $resident->id)
        ->where('action', 'viewed')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->user_id)->toBe($this->user->id);
    expect($log->barangay_id)->toBe($this->barangay->id);
    expect($log->module)->toBe('residents');
    expect($log->ip_address)->not->toBeNull();
    expect($log->user_agent)->not->toBeNull();
});

// ── Resident Create Logging ──

test('creating a resident creates an audit log entry', function () {
    $response = $this->postJson('/api/v1/residents', [
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'date_of_birth' => '1990-01-15',
        'sex' => 'female',
        'place_of_birth' => 'Olongapo City, Zambales',
        'civil_status' => 'single',
        'resident_type' => 'permanent',
    ], $this->headers);

    $response->assertCreated();

    $residentId = $response->json('resident.id');

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $residentId)
        ->where('action', 'created')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->user_id)->toBe($this->user->id);
    expect($log->barangay_id)->toBe($this->barangay->id);
});

// ── Resident Update Logging with Changes ──

test('updating a resident creates an audit log with field changes', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'first_name' => 'Maria',
        'occupation' => null,
    ]);

    $this->putJson("/api/v1/residents/{$resident->id}", [
        'first_name' => 'Maria Updated',
        'occupation' => 'Farmer',
    ], $this->headers);

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $resident->id)
        ->where('action', 'updated')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->changes)->toBeArray();
    expect($log->changes)->toHaveKey('first_name');
});

// ── Resident Delete Logging ──

test('deleting a resident creates an audit log entry', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->deleteJson("/api/v1/residents/{$resident->id}", [], $this->headers);

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $resident->id)
        ->where('action', 'deleted')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->user_id)->toBe($this->user->id);
});

// ── Audit Log Scoping ──

test('audit logs are scoped to barangay', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->getJson("/api/v1/residents/{$resident->id}", $this->headers);

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $resident->id)
        ->first();

    expect($log->barangay_id)->toBe($this->barangay->id);
});

test('audit log records IP address from request', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->getJson("/api/v1/residents/{$resident->id}", $this->headers);

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $resident->id)
        ->first();

    expect($log->ip_address)->not->toBeNull();
});

// ── Activity Endpoint ──

test('can retrieve audit log history for a resident', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    // Generate activity
    $this->getJson("/api/v1/residents/{$resident->id}", $this->headers);

    $response = $this->getJson("/api/v1/residents/{$resident->id}/activity", $this->headers);

    $response->assertOk();
    expect($response->json('data'))->toBeArray();
});

// ── Cross-Barangay Audit Isolation ──

test('audit logs from another barangay are not accessible', function () {
    $otherBarangay = Barangay::factory()->create();
    $otherUser = User::factory()->create([
        'barangay_id' => $otherBarangay->id,
    ]);
    $otherToken = $otherUser->createToken('test')->plainTextToken;
    $otherResident = Resident::factory()->create([
        'barangay_id' => $otherBarangay->id,
    ]);

    // Create audit log for other barangay
    AuditLog::create([
        'barangay_id' => $otherBarangay->id,
        'user_id' => $otherUser->id,
        'action' => 'viewed',
        'resource_type' => 'resident',
        'resource_id' => $otherResident->id,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'test',
        'module' => 'residents',
    ]);

    // Try to view other barangay's resident activity
    $response = $this->getJson("/api/v1/residents/{$otherResident->id}/activity", $this->headers);

    // Should not find the resident (tenant scoping)
    $response->assertNotFound();
});
