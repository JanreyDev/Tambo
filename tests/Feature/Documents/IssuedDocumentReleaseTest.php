<?php

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\Platform\SmsTransaction;
use App\Models\Tenant\Documents\DocumentTemplate;
use App\Models\Tenant\Documents\IssuedDocument;
use App\Models\Tenant\Resident;
use App\Models\User;
use App\Services\SmsService;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    $this->barangay = Barangay::factory()->create([
        'sms_credit_balance' => 100.00,
    ]);
    $this->user = User::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);
    $this->headers = ['Authorization' => 'Bearer '.$this->user->createToken('test')->plainTextToken];

    $this->template = DocumentTemplate::factory()->system()->create([
        'name'     => 'Barangay Clearance',
        'settings' => ['show_qr' => true, 'expiry_months' => 3],
    ]);

    $this->resident = Resident::factory()->create([
        'barangay_id'    => $this->barangay->id,
        'mobile_number'  => '09171234567',
        'first_name'     => 'Juan',
        'last_name'      => 'dela Cruz',
    ]);

    $this->document = IssuedDocument::factory()
        ->forResident($this->resident)
        ->create([
            'template_id'    => $this->template->id,
            'template_name'  => $this->template->name,
            'document_number' => '00000001',
            'status'         => 'issued',
        ]);
});

// ── Status change → released triggers SMS ──

test('releasing a document sends SMS to resident with mobile number', function (): void {
    Http::fake([
        config('services.txtbox.url') => Http::response(['status' => 'sent'], 200),
    ]);

    $response = $this->putJson(
        "/api/v1/issued-documents/{$this->document->id}",
        ['status' => 'released'],
        $this->headers,
    );

    $response->assertOk();

    // SMS transaction logged
    expect(SmsTransaction::where('source', 'document_release')
        ->where('source_id', $this->document->id)
        ->where('status', 'sent')
        ->exists()
    )->toBeTrue();

    // Document flagged as sms_sent
    expect($this->document->fresh()->sms_sent)->toBeTrue();
});

test('released document SMS contains document number and template name', function (): void {
    Http::fake([
        config('services.txtbox.url') => Http::response(['status' => 'sent'], 200),
    ]);

    $this->putJson(
        "/api/v1/issued-documents/{$this->document->id}",
        ['status' => 'released'],
        $this->headers,
    );

    $transaction = SmsTransaction::where('source', 'document_release')
        ->where('source_id', $this->document->id)
        ->first();

    expect($transaction)->not->toBeNull();
    expect($transaction->message)->toContain('00000001');
    expect($transaction->message)->toContain('Barangay Clearance');
    expect($transaction->message)->toContain('Barangay Hall');
});

test('releasing document deducts SMS credit from barangay', function (): void {
    Http::fake([
        config('services.txtbox.url') => Http::response(['status' => 'sent'], 200),
    ]);

    $balanceBefore = (float) $this->barangay->fresh()->sms_credit_balance;

    $this->putJson(
        "/api/v1/issued-documents/{$this->document->id}",
        ['status' => 'released'],
        $this->headers,
    );

    $balanceAfter = (float) $this->barangay->fresh()->sms_credit_balance;

    // Credit must have been deducted
    expect($balanceAfter)->toBeLessThan($balanceBefore);
});

test('SMS not sent when status changes to cancelled', function (): void {
    Http::fake();

    $this->putJson(
        "/api/v1/issued-documents/{$this->document->id}",
        ['status' => 'cancelled'],
        $this->headers,
    );

    Http::assertNothingSent();
    expect($this->document->fresh()->sms_sent)->toBeFalse();
});

test('SMS not sent when status changes to expired', function (): void {
    Http::fake();

    $this->putJson(
        "/api/v1/issued-documents/{$this->document->id}",
        ['status' => 'expired'],
        $this->headers,
    );

    Http::assertNothingSent();
    expect($this->document->fresh()->sms_sent)->toBeFalse();
});

test('releasing document already released does not send duplicate SMS', function (): void {
    Http::fake([
        config('services.txtbox.url') => Http::response(['status' => 'sent'], 200),
    ]);

    // Already released
    $this->document->update(['status' => 'released', 'sms_sent' => true]);

    $this->putJson(
        "/api/v1/issued-documents/{$this->document->id}",
        ['status' => 'released'],
        $this->headers,
    );

    // No new SMS transaction from this second call
    expect(
        SmsTransaction::where('source', 'document_release')
            ->where('source_id', $this->document->id)
            ->count()
    )->toBe(0);
});

test('release SMS not sent for resident without mobile number', function (): void {
    Http::fake();

    $this->resident->update(['mobile_number' => null]);

    $response = $this->putJson(
        "/api/v1/issued-documents/{$this->document->id}",
        ['status' => 'released'],
        $this->headers,
    );

    // Update still succeeds
    $response->assertOk();
    // But no SMS sent
    Http::assertNothingSent();
    expect($this->document->fresh()->sms_sent)->toBeFalse();
});

test('release SMS not sent when barangay has insufficient credits', function (): void {
    $this->barangay->update(['sms_credit_balance' => 0.00]);

    Http::fake([
        config('services.txtbox.url') => Http::response([], 200),
    ]);

    $response = $this->putJson(
        "/api/v1/issued-documents/{$this->document->id}",
        ['status' => 'released'],
        $this->headers,
    );

    // Update still succeeds (SMS failure is non-critical)
    $response->assertOk();

    // Failed transaction logged with reason
    $transaction = SmsTransaction::where('source', 'document_release')
        ->where('source_id', $this->document->id)
        ->where('status', 'failed')
        ->first();

    expect($transaction)->not->toBeNull();
    expect($transaction->provider_response['reason'] ?? '')->toBe('insufficient_credits');

    // sms_sent stays false
    expect($this->document->fresh()->sms_sent)->toBeFalse();
});

test('SMS failure does not fail the document update response', function (): void {
    // Simulate TXTBOX API down
    Http::fake([
        config('services.txtbox.url') => Http::response('Service Unavailable', 503),
    ]);

    $response = $this->putJson(
        "/api/v1/issued-documents/{$this->document->id}",
        ['status' => 'released'],
        $this->headers,
    );

    // Document status updated regardless of SMS failure
    $response->assertOk();
    expect($this->document->fresh()->status)->toBe('released');
});
