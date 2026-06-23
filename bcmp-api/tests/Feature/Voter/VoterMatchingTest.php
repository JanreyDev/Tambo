<?php

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\User;
use App\Models\Tenant\Resident;
use App\Models\Tenant\Voter;
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

test('can retrieve unmatched voters list', function () {
    // Create an unmatched voter
    $unmatched = Voter::create([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'barangay_id' => $this->barangay->id,
        'last_name' => 'Cruz',
        'first_name' => 'Juan',
        'full_name' => 'Cruz, Juan',
        'precinct_number' => '100A',
        'address' => 'Purok 1',
        'resident_id' => null,
        'imported_at' => now(),
    ]);

    // Create a matched voter
    $resident = Resident::factory()->create(['barangay_id' => $this->barangay->id]);
    $matched = Voter::create([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'barangay_id' => $this->barangay->id,
        'last_name' => 'Santos',
        'first_name' => 'Maria',
        'full_name' => 'Santos, Maria',
        'precinct_number' => '100A',
        'address' => 'Purok 2',
        'resident_id' => $resident->id,
        'imported_at' => now(),
    ]);

    $response = $this->getJson('/api/v1/voters?unmatched=true', $this->headers);

    $response->assertStatus(200);
    $response->assertJsonFragment(['id' => $unmatched->id]);
    $response->assertJsonMissing(['id' => $matched->id]);
});

test('returns close resident match suggestions', function () {
    $voter = Voter::create([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'barangay_id' => $this->barangay->id,
        'last_name' => 'Delacruz',
        'first_name' => 'Juanito',
        'full_name' => 'Delacruz, Juanito',
        'precinct_number' => '100A',
        'address' => 'Purok 1',
        'imported_at' => now(),
    ]);

    // Candidate resident with similar last name
    $candidate = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'last_name' => 'Dela Cruz',
        'first_name' => 'Juan',
    ]);

    $response = $this->getJson("/api/v1/voters/{$voter->id}/suggestions", $this->headers);

    $response->assertStatus(200);
    $response->assertJsonFragment(['id' => $candidate->id]);
});

test('can manually link voter to resident', function () {
    $voter = Voter::create([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'barangay_id' => $this->barangay->id,
        'last_name' => 'Cruz',
        'first_name' => 'Juan',
        'full_name' => 'Cruz, Juan',
        'precinct_number' => '200B',
        'address' => 'Purok 1',
        'imported_at' => now(),
    ]);

    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'is_voter' => false,
        'voter_precinct_number' => null,
    ]);

    $response = $this->postJson("/api/v1/voters/{$voter->id}/link", [
        'resident_id' => $resident->id,
    ], $this->headers);

    $response->assertStatus(200);
    
    // Assert voter record updated
    $this->assertDatabaseHas('voters', [
        'id' => $voter->id,
        'resident_id' => $resident->id,
    ]);

    // Assert resident record updated
    $this->assertDatabaseHas('residents', [
        'id' => $resident->id,
        'is_voter' => true,
        'voter_precinct_number' => '200B',
    ]);
});

test('can manually unlink voter from resident', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'is_voter' => true,
        'voter_precinct_number' => '200B',
    ]);

    $voter = Voter::create([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'barangay_id' => $this->barangay->id,
        'last_name' => 'Cruz',
        'first_name' => 'Juan',
        'full_name' => 'Cruz, Juan',
        'precinct_number' => '200B',
        'address' => 'Purok 1',
        'resident_id' => $resident->id,
        'imported_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/voters/{$voter->id}/unlink", [], $this->headers);

    $response->assertStatus(200);
    
    // Assert voter record updated
    $this->assertDatabaseHas('voters', [
        'id' => $voter->id,
        'resident_id' => null,
    ]);

    // Assert resident record updated
    $this->assertDatabaseHas('residents', [
        'id' => $resident->id,
        'is_voter' => false,
        'voter_precinct_number' => null,
    ]);
});
