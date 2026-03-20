<?php

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\Tenant\Judicial\BlotterRecord;
use App\Models\User;

beforeEach(function () {
    $this->barangay = Barangay::factory()->create();
    $this->user = User::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);
    $this->token = $this->user->createToken('test')->plainTextToken;
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
});

// ── List Blotters (GET /blotters) ──

test('can list blotters for the current barangay', function () {
    BlotterRecord::factory()->count(3)->create(['barangay_id' => $this->barangay->id]);

    $response = $this->getJson('/api/v1/blotters', $this->headers);

    $response->assertOk()
        ->assertJsonStructure([
            'data',
            'current_page',
            'total',
            'per_page',
        ]);

    expect($response->json('total'))->toBe(3);
});

test('list blotters returns paginated results', function () {
    BlotterRecord::factory()->count(30)->create(['barangay_id' => $this->barangay->id]);

    $response = $this->getJson('/api/v1/blotters?per_page=10', $this->headers);

    $response->assertOk();
    expect($response->json('per_page'))->toBe(10);
    expect(count($response->json('data')))->toBe(10);
    expect($response->json('total'))->toBe(30);
});

test('list blotters defaults to 25 per page', function () {
    BlotterRecord::factory()->count(30)->create(['barangay_id' => $this->barangay->id]);

    $response = $this->getJson('/api/v1/blotters', $this->headers);

    $response->assertOk();
    expect($response->json('per_page'))->toBe(25);
});

test('list blotters caps per_page at 100', function () {
    BlotterRecord::factory()->count(5)->create(['barangay_id' => $this->barangay->id]);

    $response = $this->getJson('/api/v1/blotters?per_page=200', $this->headers);

    $response->assertOk();
    expect($response->json('per_page'))->toBe(100);
});

test('list blotters requires authentication', function () {
    $response = $this->getJson('/api/v1/blotters');

    $response->assertUnauthorized();
});

test('can filter blotters by status', function () {
    BlotterRecord::factory()->count(2)->create([
        'barangay_id' => $this->barangay->id,
        'status' => 'filed',
    ]);
    BlotterRecord::factory()->settled()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $response = $this->getJson('/api/v1/blotters?status=filed', $this->headers);

    $response->assertOk();
    expect($response->json('total'))->toBe(2);
});

// ── Create Blotter (POST /blotters) ──

test('can create a blotter with required fields', function () {
    $response = $this->postJson('/api/v1/blotters', [
        'incident_type' => 'Physical Injury',
        'narrative' => 'The respondent punched the complainant during a disagreement.',
        'complainant_name' => 'Maria Santos',
        'respondent_name' => 'Juan Cruz',
    ], $this->headers);

    $response->assertCreated()
        ->assertJsonPath('message', 'Blotter record created.')
        ->assertJsonPath('blotter.incident_type', 'Physical Injury')
        ->assertJsonPath('blotter.complainant_name', 'Maria Santos')
        ->assertJsonPath('blotter.respondent_name', 'Juan Cruz')
        ->assertJsonPath('blotter.status', 'filed');

    $this->assertDatabaseHas('blotter_records', [
        'incident_type' => 'Physical Injury',
        'complainant_name' => 'Maria Santos',
        'barangay_id' => $this->barangay->id,
    ]);
})->skip(
    fn () => config('database.default') !== 'pgsql',
    'Blotter number generation uses PostgreSQL ilike + SUBSTRING regex'
);

test('create blotter auto-generates blotter number', function () {
    $response = $this->postJson('/api/v1/blotters', [
        'incident_type' => 'Theft',
        'narrative' => 'Missing belongings reported.',
        'complainant_name' => 'Ana Reyes',
        'respondent_name' => 'Pedro Garcia',
    ], $this->headers);

    $response->assertCreated();
    $year = now()->format('Y');
    expect($response->json('blotter.blotter_number'))->toStartWith("BLT-{$year}-");
})->skip(
    fn () => config('database.default') !== 'pgsql',
    'Blotter number generation uses PostgreSQL ilike + SUBSTRING regex'
);

test('create blotter sets filing date to today', function () {
    $response = $this->postJson('/api/v1/blotters', [
        'incident_type' => 'Trespassing',
        'narrative' => 'Unauthorized entry to property.',
        'complainant_name' => 'Jose Manalo',
        'respondent_name' => 'Luis Torres',
    ], $this->headers);

    $response->assertCreated();
    $filingDate = $response->json('blotter.filing_date');
    expect($filingDate)->toContain(now()->toDateString());
})->skip(
    fn () => config('database.default') !== 'pgsql',
    'Blotter number generation uses PostgreSQL ilike + SUBSTRING regex'
);

test('create blotter validates required fields', function () {
    $response = $this->postJson('/api/v1/blotters', [], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['incident_type', 'narrative', 'complainant_name', 'respondent_name']);
});

test('create blotter rejects invalid status', function () {
    $response = $this->postJson('/api/v1/blotters', [
        'incident_type' => 'Theft',
        'narrative' => 'Test narrative.',
        'complainant_name' => 'Ana Reyes',
        'respondent_name' => 'Pedro Garcia',
        'status' => 'invalid_status',
    ], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

test('create blotter assigns to current user barangay', function () {
    $response = $this->postJson('/api/v1/blotters', [
        'incident_type' => 'Noise Complaint',
        'narrative' => 'Excessive noise from karaoke.',
        'complainant_name' => 'Elena Cruz',
        'respondent_name' => 'Ramon Santos',
    ], $this->headers);

    $response->assertCreated();
    $blotterId = $response->json('blotter.id');
    $blotter = BlotterRecord::find($blotterId);
    expect($blotter->barangay_id)->toBe($this->barangay->id);
})->skip(
    fn () => config('database.default') !== 'pgsql',
    'Blotter number generation uses PostgreSQL ilike + SUBSTRING regex'
);

test('create blotter requires authentication', function () {
    $response = $this->postJson('/api/v1/blotters', [
        'incident_type' => 'Theft',
        'narrative' => 'Missing items.',
        'complainant_name' => 'Test',
        'respondent_name' => 'Test',
    ]);

    $response->assertUnauthorized();
});

// ── View Blotter (GET /blotters/{id}) ──

test('can view a blotter from the same barangay', function () {
    $blotter = BlotterRecord::factory()->create([
        'barangay_id' => $this->barangay->id,
        'incident_type' => 'Verbal Abuse',
    ]);

    $response = $this->getJson("/api/v1/blotters/{$blotter->id}", $this->headers);

    $response->assertOk()
        ->assertJsonPath('blotter.id', $blotter->id)
        ->assertJsonPath('blotter.incident_type', 'Verbal Abuse');
});

test('cannot view a blotter from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $blotter = BlotterRecord::factory()->create([
        'barangay_id' => $otherBarangay->id,
    ]);

    $response = $this->getJson("/api/v1/blotters/{$blotter->id}", $this->headers);

    $response->assertNotFound();
});

test('view nonexistent blotter returns 404', function () {
    $response = $this->getJson('/api/v1/blotters/00000000-0000-0000-0000-000000000000', $this->headers);

    $response->assertNotFound();
});

// ── Update Blotter (PUT /blotters/{id}) ──

test('can update a blotter status', function () {
    $blotter = BlotterRecord::factory()->create([
        'barangay_id' => $this->barangay->id,
        'status' => 'filed',
    ]);

    $response = $this->putJson("/api/v1/blotters/{$blotter->id}", [
        'status' => 'for_hearing',
    ], $this->headers);

    $response->assertOk()
        ->assertJsonPath('message', 'Blotter record updated.')
        ->assertJsonPath('blotter.status', 'for_hearing');
});

test('can update blotter narrative', function () {
    $blotter = BlotterRecord::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $response = $this->putJson("/api/v1/blotters/{$blotter->id}", [
        'narrative' => 'Updated narrative with more details.',
    ], $this->headers);

    $response->assertOk()
        ->assertJsonPath('blotter.narrative', 'Updated narrative with more details.');
});

test('cannot update a blotter from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $blotter = BlotterRecord::factory()->create([
        'barangay_id' => $otherBarangay->id,
    ]);

    $response = $this->putJson("/api/v1/blotters/{$blotter->id}", [
        'status' => 'settled',
    ], $this->headers);

    $response->assertNotFound();
});

test('update blotter rejects invalid status', function () {
    $blotter = BlotterRecord::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $response = $this->putJson("/api/v1/blotters/{$blotter->id}", [
        'status' => 'bogus',
    ], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

// ── Delete Blotter (DELETE /blotters/{id}) ──

test('can soft delete a blotter', function () {
    $blotter = BlotterRecord::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $response = $this->deleteJson("/api/v1/blotters/{$blotter->id}", [], $this->headers);

    $response->assertOk()
        ->assertJsonPath('message', 'Blotter record deleted.');

    $this->assertSoftDeleted('blotter_records', ['id' => $blotter->id]);
});

test('soft deleted blotter does not appear in listing', function () {
    $blotter = BlotterRecord::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->deleteJson("/api/v1/blotters/{$blotter->id}", [], $this->headers);

    $response = $this->getJson('/api/v1/blotters', $this->headers);
    expect($response->json('total'))->toBe(0);
});

test('cannot delete a blotter from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $blotter = BlotterRecord::factory()->create([
        'barangay_id' => $otherBarangay->id,
    ]);

    $response = $this->deleteJson("/api/v1/blotters/{$blotter->id}", [], $this->headers);

    $response->assertNotFound();
});

// ── Tenant Isolation ──

test('blotters are scoped to authenticated user barangay', function () {
    $otherBarangay = Barangay::factory()->create();

    BlotterRecord::factory()->count(2)->create(['barangay_id' => $this->barangay->id]);
    BlotterRecord::factory()->count(5)->create(['barangay_id' => $otherBarangay->id]);

    $response = $this->getJson('/api/v1/blotters', $this->headers);

    $response->assertOk();
    expect($response->json('total'))->toBe(2);

    $data = $response->json('data');
    foreach ($data as $blotter) {
        expect($blotter['barangay_id'])->toBe($this->barangay->id);
    }
});

// ── Blotter Stats (GET /blotters/stats) ──

test('blotter stats returns correct structure', function () {
    BlotterRecord::factory()->count(2)->create([
        'barangay_id' => $this->barangay->id,
        'status' => 'filed',
    ]);
    BlotterRecord::factory()->settled()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $response = $this->getJson('/api/v1/blotters/stats', $this->headers);

    $response->assertOk()
        ->assertJsonStructure([
            'total',
            'filed',
            'for_hearing',
            'for_subpoena',
            'settled',
            'closed',
            'active',
            'this_month',
        ]);

    expect($response->json('total'))->toBe(3);
    expect($response->json('filed'))->toBe(2);
    expect($response->json('settled'))->toBe(1);
});

test('blotter stats requires authentication', function () {
    $response = $this->getJson('/api/v1/blotters/stats');

    $response->assertUnauthorized();
});
