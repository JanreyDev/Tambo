<?php

declare(strict_types=1);

use App\Models\Admin\Barangay;
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

// ── List Residents (GET /residents) ──

test('can list residents for the current barangay', function () {
    Resident::factory()->count(3)->create(['barangay_id' => $this->barangay->id]);

    $response = $this->getJson('/api/v1/residents', $this->headers);

    $response->assertOk()
        ->assertJsonStructure([
            'data',
            'current_page',
            'total',
            'per_page',
        ]);

    expect($response->json('total'))->toBe(3);
});

test('list residents returns paginated results', function () {
    Resident::factory()->count(30)->create(['barangay_id' => $this->barangay->id]);

    $response = $this->getJson('/api/v1/residents?per_page=10', $this->headers);

    $response->assertOk();
    expect($response->json('per_page'))->toBe(10);
    expect(count($response->json('data')))->toBe(10);
    expect($response->json('total'))->toBe(30);
});

test('list residents defaults to 25 per page', function () {
    Resident::factory()->count(30)->create(['barangay_id' => $this->barangay->id]);

    $response = $this->getJson('/api/v1/residents', $this->headers);

    $response->assertOk();
    expect($response->json('per_page'))->toBe(25);
});

test('list residents caps per_page at 100', function () {
    Resident::factory()->count(5)->create(['barangay_id' => $this->barangay->id]);

    $response = $this->getJson('/api/v1/residents?per_page=200', $this->headers);

    $response->assertOk();
    expect($response->json('per_page'))->toBe(100);
});

test('list residents does not include residents from other barangays', function () {
    $otherBarangay = Barangay::factory()->create();
    Resident::factory()->count(2)->create(['barangay_id' => $this->barangay->id]);
    Resident::factory()->count(3)->create(['barangay_id' => $otherBarangay->id]);

    $response = $this->getJson('/api/v1/residents', $this->headers);

    $response->assertOk();
    expect($response->json('total'))->toBe(2);
});

test('can filter residents by status', function () {
    Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'status' => 'active',
    ]);
    Resident::factory()->deceased()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $response = $this->getJson('/api/v1/residents?status=active', $this->headers);

    $response->assertOk();
    expect($response->json('total'))->toBe(1);
});

test('can filter residents by purok', function () {
    Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'purok' => 'Purok 1',
    ]);
    Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'purok' => 'Purok 2',
    ]);

    $response = $this->getJson('/api/v1/residents?purok=Purok+1', $this->headers);

    $response->assertOk();
    expect($response->json('total'))->toBe(1);
});

test('can filter residents by sex', function () {
    Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'sex' => 'male',
    ]);
    Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'sex' => 'female',
    ]);

    $response = $this->getJson('/api/v1/residents?sex=female', $this->headers);

    $response->assertOk();
    expect($response->json('total'))->toBe(1);
});

test('can filter residents by voter status', function () {
    Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'is_voter' => true,
    ]);
    Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'is_voter' => false,
    ]);

    $response = $this->getJson('/api/v1/residents?is_voter=1', $this->headers);

    $response->assertOk();
    expect($response->json('total'))->toBe(1);
});

test('can sort residents by last name ascending', function () {
    Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'last_name' => 'Santos',
    ]);
    Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'last_name' => 'Cruz',
    ]);

    $response = $this->getJson('/api/v1/residents?sort_by=last_name&sort_dir=asc', $this->headers);

    $response->assertOk();
    $data = $response->json('data');
    expect($data[0]['last_name'])->toBe('Cruz');
    expect($data[1]['last_name'])->toBe('Santos');
});

test('can sort residents by last name descending', function () {
    Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'last_name' => 'Santos',
    ]);
    Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'last_name' => 'Cruz',
    ]);

    $response = $this->getJson('/api/v1/residents?sort_by=last_name&sort_dir=desc', $this->headers);

    $response->assertOk();
    $data = $response->json('data');
    expect($data[0]['last_name'])->toBe('Santos');
    expect($data[1]['last_name'])->toBe('Cruz');
});

test('search residents by name uses ilike', function () {
    Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'first_name' => 'UniqueTestName',
        'last_name' => 'SearchTest',
    ]);
    Resident::factory()->count(5)->create(['barangay_id' => $this->barangay->id]);

    $response = $this->getJson('/api/v1/residents?search=UniqueTestName', $this->headers);

    $response->assertOk();
    expect($response->json('total'))->toBe(1);
})->skip(
    fn () => config('database.default') !== 'pgsql',
    'Search uses ilike which is PostgreSQL-specific'
);

test('unauthenticated list residents returns 401', function () {
    $response = $this->getJson('/api/v1/residents');

    $response->assertUnauthorized();
});

// ── Create Resident (POST /residents) ──

test('can create a resident with required fields', function () {
    $response = $this->postJson('/api/v1/residents', [
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'date_of_birth' => '1990-01-15',
        'sex' => 'female',
        'place_of_birth' => 'Olongapo City, Zambales',
        'civil_status' => 'single',
        'resident_type' => 'permanent',
    ], $this->headers);

    $response->assertCreated()
        ->assertJsonPath('resident.first_name', 'Maria')
        ->assertJsonPath('resident.last_name', 'Santos')
        ->assertJsonPath('resident.sex', 'female')
        ->assertJsonPath('message', 'Resident registered successfully.');

    // Verify persisted in database
    $this->assertDatabaseHas('residents', [
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'barangay_id' => $this->barangay->id,
    ]);
});

test('can create a resident with all fields', function () {
    $response = $this->postJson('/api/v1/residents', [
        'first_name' => 'Juan',
        'last_name' => 'dela Cruz',
        'middle_name' => 'Manalo',
        'extension_name' => 'Jr',
        'date_of_birth' => '1985-06-20',
        'place_of_birth' => 'Olongapo City, Zambales',
        'sex' => 'male',
        'civil_status' => 'married',
        'resident_type' => 'permanent',
        'citizenship' => 'Filipino',
        'religion' => 'Catholic',
        'blood_type' => 'O+',
        'email' => 'juan@example.com',
        'mobile_number' => '09171234567',
        'purok' => 'Purok 3',
        'street' => 'Rizal Street',
        'house_block_lot' => 'Block 5, Lot 12',
        'is_voter' => true,
        'occupation' => 'Farmer',
        'highest_education' => 'College Graduate',
    ], $this->headers);

    $response->assertCreated()
        ->assertJsonPath('resident.first_name', 'Juan')
        ->assertJsonPath('resident.last_name', 'dela Cruz')
        ->assertJsonPath('resident.middle_name', 'Manalo')
        ->assertJsonPath('resident.extension_name', 'Jr');
});

test('create resident auto-generates resident number', function () {
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
    $psgc = $this->barangay->psgc_code;
    expect($response->json('resident.resident_number'))->toBe("RES-{$psgc}-0001");
});

test('create resident increments resident number', function () {
    $psgc = $this->barangay->psgc_code;
    Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'resident_number' => "RES-{$psgc}-0005",
    ]);

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
    expect($response->json('resident.resident_number'))->toBe("RES-{$psgc}-0006");
});

test('create resident sets registration date to today', function () {
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

    // registration_date is cast to 'date' so it serializes as ISO 8601
    $registrationDate = $response->json('resident.registration_date');
    expect($registrationDate)->toContain(now()->toDateString());
});

test('create resident sets status to active', function () {
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
    expect($response->json('resident.status'))->toBe('active');
});

test('create resident calculates profile completion', function () {
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
    expect($response->json('resident.profile_completion_pct'))->toBeGreaterThan(0);
});

test('create resident validates required fields', function () {
    $response = $this->postJson('/api/v1/residents', [], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['first_name', 'last_name', 'date_of_birth', 'sex', 'place_of_birth', 'civil_status', 'resident_type']);
});

test('create resident rejects invalid sex value', function () {
    $response = $this->postJson('/api/v1/residents', [
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'date_of_birth' => '1990-01-15',
        'sex' => 'invalid',
        'place_of_birth' => 'Olongapo City, Zambales',
        'civil_status' => 'single',
        'resident_type' => 'permanent',
    ], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['sex']);
});

test('create resident rejects future date of birth', function () {
    $response = $this->postJson('/api/v1/residents', [
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'date_of_birth' => now()->addDay()->toDateString(),
        'sex' => 'female',
        'place_of_birth' => 'Olongapo City, Zambales',
        'civil_status' => 'single',
        'resident_type' => 'permanent',
    ], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['date_of_birth']);
});

test('create resident rejects invalid email', function () {
    $response = $this->postJson('/api/v1/residents', [
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'date_of_birth' => '1990-01-15',
        'sex' => 'female',
        'place_of_birth' => 'Olongapo City, Zambales',
        'civil_status' => 'single',
        'resident_type' => 'permanent',
        'email' => 'not-an-email',
    ], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

test('create resident assigns to current user barangay', function () {
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
    $resident = Resident::find($residentId);
    expect($resident->barangay_id)->toBe($this->barangay->id);
});

// ── View Resident (GET /residents/{id}) ──

test('can view a resident from the same barangay', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'first_name' => 'Maria',
        'last_name' => 'Santos',
    ]);

    $response = $this->getJson("/api/v1/residents/{$resident->id}", $this->headers);

    $response->assertOk()
        ->assertJsonPath('resident.id', $resident->id)
        ->assertJsonPath('resident.first_name', 'Maria')
        ->assertJsonPath('resident.last_name', 'Santos');
});

test('cannot view a resident from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $resident = Resident::factory()->create([
        'barangay_id' => $otherBarangay->id,
    ]);

    $response = $this->getJson("/api/v1/residents/{$resident->id}", $this->headers);

    $response->assertNotFound();
});

test('view nonexistent resident returns 404', function () {
    $response = $this->getJson('/api/v1/residents/00000000-0000-0000-0000-000000000000', $this->headers);

    $response->assertNotFound();
});

// ── Update Resident (PUT /residents/{id}) ──

test('can update a resident first name', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'first_name' => 'Maria',
    ]);

    $response = $this->putJson("/api/v1/residents/{$resident->id}", [
        'first_name' => 'Updated',
    ], $this->headers);

    $response->assertOk()
        ->assertJsonPath('resident.first_name', 'Updated')
        ->assertJsonPath('message', 'Resident updated.');
});

test('can update multiple resident fields', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $response = $this->putJson("/api/v1/residents/{$resident->id}", [
        'first_name' => 'Jose',
        'last_name' => 'Rizal',
        'civil_status' => 'married',
        'occupation' => 'Writer',
    ], $this->headers);

    $response->assertOk()
        ->assertJsonPath('resident.first_name', 'Jose')
        ->assertJsonPath('resident.last_name', 'Rizal')
        ->assertJsonPath('resident.occupation', 'Writer');
});

test('can update resident status', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'status' => 'active',
    ]);

    $response = $this->putJson("/api/v1/residents/{$resident->id}", [
        'status' => 'deceased',
    ], $this->headers);

    $response->assertOk()
        ->assertJsonPath('resident.status', 'deceased');
});

test('update resident rejects invalid status', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $response = $this->putJson("/api/v1/residents/{$resident->id}", [
        'status' => 'invalid_status',
    ], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

test('cannot update a resident from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $resident = Resident::factory()->create([
        'barangay_id' => $otherBarangay->id,
    ]);

    $response = $this->putJson("/api/v1/residents/{$resident->id}", [
        'first_name' => 'Updated',
    ], $this->headers);

    $response->assertNotFound();
});

test('update recalculates profile completion', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'occupation' => null,
        'religion' => null,
    ]);

    // Get the real calculated value (not the factory-generated random value)
    $originalPct = $resident->calculateProfileCompletion();

    $response = $this->putJson("/api/v1/residents/{$resident->id}", [
        'occupation' => 'Farmer',
        'religion' => 'Catholic',
    ], $this->headers);

    $response->assertOk();

    $updatedPct = $response->json('resident.profile_completion_pct');
    expect($updatedPct)->toBeGreaterThan($originalPct);
});

// ── Delete Resident (DELETE /residents/{id}) ──

test('can soft delete a resident', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $response = $this->deleteJson("/api/v1/residents/{$resident->id}", [], $this->headers);

    $response->assertOk()
        ->assertJsonPath('message', 'Resident deleted.');

    // Verify soft deleted
    $this->assertSoftDeleted('residents', ['id' => $resident->id]);
});

test('soft deleted resident does not appear in listing', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->deleteJson("/api/v1/residents/{$resident->id}", [], $this->headers);

    $response = $this->getJson('/api/v1/residents', $this->headers);
    expect($response->json('total'))->toBe(0);
});

test('cannot delete a resident from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $resident = Resident::factory()->create([
        'barangay_id' => $otherBarangay->id,
    ]);

    $response = $this->deleteJson("/api/v1/residents/{$resident->id}", [], $this->headers);

    $response->assertNotFound();
});

test('delete nonexistent resident returns 404', function () {
    $response = $this->deleteJson(
        '/api/v1/residents/00000000-0000-0000-0000-000000000000',
        [],
        $this->headers
    );

    $response->assertNotFound();
});

// ── Tenant Isolation ──

test('residents are scoped to authenticated user barangay', function () {
    $myBarangay = $this->barangay;
    $otherBarangay = Barangay::factory()->create();

    Resident::factory()->count(3)->create(['barangay_id' => $myBarangay->id]);
    Resident::factory()->count(5)->create(['barangay_id' => $otherBarangay->id]);

    $response = $this->getJson('/api/v1/residents', $this->headers);

    $response->assertOk();
    expect($response->json('total'))->toBe(3);

    // Verify all returned residents belong to the same barangay
    $data = $response->json('data');
    foreach ($data as $resident) {
        expect($resident['barangay_id'])->toBe($myBarangay->id);
    }
});
