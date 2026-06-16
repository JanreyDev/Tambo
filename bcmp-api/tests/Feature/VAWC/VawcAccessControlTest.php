<?php

/**
 * VAWC Case Access Control Tests
 *
 * VAWC (Violence Against Women and Children) cases are the most sensitive
 * data in the system. RA 9262 compliance requires strict access controls,
 * access logging, and confidential handling of victim information.
 *
 * These tests verify:
 * - CRUD operations work for authorized users
 * - Tenant isolation is enforced (covered in CrossTenantAccessTest too)
 * - Access is logged per RA 9262 requirements
 * - Victim names are NOT exposed in list responses
 * - Case numbering is auto-generated
 */

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\Tenant\Judicial\VawcCase;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    // Reset permission cache
    app()[PermissionRegistrar::class]->forgetCachedPermissions();

    // Seed VAWC permissions
    $guard = 'sanctum';
    Permission::firstOrCreate(['name' => 'vawc.view', 'guard_name' => $guard]);
    Permission::firstOrCreate(['name' => 'vawc.create', 'guard_name' => $guard]);
    Permission::firstOrCreate(['name' => 'vawc.edit', 'guard_name' => $guard]);

    $this->barangay = Barangay::factory()->create();
    $this->user = User::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);
    // Give user all VAWC permissions for testing
    $this->user->givePermissionTo(['vawc.view', 'vawc.create', 'vawc.edit']);

    $this->token = $this->user->createToken('test')->plainTextToken;
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
});

// ══════════════════════════════════════════════════════════════
// LIST — RA 9262: Victim names must NOT appear in list response
// ══════════════════════════════════════════════════════════════

test('can list VAWC cases for the current barangay', function () {
    VawcCase::factory()->count(3)->create(['barangay_id' => $this->barangay->id]);

    $response = $this->getJson('/api/v1/vawc-cases', $this->headers);

    $response->assertOk()
        ->assertJsonStructure(['data', 'current_page', 'total', 'per_page']);
    expect($response->json('total'))->toBe(3);
});

test('VAWC list does not expose victim name', function () {
    VawcCase::factory()->create([
        'barangay_id' => $this->barangay->id,
        'victim_name_encrypted' => 'Maria Secret Victim Name',
    ]);

    $response = $this->getJson('/api/v1/vawc-cases', $this->headers);

    $response->assertOk();
    $data = $response->json('data');
    expect(count($data))->toBe(1);

    // The list response selects specific columns and excludes victim_name_encrypted
    $firstCase = $data[0];
    expect($firstCase)->not->toHaveKey('victim_name_encrypted');
    expect($firstCase)->not->toHaveKey('respondent_name_encrypted');
    expect($firstCase)->not->toHaveKey('narrative_encrypted');
    expect($firstCase)->not->toHaveKey('victim_address_encrypted');
    expect($firstCase)->not->toHaveKey('victim_phone_encrypted');
});

test('VAWC list includes case identifiers', function () {
    VawcCase::factory()->create([
        'barangay_id' => $this->barangay->id,
        'incident_type' => 'Physical Violence',
    ]);

    $response = $this->getJson('/api/v1/vawc-cases', $this->headers);

    $firstCase = $response->json('data.0');
    expect($firstCase)->toHaveKeys(['id', 'case_number', 'incident_type', 'filing_date', 'status']);
});

test('can filter VAWC cases by status', function () {
    VawcCase::factory()->count(2)->create([
        'barangay_id' => $this->barangay->id,
        'status' => 'under_investigation',
    ]);
    VawcCase::factory()->resolved()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $response = $this->getJson('/api/v1/vawc-cases?status=under_investigation', $this->headers);

    $response->assertOk();
    expect($response->json('total'))->toBe(2);
});

// ══════════════════════════════════════════════════════════════
// VIEW — Full details including victim info (access logged)
// ══════════════════════════════════════════════════════════════

test('can view VAWC case with full details', function () {
    $vawc = VawcCase::factory()->create([
        'barangay_id' => $this->barangay->id,
        'victim_name_encrypted' => 'Confidential Victim',
        'incident_type' => 'Physical Violence',
    ]);

    $response = $this->getJson("/api/v1/vawc-cases/{$vawc->id}", $this->headers);

    $response->assertOk()
        ->assertJsonPath('vawc_case.id', $vawc->id)
        ->assertJsonPath('vawc_case.victim_name_encrypted', 'Confidential Victim')
        ->assertJsonPath('vawc_case.incident_type', 'Physical Violence');
});

test('viewing VAWC case creates access log entry', function () {
    $vawc = VawcCase::factory()->create([
        'barangay_id' => $this->barangay->id,
        'access_log' => [],
    ]);

    $this->getJson("/api/v1/vawc-cases/{$vawc->id}", $this->headers);

    $vawc->refresh();
    $accessLog = $vawc->access_log;
    expect($accessLog)->toBeArray();
    expect(count($accessLog))->toBe(1);
    expect($accessLog[0]['user_id'])->toBe($this->user->id);
    expect($accessLog[0])->toHaveKeys(['user_id', 'accessed_at', 'ip_address']);
});

test('multiple views accumulate access log entries', function () {
    $vawc = VawcCase::factory()->create([
        'barangay_id' => $this->barangay->id,
        'access_log' => [],
    ]);

    $this->getJson("/api/v1/vawc-cases/{$vawc->id}", $this->headers);
    $this->getJson("/api/v1/vawc-cases/{$vawc->id}", $this->headers);
    $this->getJson("/api/v1/vawc-cases/{$vawc->id}", $this->headers);

    $vawc->refresh();
    expect(count($vawc->access_log))->toBe(3);
});

test('cannot view VAWC case from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $vawc = VawcCase::factory()->create(['barangay_id' => $otherBarangay->id]);

    $response = $this->getJson("/api/v1/vawc-cases/{$vawc->id}", $this->headers);

    $response->assertNotFound();
});

// ══════════════════════════════════════════════════════════════
// CREATE
// ══════════════════════════════════════════════════════════════

test('can create a VAWC case with required fields', function () {
    $response = $this->postJson('/api/v1/vawc-cases', [
        'incident_type' => 'Physical Violence',
        'filing_date' => now()->toDateString(),
        'incident_date' => now()->subDays(2)->toDateString(),
        'victim_name_encrypted' => 'Maria Santos',
        'respondent_name_encrypted' => 'Juan Cruz',
        'respondent_relationship' => 'husband',
    ], $this->headers);

    $response->assertCreated()
        ->assertJsonPath('message', 'VAWC case created.')
        ->assertJsonPath('vawc_case.incident_type', 'Physical Violence')
        ->assertJsonPath('vawc_case.status', 'under_investigation');
})->skip(
    fn () => config('database.default') !== 'pgsql',
    'Case number generation uses PostgreSQL ilike + SUBSTRING regex'
);

test('VAWC case auto-generates case number', function () {
    $response = $this->postJson('/api/v1/vawc-cases', [
        'incident_type' => 'Psychological Violence',
        'filing_date' => now()->toDateString(),
        'incident_date' => now()->toDateString(),
        'victim_name_encrypted' => 'Test Victim',
        'respondent_name_encrypted' => 'Test Respondent',
        'respondent_relationship' => 'live-in partner',
    ], $this->headers);

    $response->assertCreated();
    $year = now()->format('Y');
    expect($response->json('vawc_case.case_number'))->toStartWith("VAWC-{$year}-");
})->skip(
    fn () => config('database.default') !== 'pgsql',
    'Case number generation uses PostgreSQL ilike + SUBSTRING regex'
);

test('VAWC case creation logs initial access entry', function () {
    $response = $this->postJson('/api/v1/vawc-cases', [
        'incident_type' => 'Economic Abuse',
        'filing_date' => now()->toDateString(),
        'incident_date' => now()->toDateString(),
        'victim_name_encrypted' => 'Test',
        'respondent_name_encrypted' => 'Test',
        'respondent_relationship' => 'boyfriend',
    ], $this->headers);

    $response->assertCreated();
    $accessLog = $response->json('vawc_case.access_log');
    expect($accessLog)->toBeArray();
    expect(count($accessLog))->toBe(1);
    expect($accessLog[0]['action'])->toBe('created');
    expect($accessLog[0]['user_id'])->toBe($this->user->id);
})->skip(
    fn () => config('database.default') !== 'pgsql',
    'Case number generation uses PostgreSQL ilike + SUBSTRING regex'
);

test('create VAWC case validates required fields', function () {
    $response = $this->postJson('/api/v1/vawc-cases', [], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['incident_type', 'filing_date', 'incident_date', 'victim_name_encrypted', 'respondent_name_encrypted', 'respondent_relationship']);
});

test('create VAWC case rejects invalid status', function () {
    $response = $this->postJson('/api/v1/vawc-cases', [
        'incident_type' => 'Physical Violence',
        'filing_date' => now()->toDateString(),
        'incident_date' => now()->toDateString(),
        'victim_name_encrypted' => 'Test',
        'respondent_name_encrypted' => 'Test',
        'respondent_relationship' => 'husband',
        'status' => 'invalid_status',
    ], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

test('create VAWC case assigns to current user barangay', function () {
    $response = $this->postJson('/api/v1/vawc-cases', [
        'incident_type' => 'Physical Violence',
        'filing_date' => now()->toDateString(),
        'incident_date' => now()->toDateString(),
        'victim_name_encrypted' => 'Test',
        'respondent_name_encrypted' => 'Test',
        'respondent_relationship' => 'husband',
    ], $this->headers);

    $response->assertCreated();
    $caseId = $response->json('vawc_case.id');
    $vawc = VawcCase::find($caseId);
    expect($vawc->barangay_id)->toBe($this->barangay->id);
})->skip(
    fn () => config('database.default') !== 'pgsql',
    'Case number generation uses PostgreSQL ilike + SUBSTRING regex'
);

// ══════════════════════════════════════════════════════════════
// UPDATE
// ══════════════════════════════════════════════════════════════

test('can update VAWC case status', function () {
    $vawc = VawcCase::factory()->create([
        'barangay_id' => $this->barangay->id,
        'status' => 'under_investigation',
    ]);

    $response = $this->putJson("/api/v1/vawc-cases/{$vawc->id}", [
        'status' => 'resolved',
    ], $this->headers);

    $response->assertOk()
        ->assertJsonPath('message', 'VAWC case updated.')
        ->assertJsonPath('vawc_case.status', 'resolved');
});

test('VAWC case update logs access entry', function () {
    $vawc = VawcCase::factory()->create([
        'barangay_id' => $this->barangay->id,
        'access_log' => [],
    ]);

    $this->putJson("/api/v1/vawc-cases/{$vawc->id}", [
        'status' => 'resolved',
    ], $this->headers);

    $vawc->refresh();
    $accessLog = $vawc->access_log;
    $lastEntry = $accessLog[count($accessLog) - 1];
    expect($lastEntry['action'])->toBe('updated');
    expect($lastEntry['user_id'])->toBe($this->user->id);
});

test('cannot update VAWC case from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $vawc = VawcCase::factory()->create([
        'barangay_id' => $otherBarangay->id,
        'status' => 'under_investigation',
    ]);

    $response = $this->putJson("/api/v1/vawc-cases/{$vawc->id}", [
        'status' => 'resolved',
    ], $this->headers);

    $response->assertNotFound();
    $vawc->refresh();
    expect($vawc->status)->toBe('under_investigation');
});

// ══════════════════════════════════════════════════════════════
// DELETE
// ══════════════════════════════════════════════════════════════

test('can soft delete a VAWC case', function () {
    $vawc = VawcCase::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $response = $this->deleteJson("/api/v1/vawc-cases/{$vawc->id}", [], $this->headers);

    $response->assertOk()
        ->assertJsonPath('message', 'VAWC case deleted.');
    $this->assertSoftDeleted('vawc_cases', ['id' => $vawc->id]);
});

test('soft deleted VAWC case does not appear in listing', function () {
    $vawc = VawcCase::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->deleteJson("/api/v1/vawc-cases/{$vawc->id}", [], $this->headers);

    $response = $this->getJson('/api/v1/vawc-cases', $this->headers);
    expect($response->json('total'))->toBe(0);
});

test('cannot delete VAWC case from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $vawc = VawcCase::factory()->create(['barangay_id' => $otherBarangay->id]);

    $response = $this->deleteJson("/api/v1/vawc-cases/{$vawc->id}", [], $this->headers);

    $response->assertNotFound();
    expect(VawcCase::find($vawc->id))->not->toBeNull();
});

// ══════════════════════════════════════════════════════════════
// AUTHENTICATION
// ══════════════════════════════════════════════════════════════

test('VAWC endpoints require authentication', function () {
    $this->getJson('/api/v1/vawc-cases')->assertUnauthorized();
    $this->postJson('/api/v1/vawc-cases', [])->assertUnauthorized();
});

test('VAWC case view requires authentication', function () {
    $vawc = VawcCase::factory()->create(['barangay_id' => $this->barangay->id]);

    $response = $this->getJson("/api/v1/vawc-cases/{$vawc->id}");

    $response->assertUnauthorized();
});

// ══════════════════════════════════════════════════════════════
// TENANT ISOLATION
// ══════════════════════════════════════════════════════════════

test('VAWC cases are scoped to authenticated user barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    VawcCase::factory()->count(2)->create(['barangay_id' => $this->barangay->id]);
    VawcCase::factory()->count(5)->create(['barangay_id' => $otherBarangay->id]);

    $response = $this->getJson('/api/v1/vawc-cases', $this->headers);

    $response->assertOk();
    expect($response->json('total'))->toBe(2);

    $data = $response->json('data');
    foreach ($data as $case) {
        expect($case['barangay_id'])->toBe($this->barangay->id);
    }
});
