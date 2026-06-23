<?php

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\Tenant\Resident;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Http::fake();

    $this->nonTamboBarangay = Barangay::factory()->create([
        'name' => 'San Dionisio',
        'psgc_code' => '137604023',
    ]);

    $this->tamboBarangay = Barangay::factory()->create([
        'name' => 'Tambo',
        'psgc_code' => '137604024',
    ]);
});

test('non-Tambo resident registration does not require OTP and succeeds instantly', function () {
    $user = User::factory()->create([
        'barangay_id' => $this->nonTamboBarangay->id,
    ]);
    $token = $user->createToken('test')->plainTextToken;
    $headers = ['Authorization' => "Bearer {$token}"];

    $response = $this->postJson('/api/v1/residents', [
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'date_of_birth' => '1990-01-15',
        'sex' => 'female',
        'place_of_birth' => 'Olongapo City, Zambales',
        'civil_status' => 'single',
        'resident_type' => 'permanent',
        'mobile_number' => '09171234567',
    ], $headers);

    $response->assertCreated();
    $this->assertDatabaseHas('residents', [
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'barangay_id' => $this->nonTamboBarangay->id,
    ]);
});

test('Tambo resident registration fails when no OTP is provided', function () {
    $user = User::factory()->create([
        'barangay_id' => $this->tamboBarangay->id,
    ]);
    $token = $user->createToken('test')->plainTextToken;
    $headers = ['Authorization' => "Bearer {$token}"];

    $response = $this->postJson('/api/v1/residents', [
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'date_of_birth' => '1990-01-15',
        'sex' => 'male',
        'place_of_birth' => 'Olongapo City, Zambales',
        'civil_status' => 'single',
        'resident_type' => 'permanent',
        'mobile_number' => '09171234567',
    ], $headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['otp_code']);
});

test('Tambo resident registration fails with invalid OTP code', function () {
    $user = User::factory()->create([
        'barangay_id' => $this->tamboBarangay->id,
    ]);
    $token = $user->createToken('test')->plainTextToken;
    $headers = ['Authorization' => "Bearer {$token}"];

    Cache::put('otp:resident_registration:09171234567', '123456', now()->addMinutes(5));

    $response = $this->postJson('/api/v1/residents', [
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'date_of_birth' => '1990-01-15',
        'sex' => 'male',
        'place_of_birth' => 'Olongapo City, Zambales',
        'civil_status' => 'single',
        'resident_type' => 'permanent',
        'mobile_number' => '09171234567',
        'otp_code' => '999999',
    ], $headers);

    $response->assertStatus(422)
        ->assertJsonPath('errors.otp_code.0', 'The verification code is invalid or has expired.');
});

test('Tambo resident registration succeeds with valid OTP code', function () {
    $user = User::factory()->create([
        'barangay_id' => $this->tamboBarangay->id,
    ]);
    $token = $user->createToken('test')->plainTextToken;
    $headers = ['Authorization' => "Bearer {$token}"];

    Cache::put('otp:resident_registration:09171234567', '123456', now()->addMinutes(5));

    $response = $this->postJson('/api/v1/residents', [
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'date_of_birth' => '1990-01-15',
        'sex' => 'male',
        'place_of_birth' => 'Olongapo City, Zambales',
        'civil_status' => 'single',
        'resident_type' => 'permanent',
        'mobile_number' => '09171234567',
        'otp_code' => '123456',
    ], $headers);

    $response->assertCreated();
    $this->assertDatabaseHas('residents', [
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'barangay_id' => $this->tamboBarangay->id,
    ]);
});

test('Tambo send-otp route sends and caches OTP successfully', function () {
    $user = User::factory()->create([
        'barangay_id' => $this->tamboBarangay->id,
    ]);
    $token = $user->createToken('test')->plainTextToken;
    $headers = ['Authorization' => "Bearer {$token}"];

    config(['services.txtbox.api_key' => 'test-key']);
    $this->tamboBarangay->update(['sms_credit_balance' => 100.00]);

    $response = $this->postJson('/api/v1/residents/send-otp', [
        'mobile_number' => '09171234567',
    ], $headers);

    $response->assertOk();

    $cachedOtp = Cache::get('otp:resident_registration:09171234567');
    expect($cachedOtp)->not->toBeNull();
    expect(strlen($cachedOtp))->toBe(6);
});

test('non-Tambo send-otp route rejects request with 400', function () {
    $user = User::factory()->create([
        'barangay_id' => $this->nonTamboBarangay->id,
    ]);
    $token = $user->createToken('test')->plainTextToken;
    $headers = ['Authorization' => "Bearer {$token}"];

    $response = $this->postJson('/api/v1/residents/send-otp', [
        'mobile_number' => '09171234567',
    ], $headers);

    $response->assertStatus(400)
        ->assertJsonPath('message', 'OTP verification is only required for Barangay Tambo.');
});
