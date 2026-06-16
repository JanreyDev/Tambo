<?php

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\Tenant\Judicial\BlotterRecord;
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

// ── Dashboard Stats (GET /dashboard/stats) ──

test('dashboard stats returns correct structure', function () {
    Resident::factory()->count(5)->create(['barangay_id' => $this->barangay->id]);

    $response = $this->getJson('/api/v1/dashboard/stats', $this->headers);

    $response->assertOk()
        ->assertJsonStructure([
            'total_residents',
            'total_households',
            'total_establishments',
            'total_lots_buildings',
            'total_documents_issued',
            'total_blotters',
            'total_kp_cases',
            'pending_blotters',
            'active_kp_cases',
            'gender_distribution',
            'recent_registrations',
            'documents_this_month',
            'voter_count',
            'pwd_count',
            'senior_citizen_count',
            'active_count',
            'deceased_count',
            'transferred_count',
            'archived_count',
        ]);
})->skip(
    fn () => config('database.default') !== 'pgsql',
    'Dashboard stats uses PostgreSQL-specific EXTRACT(YEAR FROM AGE()) for age_groups'
);

test('dashboard stats returns correct resident count', function () {
    Resident::factory()->count(7)->create(['barangay_id' => $this->barangay->id]);

    $response = $this->getJson('/api/v1/dashboard/stats', $this->headers);

    $response->assertOk();
    expect($response->json('total_residents'))->toBe(7);
    expect($response->json('active_count'))->toBe(7);
})->skip(
    fn () => config('database.default') !== 'pgsql',
    'Dashboard stats uses PostgreSQL-specific EXTRACT(YEAR FROM AGE())'
);

test('dashboard stats counts blotters correctly', function () {
    BlotterRecord::factory()->count(3)->create(['barangay_id' => $this->barangay->id]);
    BlotterRecord::factory()->create([
        'barangay_id' => $this->barangay->id,
        'status' => 'filed',
    ]);

    $response = $this->getJson('/api/v1/dashboard/stats', $this->headers);

    $response->assertOk();
    expect($response->json('total_blotters'))->toBe(4);
})->skip(
    fn () => config('database.default') !== 'pgsql',
    'Dashboard stats uses PostgreSQL-specific EXTRACT(YEAR FROM AGE())'
);

test('dashboard stats requires authentication', function () {
    $response = $this->getJson('/api/v1/dashboard/stats');

    $response->assertUnauthorized();
});

test('dashboard stats is scoped to authenticated user barangay', function () {
    $otherBarangay = Barangay::factory()->create();

    Resident::factory()->count(3)->create(['barangay_id' => $this->barangay->id]);
    Resident::factory()->count(10)->create(['barangay_id' => $otherBarangay->id]);

    $response = $this->getJson('/api/v1/dashboard/stats', $this->headers);

    $response->assertOk();
    expect($response->json('total_residents'))->toBe(3);
})->skip(
    fn () => config('database.default') !== 'pgsql',
    'Dashboard stats uses PostgreSQL-specific EXTRACT(YEAR FROM AGE())'
);

test('dashboard stats counts deceased residents separately', function () {
    Resident::factory()->count(4)->create(['barangay_id' => $this->barangay->id]);
    Resident::factory()->deceased()->count(2)->create(['barangay_id' => $this->barangay->id]);

    $response = $this->getJson('/api/v1/dashboard/stats', $this->headers);

    $response->assertOk();
    expect($response->json('total_residents'))->toBe(6);
    expect($response->json('active_count'))->toBe(4);
    expect($response->json('deceased_count'))->toBe(2);
})->skip(
    fn () => config('database.default') !== 'pgsql',
    'Dashboard stats uses PostgreSQL-specific EXTRACT(YEAR FROM AGE())'
);

// ── Dashboard Activity (GET /dashboard/activity) ──

test('dashboard activity returns correct structure', function () {
    $response = $this->getJson('/api/v1/dashboard/activity', $this->headers);

    $response->assertOk()
        ->assertJsonStructure(['activity']);
});

test('dashboard activity requires authentication', function () {
    $response = $this->getJson('/api/v1/dashboard/activity');

    $response->assertUnauthorized();
});

// ── Dashboard Sign-ins (GET /dashboard/sign-ins) ──

test('dashboard sign-ins returns correct structure', function () {
    $response = $this->getJson('/api/v1/dashboard/sign-ins', $this->headers);

    $response->assertOk()
        ->assertJsonStructure(['sign_ins']);
});

test('dashboard sign-ins requires authentication', function () {
    $response = $this->getJson('/api/v1/dashboard/sign-ins');

    $response->assertUnauthorized();
});

// ── Dashboard Credits (GET /dashboard/credits) ──

test('dashboard credits returns correct structure', function () {
    $response = $this->getJson('/api/v1/dashboard/credits', $this->headers);

    $response->assertOk()
        ->assertJsonStructure([
            'credits' => [
                'sms' => ['balance', 'label'],
                'ai' => ['balance', 'label'],
                'call' => ['balance', 'label'],
                'map' => ['balance', 'label'],
            ],
            'storage' => [
                'used_bytes',
                'limit_bytes',
                'used_formatted',
                'limit_formatted',
                'percentage',
            ],
        ]);
});

test('dashboard credits returns barangay credit balances', function () {
    $response = $this->getJson('/api/v1/dashboard/credits', $this->headers);

    $response->assertOk();
    expect($response->json('credits.sms.balance'))->toEqual(100);
    expect($response->json('credits.ai.balance'))->toEqual(50);
});

test('dashboard credits requires authentication', function () {
    $response = $this->getJson('/api/v1/dashboard/credits');

    $response->assertUnauthorized();
});
