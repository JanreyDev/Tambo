<?php

/**
 * Tenant Isolation Tests — THE most critical test suite.
 *
 * Every test verifies that User A (Barangay X) CANNOT access
 * data belonging to Barangay Y. If any test here fails, we have
 * a data breach. RLS + application scopes = two independent layers.
 */

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\Tenant\Resident;
use App\Models\User;

beforeEach(function () {
    // Barangay A — the "attacker"
    $this->barangayA = Barangay::factory()->create(['name' => 'Barangay Alpha']);
    $this->userA = User::factory()->create([
        'barangay_id' => $this->barangayA->id,
    ]);
    $this->tokenA = $this->userA->createToken('test')->plainTextToken;
    $this->headersA = ['Authorization' => "Bearer {$this->tokenA}"];

    // Barangay B — the "victim"
    $this->barangayB = Barangay::factory()->create(['name' => 'Barangay Bravo']);
    $this->userB = User::factory()->create([
        'barangay_id' => $this->barangayB->id,
    ]);
    $this->tokenB = $this->userB->createToken('test')->plainTextToken;
    $this->headersB = ['Authorization' => "Bearer {$this->tokenB}"];

    // Barangay B has residents
    $this->residentB = Resident::factory()->create([
        'barangay_id' => $this->barangayB->id,
        'first_name' => 'Secret',
        'last_name' => 'Resident',
    ]);
});

// ── LIST: User A cannot see Barangay B residents ──

test('user A listing residents sees zero from Barangay B', function () {
    Resident::factory()->count(5)->create(['barangay_id' => $this->barangayB->id]);

    $response = $this->getJson('/api/v1/residents', $this->headersA);

    $response->assertOk();
    expect($response->json('total'))->toBe(0);

    // Verify none of Barangay B's data leaked
    $data = $response->json('data');
    foreach ($data as $resident) {
        expect($resident['barangay_id'])->not->toBe($this->barangayB->id);
    }
});

// ── VIEW: User A cannot view a Barangay B resident by ID ──

test('user A cannot view Barangay B resident by ID', function () {
    $response = $this->getJson(
        "/api/v1/residents/{$this->residentB->id}",
        $this->headersA,
    );

    $response->assertNotFound();
});

// ── UPDATE: User A cannot update a Barangay B resident ──

test('user A cannot update Barangay B resident', function () {
    $response = $this->putJson(
        "/api/v1/residents/{$this->residentB->id}",
        ['first_name' => 'Hacked'],
        $this->headersA,
    );

    $response->assertNotFound();

    // Verify data was not changed
    $this->residentB->refresh();
    expect($this->residentB->first_name)->toBe('Secret');
});

// ── DELETE: User A cannot delete a Barangay B resident ──

test('user A cannot delete Barangay B resident', function () {
    $response = $this->deleteJson(
        "/api/v1/residents/{$this->residentB->id}",
        [],
        $this->headersA,
    );

    $response->assertNotFound();

    // Verify resident still exists
    expect(Resident::find($this->residentB->id))->not->toBeNull();
});

// ── SEARCH: User A search cannot find Barangay B residents ──

test('user A search does not return Barangay B residents', function () {
    $response = $this->getJson(
        '/api/v1/residents?search=Secret',
        $this->headersA,
    );

    $response->assertOk();
    expect($response->json('total'))->toBe(0);
});

// ── CREATE: Resident created by User A belongs to Barangay A ──

test('resident created by User A is scoped to Barangay A', function () {
    $response = $this->postJson('/api/v1/residents', [
        'first_name' => 'New',
        'last_name' => 'Resident',
        'date_of_birth' => '1990-01-15',
        'sex' => 'male',
        'place_of_birth' => 'Olongapo City',
        'civil_status' => 'single',
        'resident_type' => 'permanent',
    ], $this->headersA);

    $response->assertCreated();

    $residentId = $response->json('resident.id');
    $resident = Resident::find($residentId);

    expect($resident->barangay_id)->toBe($this->barangayA->id);
    expect($resident->barangay_id)->not->toBe($this->barangayB->id);
});

// ── ACTIVITY: User A cannot see Barangay B resident activity ──

test('user A cannot access Barangay B resident activity', function () {
    $response = $this->getJson(
        "/api/v1/residents/{$this->residentB->id}/activity",
        $this->headersA,
    );

    $response->assertNotFound();
});

// ── CROSS-CHECK: Each barangay sees only its own data ──

test('each barangay sees only its own residents in parallel', function () {
    Resident::factory()->count(3)->create(['barangay_id' => $this->barangayA->id]);
    Resident::factory()->count(7)->create(['barangay_id' => $this->barangayB->id]);

    $responseA = $this->getJson('/api/v1/residents', $this->headersA);
    $responseB = $this->getJson('/api/v1/residents', $this->headersB);

    $responseA->assertOk();
    $responseB->assertOk();

    // A sees 3, B sees 7 + 1 (from beforeEach)
    expect($responseA->json('total'))->toBe(3);
    expect($responseB->json('total'))->toBe(8);
});

// ── UUID Guessing: Random UUID returns 404, not 403 ──

test('accessing nonexistent resident returns 404 not 403', function () {
    $fakeId = '00000000-0000-0000-0000-000000000000';

    $response = $this->getJson("/api/v1/residents/{$fakeId}", $this->headersA);

    // Must be 404 — never 403 (which would confirm the resource exists)
    $response->assertNotFound();
});
