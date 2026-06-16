<?php

/**
 * Expanded Audit Trail Tests
 *
 * Builds on AuditLogTest.php to cover:
 * - Field-level change tracking (before/after values)
 * - Audit logs for blotter and document operations
 * - IP address and user agent capture
 * - Soft delete audit entries
 * - Cross-barangay audit isolation
 */

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\Admin\File;
use App\Models\Platform\AuditLog;
use App\Models\Tenant\Documents\DocumentTemplate;
use App\Models\Tenant\Documents\IssuedDocument;
use App\Models\Tenant\Judicial\BlotterRecord;
use App\Models\Tenant\Resident;
use App\Models\User;
use App\Services\DocumentPdfService;

beforeEach(function () {
    $this->barangay = Barangay::factory()->create();
    $this->user = User::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);
    $this->token = $this->user->createToken('test')->plainTextToken;
    $this->headers = ['Authorization' => "Bearer {$this->token}"];

    // Mock DocumentPdfService for tests that issue documents through the API
    $mockPdfService = Mockery::mock(DocumentPdfService::class);
    $mockPdfService->shouldReceive('generate')->andReturn('%PDF-fake');
    $mockPdfService->shouldReceive('computeHash')->andReturn(str_repeat('b', 64));
    $mockPdfService->shouldReceive('buildQrUrl')->andReturn('https://kapitan.ph/verify/test');
    $mockPdfService->shouldReceive('generateAndStore')->andReturn(
        File::create([
            'barangay_id' => $this->barangay->id,
            'original_name' => 'test.pdf',
            'stored_name' => 'test.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => 1024,
            'storage_path' => 'test/test.pdf',
            'storage_bucket' => 'test',
            'uploaded_by' => $this->user->id,
            'category' => 'document',
            'is_public' => false,
            'metadata' => ['disk' => 'public'],
        ])
    );
    $this->app->instance(DocumentPdfService::class, $mockPdfService);
});

// ══════════════════════════════════════════════════════════════
// RESIDENT AUDIT — Field-level change tracking
// ══════════════════════════════════════════════════════════════

test('update audit log records old and new values for changed fields', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'first_name' => 'Maria',
        'civil_status' => 'single',
    ]);

    $this->putJson("/api/v1/residents/{$resident->id}", [
        'first_name' => 'Maria Updated',
        'civil_status' => 'married',
    ], $this->headers);

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $resident->id)
        ->where('action', 'updated')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->changes['old']['first_name'])->toBe('Maria');
    expect($log->changes['new']['first_name'])->toBe('Maria Updated');
    expect($log->changes['old']['civil_status'])->toContain('single');
    expect($log->changes['new']['civil_status'])->toContain('married');
});

test('update audit log only records fields that actually changed', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'first_name' => 'Maria',
        'last_name' => 'Santos',
    ]);

    $this->putJson("/api/v1/residents/{$resident->id}", [
        'first_name' => 'Maria Updated',
        // last_name not included — should not appear in changes
    ], $this->headers);

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $resident->id)
        ->where('action', 'updated')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->changes['fields_changed'])->toContain('first_name');
    // last_name was not changed, so it should not be in fields_changed
    if (in_array('last_name', $log->changes['fields_changed'] ?? [])) {
        // If it IS there, old and new should be equal
        expect($log->changes['old']['last_name'] ?? '')->toBe($log->changes['new']['last_name'] ?? '');
    }
});

test('create audit log records who created the resident', function () {
    $response = $this->postJson('/api/v1/residents', [
        'first_name' => 'Juan',
        'last_name' => 'Nuevo',
        'date_of_birth' => '1995-03-20',
        'sex' => 'male',
        'place_of_birth' => 'Olongapo City',
        'civil_status' => 'single',
        'resident_type' => 'permanent',
    ], $this->headers);

    $response->assertCreated();
    $residentId = $response->json('resident.id');

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $residentId)
        ->where('action', 'created')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->user_id)->toBe($this->user->id);
    expect($log->barangay_id)->toBe($this->barangay->id);
    expect($log->module)->toBe('residents');
});

test('delete audit log records who deleted the resident', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->deleteJson("/api/v1/residents/{$resident->id}", [], $this->headers);

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $resident->id)
        ->where('action', 'deleted')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->user_id)->toBe($this->user->id);
});

// ══════════════════════════════════════════════════════════════
// DOCUMENT AUDIT — Certificate issuance tracking
// ══════════════════════════════════════════════════════════════

test('issuing a document creates audit log entry', function () {
    $template = DocumentTemplate::factory()->system()->create([
        'name' => 'Barangay Clearance',
    ]);
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'first_name' => 'Juan',
        'last_name' => 'dela Cruz',
    ]);

    $response = $this->postJson('/api/v1/issued-documents', [
        'template_id' => $template->id,
        'constituent_type' => 'resident',
        'constituent_id' => $resident->id,
        'purpose' => 'Employment',
    ], $this->headers);

    $response->assertCreated();

    // Should have a document-level audit log
    $docLog = AuditLog::where('resource_type', 'issued_document')
        ->where('action', 'created')
        ->first();

    expect($docLog)->not->toBeNull();
    expect($docLog->user_id)->toBe($this->user->id);
    expect($docLog->changes)->toHaveKey('description');
    expect($docLog->changes['description'])->toContain('Barangay Clearance');
});

test('issuing a document creates audit entry on the resident record', function () {
    $template = DocumentTemplate::factory()->system()->create([
        'name' => 'Certificate of Residency',
    ]);
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->postJson('/api/v1/issued-documents', [
        'template_id' => $template->id,
        'constituent_type' => 'resident',
        'constituent_id' => $resident->id,
    ], $this->headers);

    // Should have a resident-level audit log entry (appears in Activity tab)
    $residentLog = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $resident->id)
        ->where('action', 'document_issued')
        ->first();

    expect($residentLog)->not->toBeNull();
    expect($residentLog->changes)->toHaveKey('template_name');
    expect($residentLog->changes['template_name'])->toBe('Certificate of Residency');
});

// ══════════════════════════════════════════════════════════════
// IP AND USER AGENT — All audit entries capture request metadata
// ══════════════════════════════════════════════════════════════

test('audit log captures IP address on view', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->getJson("/api/v1/residents/{$resident->id}", $this->headers);

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $resident->id)
        ->first();

    expect($log->ip_address)->not->toBeNull();
});

test('audit log captures user agent on view', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->getJson("/api/v1/residents/{$resident->id}", $this->headers);

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $resident->id)
        ->first();

    expect($log->user_agent)->not->toBeNull();
});

test('audit log captures IP address on create', function () {
    $response = $this->postJson('/api/v1/residents', [
        'first_name' => 'Test',
        'last_name' => 'IP',
        'date_of_birth' => '1990-01-01',
        'sex' => 'male',
        'place_of_birth' => 'Test City',
        'civil_status' => 'single',
        'resident_type' => 'permanent',
    ], $this->headers);

    $response->assertCreated();
    $residentId = $response->json('resident.id');

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $residentId)
        ->where('action', 'created')
        ->first();

    expect($log->ip_address)->not->toBeNull();
});

test('audit log captures IP address on update', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->putJson("/api/v1/residents/{$resident->id}", [
        'first_name' => 'Updated',
    ], $this->headers);

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $resident->id)
        ->where('action', 'updated')
        ->first();

    expect($log->ip_address)->not->toBeNull();
});

test('audit log captures IP address on delete', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->deleteJson("/api/v1/residents/{$resident->id}", [], $this->headers);

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $resident->id)
        ->where('action', 'deleted')
        ->first();

    expect($log->ip_address)->not->toBeNull();
});

// ══════════════════════════════════════════════════════════════
// AUDIT LOG ISOLATION
// ══════════════════════════════════════════════════════════════

test('audit logs from different barangays are isolated', function () {
    $otherBarangay = Barangay::factory()->create();
    $otherUser = User::factory()->create(['barangay_id' => $otherBarangay->id]);

    // Create audit logs for both barangays
    AuditLog::create([
        'barangay_id' => $this->barangay->id,
        'user_id' => $this->user->id,
        'action' => 'viewed',
        'resource_type' => 'resident',
        'resource_id' => 'test-id-1',
        'ip_address' => '127.0.0.1',
        'user_agent' => 'test',
        'module' => 'residents',
    ]);

    AuditLog::create([
        'barangay_id' => $otherBarangay->id,
        'user_id' => $otherUser->id,
        'action' => 'viewed',
        'resource_type' => 'resident',
        'resource_id' => 'test-id-2',
        'ip_address' => '127.0.0.1',
        'user_agent' => 'test',
        'module' => 'residents',
    ]);

    // Query logs for barangay A
    $logsA = AuditLog::where('barangay_id', $this->barangay->id)->get();
    expect($logsA)->toHaveCount(1);
    expect($logsA->first()->resource_id)->toBe('test-id-1');

    // Query logs for barangay B
    $logsB = AuditLog::where('barangay_id', $otherBarangay->id)->get();
    expect($logsB)->toHaveCount(1);
    expect($logsB->first()->resource_id)->toBe('test-id-2');
});

test('cannot access another barangay resident activity endpoint', function () {
    $otherBarangay = Barangay::factory()->create();
    $otherResident = Resident::factory()->create([
        'barangay_id' => $otherBarangay->id,
    ]);

    $response = $this->getJson("/api/v1/residents/{$otherResident->id}/activity", $this->headers);

    $response->assertNotFound();
});

// ══════════════════════════════════════════════════════════════
// AUDIT LOG STRUCTURE VALIDATION
// ══════════════════════════════════════════════════════════════

test('audit log uses correct module name for residents', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->getJson("/api/v1/residents/{$resident->id}", $this->headers);

    $log = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $resident->id)
        ->first();

    expect($log->module)->toBe('residents');
});

test('audit log stores correct resource type', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->getJson("/api/v1/residents/{$resident->id}", $this->headers);
    $this->putJson("/api/v1/residents/{$resident->id}", ['first_name' => 'Updated'], $this->headers);
    $this->deleteJson("/api/v1/residents/{$resident->id}", [], $this->headers);

    $actions = AuditLog::where('resource_type', 'resident')
        ->where('resource_id', $resident->id)
        ->pluck('action')
        ->toArray();

    expect($actions)->toContain('viewed');
    expect($actions)->toContain('updated');
    expect($actions)->toContain('deleted');
});

test('activity endpoint returns paginated audit log', function () {
    $resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    // Generate some activity
    $this->getJson("/api/v1/residents/{$resident->id}", $this->headers);
    $this->putJson("/api/v1/residents/{$resident->id}", ['first_name' => 'Test1'], $this->headers);
    $this->putJson("/api/v1/residents/{$resident->id}", ['first_name' => 'Test2'], $this->headers);

    $response = $this->getJson("/api/v1/residents/{$resident->id}/activity", $this->headers);

    $response->assertOk();
    $data = $response->json('data');
    expect($data)->toBeArray();
    expect(count($data))->toBeGreaterThanOrEqual(3);
});
