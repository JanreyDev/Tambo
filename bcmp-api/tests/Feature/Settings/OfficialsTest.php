<?php

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\Tenant\Officials\BarangayOfficial;
use App\Models\Tenant\Resident;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Cache::flush();

    foreach (['kapitan', 'secretary'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'sanctum']);
    }

    $this->barangay = Barangay::factory()->create();
    $this->user = User::factory()->create([
        'barangay_id' => $this->barangay->id,
        'status' => 'active',
    ]);
    $this->user->assignRole('kapitan');

    $this->token = $this->user->createToken('test')->plainTextToken;
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
});

// ──────────────────────────────────────────────────────────────
// Happy path — create + read + update + delete
// ──────────────────────────────────────────────────────────────

test('authenticated user can list officials for their barangay', function () {
    $resident = Resident::factory()->create(['barangay_id' => $this->barangay->id]);
    BarangayOfficial::factory()->create([
        'barangay_id' => $this->barangay->id,
        'resident_id' => $resident->id,
        'position' => 'kapitan',
        'term_start' => '2025-07-01',
        'term_end' => '2028-06-30',
    ]);

    $response = $this->getJson('/api/v1/officials', $this->headers);

    $response->assertOk()
        ->assertJsonStructure(['data', 'current_page', 'total']);

    expect($response->json('total'))->toBe(1);
});

test('list eager-loads resident name for UI display', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
    ]);
    BarangayOfficial::factory()->create([
        'barangay_id' => $this->barangay->id,
        'resident_id' => $resident->id,
        'position' => 'kapitan',
    ]);

    $response = $this->getJson('/api/v1/officials', $this->headers);

    $response->assertOk()
        ->assertJsonPath('data.0.resident.first_name', 'Juan')
        ->assertJsonPath('data.0.resident.last_name', 'Dela Cruz');
});

test('kapitan can create a new official', function () {
    $resident = Resident::factory()->create(['barangay_id' => $this->barangay->id]);

    $response = $this->postJson('/api/v1/officials', [
        'resident_id' => $resident->id,
        'position' => 'kapitan',
        'term_start' => '2025-07-01',
        'term_end' => '2028-06-30',
        'is_elected' => true,
    ], $this->headers);

    $response->assertStatus(201)
        ->assertJsonPath('official.position', 'kapitan')
        ->assertJsonPath('official.barangay_id', $this->barangay->id);

    expect(BarangayOfficial::count())->toBe(1);
});

test('official is created with resident eager-loaded in response', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'first_name' => 'Maria',
        'last_name' => 'Santos',
    ]);

    $response = $this->postJson('/api/v1/officials', [
        'resident_id' => $resident->id,
        'position' => 'secretary',
        'term_start' => '2025-07-01',
        'term_end' => '2028-06-30',
    ], $this->headers);

    $response->assertStatus(201)
        ->assertJsonPath('official.resident.first_name', 'Maria')
        ->assertJsonPath('official.resident.last_name', 'Santos');
});

test('kapitan can update an official', function () {
    $resident = Resident::factory()->create(['barangay_id' => $this->barangay->id]);
    $official = BarangayOfficial::factory()->create([
        'barangay_id' => $this->barangay->id,
        'resident_id' => $resident->id,
        'position' => 'kagawad',
        'committee' => null,
    ]);

    $response = $this->putJson("/api/v1/officials/{$official->id}", [
        'committee' => 'Peace and Order',
    ], $this->headers);

    $response->assertOk();
    expect($official->fresh()->committee)->toBe('Peace and Order');
});

test('kapitan can soft-delete an official', function () {
    $resident = Resident::factory()->create(['barangay_id' => $this->barangay->id]);
    $official = BarangayOfficial::factory()->create([
        'barangay_id' => $this->barangay->id,
        'resident_id' => $resident->id,
    ]);

    $response = $this->deleteJson("/api/v1/officials/{$official->id}", [], $this->headers);

    $response->assertOk();
    expect(BarangayOfficial::find($official->id))->toBeNull(); // soft-deleted, not visible
    expect(BarangayOfficial::withTrashed()->find($official->id))->not->toBeNull(); // still exists
});

// ──────────────────────────────────────────────────────────────
// Tenant isolation — the critical security boundary
// ──────────────────────────────────────────────────────────────

test('cannot create official with resident_id from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $foreignResident = Resident::factory()->create(['barangay_id' => $otherBarangay->id]);

    $response = $this->postJson('/api/v1/officials', [
        'resident_id' => $foreignResident->id,
        'position' => 'kapitan',
        'term_start' => '2025-07-01',
        'term_end' => '2028-06-30',
    ], $this->headers);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['resident_id']);

    expect(BarangayOfficial::count())->toBe(0);
});

test('cannot view officials from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $otherResident = Resident::factory()->create(['barangay_id' => $otherBarangay->id]);
    $otherOfficial = BarangayOfficial::factory()->create([
        'barangay_id' => $otherBarangay->id,
        'resident_id' => $otherResident->id,
    ]);

    $response = $this->getJson("/api/v1/officials/{$otherOfficial->id}", $this->headers);

    $response->assertStatus(404); // tenant scope hides cross-barangay records
});

test('cannot update officials from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $otherResident = Resident::factory()->create(['barangay_id' => $otherBarangay->id]);
    $otherOfficial = BarangayOfficial::factory()->create([
        'barangay_id' => $otherBarangay->id,
        'resident_id' => $otherResident->id,
        'committee' => 'Original',
    ]);

    $response = $this->putJson("/api/v1/officials/{$otherOfficial->id}", [
        'committee' => 'Hacked',
    ], $this->headers);

    $response->assertStatus(404);
    expect($otherOfficial->fresh()->committee)->toBe('Original');
});

test('cannot delete officials from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $otherResident = Resident::factory()->create(['barangay_id' => $otherBarangay->id]);
    $otherOfficial = BarangayOfficial::factory()->create([
        'barangay_id' => $otherBarangay->id,
        'resident_id' => $otherResident->id,
    ]);

    $response = $this->deleteJson("/api/v1/officials/{$otherOfficial->id}", [], $this->headers);

    $response->assertStatus(404);
    expect(BarangayOfficial::find($otherOfficial->id))->not->toBeNull();
});

test('list only returns officials belonging to the users barangay', function () {
    // Mine
    $r1 = Resident::factory()->create(['barangay_id' => $this->barangay->id]);
    BarangayOfficial::factory()->create(['barangay_id' => $this->barangay->id, 'resident_id' => $r1->id]);

    // Other barangay
    $otherBarangay = Barangay::factory()->create();
    $r2 = Resident::factory()->create(['barangay_id' => $otherBarangay->id]);
    BarangayOfficial::factory()->create(['barangay_id' => $otherBarangay->id, 'resident_id' => $r2->id]);

    $response = $this->getJson('/api/v1/officials', $this->headers);

    $response->assertOk();
    expect($response->json('total'))->toBe(1);
});

// ──────────────────────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────────────────────

test('resident_id is required when creating', function () {
    $response = $this->postJson('/api/v1/officials', [
        'position' => 'kapitan',
        'term_start' => '2025-07-01',
        'term_end' => '2028-06-30',
    ], $this->headers);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['resident_id']);
});

test('term_end must be after term_start when both provided', function () {
    $resident = Resident::factory()->create(['barangay_id' => $this->barangay->id]);

    $response = $this->postJson('/api/v1/officials', [
        'resident_id' => $resident->id,
        'position' => 'kapitan',
        'term_start' => '2028-06-30',
        'term_end' => '2025-07-01', // BEFORE start
    ], $this->headers);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['term_end']);
});

test('term dates are optional when only name and position are provided', function () {
    $resident = Resident::factory()->create(['barangay_id' => $this->barangay->id]);

    $response = $this->postJson('/api/v1/officials', [
        'resident_id' => $resident->id,
        'position' => 'kapitan',
        // no term_start, no term_end
    ], $this->headers);

    $response->assertStatus(201)
        ->assertJsonPath('official.term_start', null)
        ->assertJsonPath('official.term_end', null);
});

test('committees array can be set with multiple committees', function () {
    $resident = Resident::factory()->create(['barangay_id' => $this->barangay->id]);

    $response = $this->postJson('/api/v1/officials', [
        'resident_id' => $resident->id,
        'position' => 'kagawad',
        'committees' => ['Peace and Order', 'Health', 'Appropriations'],
    ], $this->headers);

    $response->assertStatus(201)
        ->assertJsonPath('official.committees', ['Peace and Order', 'Health', 'Appropriations']);

    $official = BarangayOfficial::first();
    expect($official->committees)->toBe(['Peace and Order', 'Health', 'Appropriations']);
});

test('committees array can be updated to a different list', function () {
    $resident = Resident::factory()->create(['barangay_id' => $this->barangay->id]);
    $official = BarangayOfficial::factory()->create([
        'barangay_id' => $this->barangay->id,
        'resident_id' => $resident->id,
        'committees' => ['Peace and Order'],
    ]);

    $response = $this->putJson("/api/v1/officials/{$official->id}", [
        'committees' => ['Health', 'Education'],
    ], $this->headers);

    $response->assertOk();
    expect($official->fresh()->committees)->toBe(['Health', 'Education']);
});

test('committee item length is capped at 120 chars', function () {
    $resident = Resident::factory()->create(['barangay_id' => $this->barangay->id]);

    $response = $this->postJson('/api/v1/officials', [
        'resident_id' => $resident->id,
        'position' => 'kagawad',
        'committees' => [str_repeat('A', 200)],
    ], $this->headers);

    $response->assertStatus(422);
});

// ──────────────────────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────────────────────

test('unauthenticated request to list officials returns 401', function () {
    $response = $this->getJson('/api/v1/officials');
    $response->assertStatus(401);
});

test('unauthenticated request to create official returns 401', function () {
    $resident = Resident::factory()->create(['barangay_id' => $this->barangay->id]);

    $response = $this->postJson('/api/v1/officials', [
        'resident_id' => $resident->id,
        'position' => 'kapitan',
        'term_start' => '2025-07-01',
        'term_end' => '2028-06-30',
    ]);

    $response->assertStatus(401);
});
