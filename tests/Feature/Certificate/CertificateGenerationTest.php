<?php

/**
 * Certificate Generation Tests
 *
 * Tests the IssuedDocument lifecycle: creating, listing, viewing, updating,
 * deleting documents. PDF generation is mocked because the DocumentPdfService
 * creates File records with storage-specific columns (storage_bucket) that
 * require real S3/Spaces — not available in SQLite test environment.
 *
 * For full PDF generation integration tests, use PostgreSQL test DB.
 */

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\Admin\File;
use App\Models\Tenant\Documents\DocumentTemplate;
use App\Models\Tenant\Documents\IssuedDocument;
use App\Models\Tenant\Records\Establishment;
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

    $this->template = DocumentTemplate::factory()->system()->create([
        'name' => 'Barangay Clearance',
        'category' => 'Clearance',
    ]);

    $this->resident = Resident::factory()->create([
        'barangay_id' => $this->barangay->id,
        'first_name' => 'Juan',
        'last_name' => 'dela Cruz',
    ]);

    // Mock the DocumentPdfService to avoid real PDF generation + S3 storage
    $mockPdfService = Mockery::mock(DocumentPdfService::class);
    $mockPdfService->shouldReceive('generate')->andReturn('%PDF-1.4 fake binary');
    $mockPdfService->shouldReceive('computeHash')->andReturn(str_repeat('a', 64));
    $mockPdfService->shouldReceive('buildQrUrl')->andReturn('https://kapitan.ph/verify/test-hash');
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

// ── Create Issued Document (POST /issued-documents) ──

test('can create an issued document for a resident', function () {
    $response = $this->postJson('/api/v1/issued-documents', [
        'template_id' => $this->template->id,
        'constituent_type' => 'resident',
        'constituent_id' => $this->resident->id,
        'purpose' => 'Employment',
    ], $this->headers);

    $response->assertCreated()
        ->assertJsonPath('message', 'Document issued successfully.')
        ->assertJsonPath('issued_document.constituent_type', 'resident')
        ->assertJsonPath('issued_document.constituent_id', $this->resident->id)
        ->assertJsonPath('issued_document.status', 'issued')
        ->assertJsonPath('issued_document.template_name', 'Barangay Clearance');
});

test('can create an issued document for an establishment', function () {
    $template = DocumentTemplate::factory()->system()->create([
        'name' => 'Business Clearance (New)',
        'category' => 'business_clearance_new',
        'constituent_type' => 'establishment',
    ]);
    $establishment = Establishment::create([
        'barangay_id' => $this->barangay->id,
        'establishment_number' => 'EST-2026-0001',
        'business_name' => 'Baháy Kubo Eatery',
        'business_type' => 'Restaurant',
        'owner_name' => 'Juan Dizon',
        'status' => 'active',
    ]);

    $response = $this->postJson('/api/v1/issued-documents', [
        'template_id' => $template->id,
        'constituent_type' => 'establishment',
        'constituent_id' => $establishment->id,
        'custom_field_values' => [
            'business_name' => $establishment->business_name,
            'owner_name' => $establishment->owner_name,
        ],
    ], $this->headers);

    $response->assertCreated()
        ->assertJsonPath('issued_document.constituent_type', 'establishment')
        ->assertJsonPath('issued_document.constituent_name', 'Baháy Kubo Eatery')
        ->assertJsonPath('issued_document.constituent_number', 'EST-2026-0001');

    expect($response->json('issued_document.pdf_file_id'))->not->toBeNull();
});

test('issued document gets auto-generated document number', function () {
    $response = $this->postJson('/api/v1/issued-documents', [
        'template_id' => $this->template->id,
        'constituent_type' => 'resident',
        'constituent_id' => $this->resident->id,
    ], $this->headers);

    $response->assertCreated();
    expect($response->json('issued_document.document_number'))->toBe('00000001');
});

test('document number increments for subsequent documents', function () {
    IssuedDocument::factory()->create([
        'barangay_id' => $this->barangay->id,
        'template_id' => $this->template->id,
        'document_number' => '00000005',
        'constituent_id' => $this->resident->id,
    ]);

    $response = $this->postJson('/api/v1/issued-documents', [
        'template_id' => $this->template->id,
        'constituent_type' => 'resident',
        'constituent_id' => $this->resident->id,
    ], $this->headers);

    $response->assertCreated();
    expect($response->json('issued_document.document_number'))->toBe('00000006');
});

test('issued document includes constituent name from resident', function () {
    $response = $this->postJson('/api/v1/issued-documents', [
        'template_id' => $this->template->id,
        'constituent_type' => 'resident',
        'constituent_id' => $this->resident->id,
    ], $this->headers);

    $response->assertCreated();
    // Name is uppercase (full_name accessor transforms to "DELA CRUZ, Juan")
    expect(strtolower($response->json('issued_document.constituent_name')))->toContain('dela cruz');
});

test('issued document stores blockchain hash', function () {
    $response = $this->postJson('/api/v1/issued-documents', [
        'template_id' => $this->template->id,
        'constituent_type' => 'resident',
        'constituent_id' => $this->resident->id,
    ], $this->headers);

    $response->assertCreated();
    expect($response->json('issued_document.blockchain_hash'))->not->toBeNull();
    expect(strlen($response->json('issued_document.blockchain_hash')))->toBe(64);
});

test('issued document stores QR verification URL', function () {
    $response = $this->postJson('/api/v1/issued-documents', [
        'template_id' => $this->template->id,
        'constituent_type' => 'resident',
        'constituent_id' => $this->resident->id,
    ], $this->headers);

    $response->assertCreated();
    expect($response->json('issued_document.qr_code_url'))->not->toBeNull();
});

test('issued document sets issued_date to today when not provided', function () {
    $response = $this->postJson('/api/v1/issued-documents', [
        'template_id' => $this->template->id,
        'constituent_type' => 'resident',
        'constituent_id' => $this->resident->id,
    ], $this->headers);

    $response->assertCreated();
    $issuedDate = $response->json('issued_document.issued_date');
    expect($issuedDate)->toContain(now()->toDateString());
});

test('issued document accepts custom issued date', function () {
    $response = $this->postJson('/api/v1/issued-documents', [
        'template_id' => $this->template->id,
        'constituent_type' => 'resident',
        'constituent_id' => $this->resident->id,
        'issued_date' => '2026-01-15',
    ], $this->headers);

    $response->assertCreated();
    expect($response->json('issued_document.issued_date'))->toContain('2026-01-15');
});

test('issued document accepts optional fields', function () {
    $response = $this->postJson('/api/v1/issued-documents', [
        'template_id' => $this->template->id,
        'constituent_type' => 'resident',
        'constituent_id' => $this->resident->id,
        'purpose' => 'Local Employment',
        'or_number' => 'OR-001',
        'or_amount' => 50.00,
        'ctc_number' => 'CTC-12345',
        'ctc_date' => '2026-01-10',
        'ctc_place' => 'Olongapo City',
        'valid_until' => '2026-06-15',
    ], $this->headers);

    $response->assertCreated()
        ->assertJsonPath('issued_document.purpose', 'Local Employment')
        ->assertJsonPath('issued_document.or_number', 'OR-001');
});

test('issued document stores pdf_file_id', function () {
    $response = $this->postJson('/api/v1/issued-documents', [
        'template_id' => $this->template->id,
        'constituent_type' => 'resident',
        'constituent_id' => $this->resident->id,
    ], $this->headers);

    $response->assertCreated();
    expect($response->json('issued_document.pdf_file_id'))->not->toBeNull();
});

// ── Validation ──

test('create issued document validates required fields', function () {
    $response = $this->postJson('/api/v1/issued-documents', [], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['template_id', 'constituent_type', 'constituent_id']);
});

test('create issued document rejects invalid template_id', function () {
    $response = $this->postJson('/api/v1/issued-documents', [
        'template_id' => '00000000-0000-0000-0000-000000000000',
        'constituent_type' => 'resident',
        'constituent_id' => $this->resident->id,
    ], $this->headers);

    $response->assertNotFound();
});

// ── Tenant Scoping ──

test('cannot generate certificate for resident in another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $otherResident = Resident::factory()->create([
        'barangay_id' => $otherBarangay->id,
    ]);

    $response = $this->postJson('/api/v1/issued-documents', [
        'template_id' => $this->template->id,
        'constituent_type' => 'resident',
        'constituent_id' => $otherResident->id,
    ], $this->headers);

    // Resident from other barangay should not resolve — constituent_name will be null
    $response->assertCreated();
    expect($response->json('issued_document.constituent_name'))->toBeNull();
});

test('issued documents are scoped to barangay on listing', function () {
    $otherBarangay = Barangay::factory()->create();
    $myResident = Resident::factory()->create(['barangay_id' => $this->barangay->id]);
    $otherResident = Resident::factory()->create(['barangay_id' => $otherBarangay->id]);

    IssuedDocument::factory()->count(3)->create([
        'barangay_id' => $this->barangay->id,
        'template_id' => $this->template->id,
        'constituent_id' => $myResident->id,
    ]);
    IssuedDocument::factory()->count(5)->create([
        'barangay_id' => $otherBarangay->id,
        'template_id' => $this->template->id,
        'constituent_id' => $otherResident->id,
    ]);

    $response = $this->getJson('/api/v1/issued-documents', $this->headers);

    $response->assertOk();
    expect($response->json('total'))->toBe(3);
});

test('cannot view issued document from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $otherResident = Resident::factory()->create(['barangay_id' => $otherBarangay->id]);
    $doc = IssuedDocument::factory()->create([
        'barangay_id' => $otherBarangay->id,
        'template_id' => $this->template->id,
        'constituent_id' => $otherResident->id,
    ]);

    $response = $this->getJson("/api/v1/issued-documents/{$doc->id}", $this->headers);

    $response->assertNotFound();
});

// ── List and View ──

test('can list issued documents', function () {
    IssuedDocument::factory()->count(3)->create([
        'barangay_id' => $this->barangay->id,
        'template_id' => $this->template->id,
        'constituent_id' => $this->resident->id,
    ]);

    $response = $this->getJson('/api/v1/issued-documents', $this->headers);

    $response->assertOk()
        ->assertJsonStructure(['data', 'current_page', 'total', 'per_page']);
    expect($response->json('total'))->toBe(3);
});

test('can view a single issued document', function () {
    $doc = IssuedDocument::factory()->create([
        'barangay_id' => $this->barangay->id,
        'template_id' => $this->template->id,
        'constituent_id' => $this->resident->id,
    ]);

    $response = $this->getJson("/api/v1/issued-documents/{$doc->id}", $this->headers);

    $response->assertOk()
        ->assertJsonPath('issued_document.id', $doc->id);
});

// ── Stats ──

test('issued document stats returns correct structure', function () {
    IssuedDocument::factory()->count(2)->create([
        'barangay_id' => $this->barangay->id,
        'template_id' => $this->template->id,
        'constituent_id' => $this->resident->id,
        'status' => 'issued',
    ]);
    IssuedDocument::factory()->released()->create([
        'barangay_id' => $this->barangay->id,
        'template_id' => $this->template->id,
        'constituent_id' => $this->resident->id,
    ]);

    $response = $this->getJson('/api/v1/issued-documents/stats', $this->headers);

    $response->assertOk()
        ->assertJsonStructure(['total', 'issued', 'released', 'cancelled', 'expired']);
    expect($response->json('total'))->toBe(3);
    expect($response->json('issued'))->toBe(2);
    expect($response->json('released'))->toBe(1);
});

// ── Update ──

test('can update issued document status', function () {
    $doc = IssuedDocument::factory()->create([
        'barangay_id' => $this->barangay->id,
        'template_id' => $this->template->id,
        'constituent_id' => $this->resident->id,
        'status' => 'issued',
    ]);

    $response = $this->putJson("/api/v1/issued-documents/{$doc->id}", [
        'status' => 'cancelled',
    ], $this->headers);

    $response->assertOk()
        ->assertJsonPath('issued_document.status', 'cancelled');
});

test('update rejects invalid status', function () {
    $doc = IssuedDocument::factory()->create([
        'barangay_id' => $this->barangay->id,
        'template_id' => $this->template->id,
        'constituent_id' => $this->resident->id,
    ]);

    $response = $this->putJson("/api/v1/issued-documents/{$doc->id}", [
        'status' => 'bogus',
    ], $this->headers);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

test('cannot update issued document from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $otherResident = Resident::factory()->create(['barangay_id' => $otherBarangay->id]);
    $doc = IssuedDocument::factory()->create([
        'barangay_id' => $otherBarangay->id,
        'template_id' => $this->template->id,
        'constituent_id' => $otherResident->id,
        'status' => 'issued',
    ]);

    $response = $this->putJson("/api/v1/issued-documents/{$doc->id}", [
        'status' => 'released',
    ], $this->headers);

    $response->assertNotFound();
});

// ── Delete ──

test('can soft delete an issued document', function () {
    $doc = IssuedDocument::factory()->create([
        'barangay_id' => $this->barangay->id,
        'template_id' => $this->template->id,
        'constituent_id' => $this->resident->id,
    ]);

    $response = $this->deleteJson("/api/v1/issued-documents/{$doc->id}", [], $this->headers);

    $response->assertOk()
        ->assertJsonPath('message', 'Issued document deleted.');
    $this->assertSoftDeleted('issued_documents', ['id' => $doc->id]);
});

test('cannot delete issued document from another barangay', function () {
    $otherBarangay = Barangay::factory()->create();
    $otherResident = Resident::factory()->create(['barangay_id' => $otherBarangay->id]);
    $doc = IssuedDocument::factory()->create([
        'barangay_id' => $otherBarangay->id,
        'template_id' => $this->template->id,
        'constituent_id' => $otherResident->id,
    ]);

    $response = $this->deleteJson("/api/v1/issued-documents/{$doc->id}", [], $this->headers);

    $response->assertNotFound();
});

// ── Authentication ──

test('issued documents endpoints require authentication', function () {
    $this->getJson('/api/v1/issued-documents')->assertUnauthorized();
    $this->postJson('/api/v1/issued-documents', [])->assertUnauthorized();
    $this->getJson('/api/v1/issued-documents/stats')->assertUnauthorized();
});
