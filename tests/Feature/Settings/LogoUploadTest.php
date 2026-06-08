<?php

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\Admin\File;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Fake the public disk so uploads go to a sandbox, not actual storage
    Storage::fake('public');

    // Clear rate-limit cache between tests so throttle:10,1 doesn't leak across tests
    Cache::flush();

    // Ensure the roles this test needs exist (idempotent — won't clash with migrations).
    // We avoid RolePermissionSeeder because its Permission::create calls conflict with the
    // vawc.delete migration which already creates the permission via firstOrCreate.
    foreach (['kapitan', 'secretary', 'kagawad', 'treasurer'] as $roleName) {
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
// Happy path
// ──────────────────────────────────────────────────────────────

test('kapitan can upload PNG barangay logo', function () {
    $file = UploadedFile::fake()->image('logo.png', 512, 512);

    $response = $this->postJson('/api/v1/settings/logo', ['file' => $file], $this->headers);

    $response->assertOk()
        ->assertJsonStructure(['message', 'url', 'file_id']);

    $this->barangay->refresh();
    expect($this->barangay->logo_url)->not->toBeNull();
});

test('kapitan can upload JPG barangay logo', function () {
    $file = UploadedFile::fake()->image('logo.jpg', 800, 800);

    $response = $this->postJson('/api/v1/settings/logo', ['file' => $file], $this->headers);

    $response->assertOk();
});

test('secretary can also upload logo', function () {
    $this->user->syncRoles([]);
    $this->user->assignRole('secretary');

    $file = UploadedFile::fake()->image('logo.png', 512, 512);

    $response = $this->postJson('/api/v1/settings/logo', ['file' => $file], $this->headers);

    $response->assertOk();
});

// ──────────────────────────────────────────────────────────────
// Authorization — role rejection
// ──────────────────────────────────────────────────────────────

test('kagawad without kapitan or secretary role cannot upload logo', function () {
    $this->user->syncRoles([]);
    $this->user->assignRole('kagawad');

    $file = UploadedFile::fake()->image('logo.png', 512, 512);

    $response = $this->postJson('/api/v1/settings/logo', ['file' => $file], $this->headers);

    $response->assertStatus(403);
});

test('treasurer without kapitan or secretary role cannot upload logo', function () {
    $this->user->syncRoles([]);
    $this->user->assignRole('treasurer');

    $file = UploadedFile::fake()->image('logo.png', 512, 512);

    $response = $this->postJson('/api/v1/settings/logo', ['file' => $file], $this->headers);

    $response->assertStatus(403);
});

// ──────────────────────────────────────────────────────────────
// Authentication
// ──────────────────────────────────────────────────────────────

test('unauthenticated upload returns 401', function () {
    $file = UploadedFile::fake()->image('logo.png', 512, 512);

    $response = $this->postJson('/api/v1/settings/logo', ['file' => $file]);

    $response->assertStatus(401);
});

// ──────────────────────────────────────────────────────────────
// MIME rejection — only PNG/JPG accepted
// ──────────────────────────────────────────────────────────────

test('SVG upload is rejected with 422', function () {
    $file = UploadedFile::fake()->create('logo.svg', 50, 'image/svg+xml');

    $response = $this->postJson('/api/v1/settings/logo', ['file' => $file], $this->headers);

    $response->assertStatus(422);
});

test('WebP upload is rejected with 422', function () {
    $file = UploadedFile::fake()->create('logo.webp', 50, 'image/webp');

    $response = $this->postJson('/api/v1/settings/logo', ['file' => $file], $this->headers);

    $response->assertStatus(422);
});

test('PDF disguised as image is rejected with 422', function () {
    $file = UploadedFile::fake()->create('logo.pdf', 50, 'application/pdf');

    $response = $this->postJson('/api/v1/settings/logo', ['file' => $file], $this->headers);

    $response->assertStatus(422);
});

test('GIF upload is rejected with 422', function () {
    $file = UploadedFile::fake()->create('logo.gif', 50, 'image/gif');

    $response = $this->postJson('/api/v1/settings/logo', ['file' => $file], $this->headers);

    $response->assertStatus(422);
});

// ──────────────────────────────────────────────────────────────
// Size cap — 5MB
// ──────────────────────────────────────────────────────────────

test('upload larger than 5MB is rejected with 422', function () {
    // size() in kilobytes — 6000KB = ~6MB
    $file = UploadedFile::fake()->image('big.png', 512, 512)->size(6000);

    $response = $this->postJson('/api/v1/settings/logo', ['file' => $file], $this->headers);

    $response->assertStatus(422);
});

// ──────────────────────────────────────────────────────────────
// Tenant isolation
// ──────────────────────────────────────────────────────────────

test('uploaded file is stored under the users own barangay path', function () {
    $file = UploadedFile::fake()->image('logo.png', 512, 512);

    $this->postJson('/api/v1/settings/logo', ['file' => $file], $this->headers)->assertOk();

    $stored = File::where('barangay_id', $this->barangay->id)
        ->where('category', 'logo')
        ->first();

    expect($stored)->not->toBeNull();
    expect($stored->storage_path)->toStartWith("bcmp/{$this->barangay->id}/logos/");
});

test('user from one barangay cannot affect another barangays logo_url', function () {
    $otherBarangay = Barangay::factory()->create();
    $otherInitialLogo = $otherBarangay->logo_url;

    $file = UploadedFile::fake()->image('logo.png', 512, 512);
    $this->postJson('/api/v1/settings/logo', ['file' => $file], $this->headers)->assertOk();

    $otherBarangay->refresh();
    expect($otherBarangay->logo_url)->toBe($otherInitialLogo); // unchanged
});

// ──────────────────────────────────────────────────────────────
// Old-file cleanup on replace
// ──────────────────────────────────────────────────────────────

test('uploading a replacement logo deletes the previous file record', function () {
    // First upload
    $first = UploadedFile::fake()->image('first.png', 512, 512);
    $this->postJson('/api/v1/settings/logo', ['file' => $first], $this->headers)->assertOk();

    $firstFile = File::where('barangay_id', $this->barangay->id)
        ->where('category', 'logo')
        ->first();
    expect($firstFile)->not->toBeNull();
    $firstFileId = $firstFile->id;

    // Replacement upload
    $second = UploadedFile::fake()->image('second.png', 512, 512);
    $this->postJson('/api/v1/settings/logo', ['file' => $second], $this->headers)->assertOk();

    // Old file record should be force-deleted by uploadService->delete()
    expect(File::find($firstFileId))->toBeNull();

    // The new file should exist and be the current logo
    $currentFile = File::where('barangay_id', $this->barangay->id)
        ->where('category', 'logo')
        ->first();
    expect($currentFile)->not->toBeNull();
    expect($currentFile->id)->not->toBe($firstFileId);
});

// ──────────────────────────────────────────────────────────────
// Sibling endpoints — wired + authenticated + persist correct column
// ──────────────────────────────────────────────────────────────

test('seal endpoint is wired and persists to seal_url column', function () {
    $file = UploadedFile::fake()->image('seal.png', 512, 512);

    $response = $this->postJson('/api/v1/settings/seal', ['file' => $file], $this->headers);

    $response->assertOk();
    $this->barangay->refresh();
    expect($this->barangay->seal_url)->not->toBeNull();
});

test('municipality logo endpoint is wired and persists to municipality_logo_url column', function () {
    $file = UploadedFile::fake()->image('city.png', 512, 512);

    $response = $this->postJson('/api/v1/settings/municipality-logo', ['file' => $file], $this->headers);

    $response->assertOk();
    $this->barangay->refresh();
    expect($this->barangay->municipality_logo_url)->not->toBeNull();
});

// ──────────────────────────────────────────────────────────────
// Rate limit — 10 uploads/min/IP
// ──────────────────────────────────────────────────────────────

test('upload endpoint rate limits at 10 per minute', function () {
    for ($i = 1; $i <= 10; $i++) {
        $file = UploadedFile::fake()->image("logo{$i}.png", 256, 256);
        $this->postJson('/api/v1/settings/logo', ['file' => $file], $this->headers)
            ->assertOk();
    }

    $eleventh = UploadedFile::fake()->image('over.png', 256, 256);
    $this->postJson('/api/v1/settings/logo', ['file' => $eleventh], $this->headers)
        ->assertStatus(429);
});
