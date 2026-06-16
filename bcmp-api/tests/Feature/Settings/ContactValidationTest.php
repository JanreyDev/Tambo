<?php

declare(strict_types=1);

use App\Models\Admin\Barangay;
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
// Contact phone / email / website (top-level columns)
// ──────────────────────────────────────────────────────────────

test('email format is validated server-side', function () {
    $response = $this->patchJson('/api/v1/settings', [
        'contact_email' => 'not-an-email',
    ], $this->headers);

    $response->assertStatus(422)->assertJsonValidationErrors(['contact_email']);
});

test('website must be a valid URL', function () {
    $response = $this->patchJson('/api/v1/settings', [
        'website_url' => 'just-a-string',
    ], $this->headers);

    $response->assertStatus(422)->assertJsonValidationErrors(['website_url']);
});

// ──────────────────────────────────────────────────────────────
// Latitude/longitude — Philippine bounds
// ──────────────────────────────────────────────────────────────

test('latitude outside Philippine bounds is rejected', function () {
    $response = $this->patchJson('/api/v1/settings', [
        'latitude' => 99.0,
    ], $this->headers);

    $response->assertStatus(422)->assertJsonValidationErrors(['latitude']);
});

test('longitude outside Philippine bounds is rejected', function () {
    $response = $this->patchJson('/api/v1/settings', [
        'longitude' => 50.0,
    ], $this->headers);

    $response->assertStatus(422)->assertJsonValidationErrors(['longitude']);
});

test('valid Philippine coordinates are accepted', function () {
    $response = $this->patchJson('/api/v1/settings', [
        'latitude' => 14.4793,
        'longitude' => 121.0198,
    ], $this->headers);

    $response->assertOk();
});

// ──────────────────────────────────────────────────────────────
// settings.contact.* sub-fields
// ──────────────────────────────────────────────────────────────

test('mobile number must match PH format 09XXXXXXXXX', function () {
    $response = $this->patchJson('/api/v1/settings', [
        'settings' => ['contact' => ['mobile_number' => '12345']],
    ], $this->headers);

    $response->assertStatus(422)->assertJsonValidationErrors(['settings.contact.mobile_number']);
});

test('valid PH mobile number is accepted', function () {
    $response = $this->patchJson('/api/v1/settings', [
        'settings' => ['contact' => ['mobile_number' => '09171234567']],
    ], $this->headers);

    $response->assertOk();
});

test('facebook URL must be facebook.com or fb.com domain', function () {
    $response = $this->patchJson('/api/v1/settings', [
        'settings' => ['contact' => ['facebook_url' => 'https://twitter.com/foo']],
    ], $this->headers);

    $response->assertStatus(422)->assertJsonValidationErrors(['settings.contact.facebook_url']);
});

test('facebook URL must be https not http', function () {
    $response = $this->patchJson('/api/v1/settings', [
        'settings' => ['contact' => ['facebook_url' => 'http://facebook.com/brgytambo']],
    ], $this->headers);

    $response->assertStatus(422)->assertJsonValidationErrors(['settings.contact.facebook_url']);
});

test('valid facebook URL is accepted', function () {
    $response = $this->patchJson('/api/v1/settings', [
        'settings' => ['contact' => ['facebook_url' => 'https://facebook.com/brgytambo']],
    ], $this->headers);

    $response->assertOk();
});

test('YouTube URL must be youtube.com', function () {
    $response = $this->patchJson('/api/v1/settings', [
        'settings' => ['contact' => ['youtube_url' => 'https://vimeo.com/foo']],
    ], $this->headers);

    $response->assertStatus(422)->assertJsonValidationErrors(['settings.contact.youtube_url']);
});

test('Twitter URL accepts both twitter.com and x.com', function () {
    $r1 = $this->patchJson('/api/v1/settings', [
        'settings' => ['contact' => ['twitter_url' => 'https://twitter.com/brgytambo']],
    ], $this->headers);
    $r1->assertOk();

    $r2 = $this->patchJson('/api/v1/settings', [
        'settings' => ['contact' => ['twitter_url' => 'https://x.com/brgytambo']],
    ], $this->headers);
    $r2->assertOk();
});

test('Instagram URL must be instagram.com', function () {
    $response = $this->patchJson('/api/v1/settings', [
        'settings' => ['contact' => ['instagram_url' => 'https://tiktok.com/foo']],
    ], $this->headers);

    $response->assertStatus(422)->assertJsonValidationErrors(['settings.contact.instagram_url']);
});

test('Viber URL accepts any https URL (community invite links vary)', function () {
    $response = $this->patchJson('/api/v1/settings', [
        'settings' => ['contact' => ['viber_community_url' => 'https://invite.viber.com/?g2=AQA123']],
    ], $this->headers);

    $response->assertOk();
});

// ──────────────────────────────────────────────────────────────
// Round-trip — all contact fields persist correctly
// ──────────────────────────────────────────────────────────────

test('all contact fields persist correctly on round-trip', function () {
    $payload = [
        'contact_phone' => '(02) 8123-4567',
        'contact_email' => 'brgy.tambo@paranaque.gov.ph',
        'website_url' => 'https://tambo.barangay.org.ph',
        'full_address' => 'Barangay Tambo, Paranaque City',
        'latitude' => 14.4793,
        'longitude' => 121.0198,
        'settings' => [
            'contact' => [
                'mobile_number' => '09171234567',
                'emergency_hotline' => '911',
                'facebook_url' => 'https://facebook.com/brgytambo',
                'viber_community_url' => 'https://invite.viber.com/?g2=ABC',
                'youtube_url' => 'https://youtube.com/@brgytambo',
                'twitter_url' => 'https://x.com/brgytambo',
                'instagram_url' => 'https://instagram.com/brgytambo',
            ],
        ],
    ];

    $this->patchJson('/api/v1/settings', $payload, $this->headers)->assertOk();

    $response = $this->getJson('/api/v1/settings', $this->headers);

    $response->assertOk()
        ->assertJsonPath('data.contact_phone', '(02) 8123-4567')
        ->assertJsonPath('data.latitude', 14.4793)
        ->assertJsonPath('data.longitude', 121.0198)
        ->assertJsonPath('data.settings.contact.mobile_number', '09171234567')
        ->assertJsonPath('data.settings.contact.facebook_url', 'https://facebook.com/brgytambo')
        ->assertJsonPath('data.settings.contact.viber_community_url', 'https://invite.viber.com/?g2=ABC')
        ->assertJsonPath('data.settings.contact.youtube_url', 'https://youtube.com/@brgytambo')
        ->assertJsonPath('data.settings.contact.twitter_url', 'https://x.com/brgytambo')
        ->assertJsonPath('data.settings.contact.instagram_url', 'https://instagram.com/brgytambo');
});
