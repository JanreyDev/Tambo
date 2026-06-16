<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Admin\Barangay;
use App\Models\Tenant\Documents\DocumentTemplate;
use App\Models\Tenant\Documents\IssuedDocument;
use App\Models\Tenant\Records\Establishment;
use App\Models\Tenant\Records\LotBuilding;
use App\Models\Tenant\Resident;
use App\Services\AiService;
use App\Services\DocumentPdfService;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class IssuedDocumentController extends Controller
{
    public function __construct(
        private readonly DocumentPdfService $pdfService,
        private readonly SmsService $smsService,
    ) {}

    /**
     * List issued documents with search/filter/pagination.
     *
     * GET /api/v1/issued-documents
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = IssuedDocument::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('document_number', 'ilike', "%{$search}%")
                    ->orWhere('constituent_name', 'ilike', "%{$search}%")
                    ->orWhere('template_name', 'ilike', "%{$search}%")
                    ->orWhere('or_number', 'ilike', "%{$search}%")
                    ->orWhere('purpose', 'ilike', "%{$search}%");
            });
        }

        if ($templateId = $request->get('template_id')) {
            $query->where('template_id', $templateId);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($constituentType = $request->get('constituent_type')) {
            $query->where('constituent_type', $constituentType);
        }

        if ($constituentId = $request->get('constituent_id')) {
            $query->where('constituent_id', $constituentId);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['document_number', 'template_name', 'constituent_name', 'issued_date', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single issued document.
     *
     * GET /api/v1/issued-documents/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $document = IssuedDocument::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['issued_document' => $document]);
    }

    /**
     * Create a new issued document with PDF generation.
     *
     * POST /api/v1/issued-documents
     *
     * Flow:
     * 1. Validate input
     * 2. Resolve template + resident
     * 3. Auto-generate document number
     * 4. Create IssuedDocument record
     * 5. Generate PDF via DomPDF
     * 6. Compute SHA-256 blockchain hash
     * 7. Generate QR verification URL
     * 8. Store PDF to disk
     * 9. Update document with pdf_file_id + hash + qr_url
     * 10. Return complete document
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_id' => ['required', 'uuid'],
            'constituent_type' => ['required', 'string', 'max:50'],
            'constituent_id' => ['required', 'uuid'],
            'purpose' => ['nullable', 'string', 'max:500'],
            'or_number' => ['nullable', 'string', 'max:50'],
            'or_amount' => ['nullable', 'numeric', 'min:0'],
            'ctc_number' => ['nullable', 'string', 'max:50'],
            'ctc_date' => ['nullable', 'date'],
            'ctc_place' => ['nullable', 'string', 'max:255'],
            'issued_date' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date'],
            'custom_field_values' => ['nullable', 'array'],
            'approved_by_left' => ['nullable', 'string', 'max:255'],
            'approved_by_right' => ['nullable', 'string', 'max:255'],
            'custom_content' => ['nullable', 'string', 'max:50000'],
        ]);

        $barangayId = $request->user()->barangay_id;
        $barangay = Barangay::findOrFail($barangayId);

        // Resolve template (barangay-specific or system default)
        $template = DocumentTemplate::where(function ($q) use ($barangayId) {
            $q->where('barangay_id', $barangayId)
                ->orWhereNull('barangay_id');
        })->findOrFail($validated['template_id']);

        if ($template->constituent_type !== $validated['constituent_type']) {
            return response()->json([
                'message' => 'The selected template does not match the constituent type.',
            ], 422);
        }

        // Resolve resident (for merge fields)
        $resident = null;
        $establishment = null;
        $lotBuilding = null;
        $constituentName = null;
        $constituentNumber = null;
        if ($validated['constituent_type'] === 'resident') {
            $resident = Resident::where('barangay_id', $barangayId)
                ->with(['photoFile', 'sectoralTags'])
                ->find($validated['constituent_id']);
            if ($resident) {
                $constituentName = $resident->full_name;
                $constituentNumber = $resident->resident_number;
            }
        } elseif ($validated['constituent_type'] === 'establishment') {
            $establishment = Establishment::where('barangay_id', $barangayId)
                ->findOrFail($validated['constituent_id']);
            $constituentName = $establishment->business_name;
            $constituentNumber = $establishment->establishment_number;
        } elseif ($validated['constituent_type'] === 'lot_building') {
            $lotBuilding = LotBuilding::where('barangay_id', $barangayId)
                ->findOrFail($validated['constituent_id']);
            $constituentName = $lotBuilding->owner_name;
            $constituentNumber = $lotBuilding->lot_building_number;
        }

        // Auto-generate document number (barangay-scoped)
        $lastNumber = IssuedDocument::where('barangay_id', $barangayId)
            ->max('document_number');
        $nextNumber = $lastNumber
            ? str_pad((string) ((int) $lastNumber + 1), 8, '0', STR_PAD_LEFT)
            : '00000001';

        // Create the issued document record
        $document = IssuedDocument::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'document_number' => $nextNumber,
            'template_name' => $template->name,
            'constituent_name' => $constituentName,
            'constituent_number' => $constituentNumber,
            'issued_date' => $validated['issued_date'] ?? now()->toDateString(),
            'status' => 'issued',
            'created_by' => $request->user()->id,
        ]);

        // Phase 1: Generate PDF without hash to compute the hash
        $pdfBinary = $this->pdfService->generate(
            $document, $template, $barangay, $resident, $establishment, $lotBuilding, $request->user()
        );

        // Compute blockchain hash from initial PDF
        $hash = $this->pdfService->computeHash($document, $pdfBinary);
        $qrUrl = $this->pdfService->buildQrUrl($hash);

        // Update document with hash + QR URL
        $document->update([
            'blockchain_hash' => $hash,
            'qr_code_url' => $qrUrl,
        ]);

        // Phase 2: Re-generate final PDF with hash in footer, then store
        $file = $this->pdfService->generateAndStore(
            $document->fresh(), $template, $barangay, $resident, $establishment, $lotBuilding, $request->user()
        );

        $document->update(['pdf_file_id' => $file->id]);

        // Audit logs — dual entry: one for the document, one for the resident's Activity tab
        try {
            $auditBase = [
                'barangay_id' => $barangayId,
                'user_id' => $request->user()->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'module' => 'documents',
            ];

            // 1. Document-level audit log
            \App\Models\Platform\AuditLog::create([
                ...$auditBase,
                'action' => 'created',
                'resource_type' => 'issued_document',
                'resource_id' => $document->id,
                'changes' => [
                    'description' => "Issued {$template->name} for {$constituentName}",
                    'document_number' => $nextNumber,
                ],
            ]);

            // 2. Resident-level audit log (appears in resident's Activity tab)
            if ($validated['constituent_type'] === 'resident' && $resident) {
                \App\Models\Platform\AuditLog::create([
                    ...$auditBase,
                    'action' => 'document_issued',
                    'resource_type' => 'resident',
                    'resource_id' => $resident->id,
                    'changes' => [
                        'description' => "Issued {$template->name}",
                        'document_number' => $nextNumber,
                        'document_id' => $document->id,
                        'template_name' => $template->name,
                        'purpose' => $document->purpose,
                    ],
                ]);
            }

            if ($validated['constituent_type'] === 'establishment' && $establishment) {
                \App\Models\Platform\AuditLog::create([
                    ...$auditBase,
                    'action' => 'document_issued',
                    'resource_type' => 'establishment',
                    'resource_id' => $establishment->id,
                    'changes' => [
                        'description' => "Issued {$template->name}",
                        'document_number' => $nextNumber,
                        'document_id' => $document->id,
                        'template_name' => $template->name,
                    ],
                ]);
            }
        } catch (\Throwable) {
            // Non-critical — don't fail the request
        }

        return response()->json([
            'message' => 'Document issued successfully.',
            'issued_document' => $document->fresh(),
        ], 201);
    }

    /**
     * Download the PDF for an issued document.
     *
     * GET /api/v1/issued-documents/{id}/pdf
     */
    public function downloadPdf(Request $request, string $id): Response|JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $document = IssuedDocument::where('barangay_id', $barangayId)
            ->findOrFail($id);

        $barangay = Barangay::findOrFail($barangayId);

        $template = DocumentTemplate::where(function ($q) use ($barangayId) {
            $q->where('barangay_id', $barangayId)
                ->orWhereNull('barangay_id');
        })->find($document->template_id);

        if (! $template) {
            // Fallback: serve stored PDF if template was deleted
            if ($document->pdf_file_id) {
                $file = \App\Models\Admin\File::find($document->pdf_file_id);
                if ($file) {
                    $disk = $file->metadata['disk'] ?? config('filesystems.default', 'public');
                    try {
                        $content = Storage::disk($disk)->get($file->storage_path);
                        return response($content, 200, [
                            'Content-Type' => 'application/pdf',
                            'Content-Disposition' => 'inline; filename="'.($file->original_name ?? $document->document_number.'.pdf').'"',
                            'Cache-Control' => 'no-store, no-cache, must-revalidate',
                        ]);
                    } catch (\Throwable) {}
                }
            }
            return response()->json(['message' => 'Template not found and no stored PDF available.'], 404);
        }

        // Resolve constituent
        $resident = null;
        $establishment = null;
        $lotBuilding = null;
        if ($document->constituent_type === 'resident' && $document->constituent_id) {
            $resident = Resident::where('barangay_id', $barangayId)
                ->with(['photoFile', 'sectoralTags'])
                ->find($document->constituent_id);
        } elseif ($document->constituent_type === 'establishment' && $document->constituent_id) {
            $establishment = Establishment::where('barangay_id', $barangayId)
                ->find($document->constituent_id);
        } elseif ($document->constituent_type === 'lot_building' && $document->constituent_id) {
            $lotBuilding = LotBuilding::where('barangay_id', $barangayId)
                ->find($document->constituent_id);
        }

        // Always generate fresh PDF from current template
        $content = $this->pdfService->generate(
            $document, $template, $barangay, $resident, $establishment, $lotBuilding, $request->user()
        );

        $filename = $document->document_number.'.pdf';

        return response($content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
    }

    /**
     * Regenerate PDF for an existing issued document.
     *
     * POST /api/v1/issued-documents/{id}/regenerate
     */
    public function regeneratePdf(Request $request, string $id): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $document = IssuedDocument::where('barangay_id', $barangayId)->findOrFail($id);
        $barangay = Barangay::findOrFail($barangayId);

        $template = DocumentTemplate::where(function ($q) use ($barangayId) {
            $q->where('barangay_id', $barangayId)
                ->orWhereNull('barangay_id');
        })->find($document->template_id);

        if (! $template) {
            return response()->json(['message' => 'Original template not found.'], 404);
        }

        $resident = null;
        $establishment = null;
        $lotBuilding = null;
        if ($document->constituent_type === 'resident' && $document->constituent_id) {
            $resident = Resident::where('barangay_id', $barangayId)
                ->with(['photoFile', 'sectoralTags'])
                ->find($document->constituent_id);
        } elseif ($document->constituent_type === 'establishment' && $document->constituent_id) {
            $establishment = Establishment::where('barangay_id', $barangayId)
                ->find($document->constituent_id);
        } elseif ($document->constituent_type === 'lot_building' && $document->constituent_id) {
            $lotBuilding = LotBuilding::where('barangay_id', $barangayId)
                ->find($document->constituent_id);
        }

        $file = $this->pdfService->generateAndStore(
            $document, $template, $barangay, $resident, $establishment, $lotBuilding, $request->user()
        );

        // Delete old file if exists
        if ($document->pdf_file_id && $document->pdf_file_id !== $file->id) {
            $oldFile = \App\Models\Admin\File::find($document->pdf_file_id);
            if ($oldFile) {
                $disk = $oldFile->metadata['disk'] ?? 'public';
                Storage::disk($disk)->delete($oldFile->storage_path);
                $oldFile->delete();
            }
        }

        $document->update([
            'pdf_file_id' => $file->id,
            'updated_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'PDF regenerated.',
            'issued_document' => $document->fresh(),
        ]);
    }

    /**
     * Update an issued document (status changes, amendments).
     * Triggers SMS notification when status changes to 'released'.
     *
     * PUT /api/v1/issued-documents/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $document = IssuedDocument::where('barangay_id', $barangayId)
            ->findOrFail($id);

        $validated = $request->validate([
            'purpose' => ['nullable', 'string', 'max:500'],
            'or_number' => ['nullable', 'string', 'max:50'],
            'or_amount' => ['nullable', 'numeric', 'min:0'],
            'ctc_number' => ['nullable', 'string', 'max:50'],
            'ctc_date' => ['nullable', 'date'],
            'ctc_place' => ['nullable', 'string', 'max:255'],
            'valid_until' => ['nullable', 'date'],
            'custom_field_values' => ['nullable', 'array'],
            'approved_by_left' => ['nullable', 'string', 'max:255'],
            'approved_by_right' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'in:issued,released,cancelled,expired'],
        ]);

        $previousStatus = $document->status;
        $validated['updated_by'] = $request->user()->id;
        $document->update($validated);

        // Send SMS notification when a document is released to the constituent
        $newStatus = $validated['status'] ?? null;
        if ($newStatus === 'released' && $previousStatus !== 'released') {
            $this->sendReleaseNotification($document->fresh(), $barangayId);
        }

        return response()->json([
            'message' => 'Issued document updated.',
            'issued_document' => $document->fresh(),
        ]);
    }

    /**
     * Send an SMS notification to the constituent when their document is released.
     * Non-critical — failure is logged but never breaks the update response.
     */
    private function sendReleaseNotification(IssuedDocument $document, string $barangayId): void
    {
        try {
            // Only send SMS for resident constituents (they have phone numbers)
            if ($document->constituent_type !== 'resident' || ! $document->constituent_id) {
                return;
            }

            $resident = Resident::where('barangay_id', $barangayId)
                ->find($document->constituent_id);

            if (! $resident || ! $resident->mobile_number) {
                return;
            }

            $barangay = Barangay::find($barangayId);

            $docNumber = $document->document_number;
            $templateName = $document->template_name ?? 'Document';
            $validUntil = $document->valid_until
                ? ' Valid until: '.$document->valid_until->format('M d, Y').'.'
                : '';

            $body = "Your {$templateName} (No. {$docNumber}) is now ready for release. "
                ."Please claim it at the Barangay Hall.{$validUntil}";

            $message = SmsService::formatWithSenderHeader($body, $barangay);

            $sent = $this->smsService->send(
                $resident->mobile_number,
                $message,
                $barangay,
                'document_release',
                $document->id,
            );

            // sms_sent = true only on confirmed delivery (SmsService logs all attempts regardless)
            if ($sent) {
                $document->update(['sms_sent' => true]);
            }

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Document release SMS failed', [
                'document_id' => $document->id,
                'document_number' => $document->document_number,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get document counts by status.
     *
     * GET /api/v1/issued-documents/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $base = IssuedDocument::where('barangay_id', $barangayId);

        return response()->json([
            'total' => (clone $base)->count(),
            'issued' => (clone $base)->where('status', 'issued')->count(),
            'released' => (clone $base)->where('status', 'released')->count(),
            'cancelled' => (clone $base)->where('status', 'cancelled')->count(),
            'expired' => (clone $base)->where('status', 'expired')->count(),
        ]);
    }

    /**
     * Soft delete an issued document.
     *
     * DELETE /api/v1/issued-documents/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $document = IssuedDocument::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $document->update(['deleted_by' => $request->user()->id]);
        $document->delete();

        return response()->json(['message' => 'Issued document deleted.']);
    }

    /**
     * POST /api/v1/issued-documents/ai-fill
     * Use Mabini AI to extract document field values from a natural-language message.
     * Returns extracted fields as JSON + a display message for the chat UI.
     */
    public function aiFill(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_id' => 'required|string',
            'resident_id' => 'nullable|string',
            'message' => 'required|string|max:1000',
            'current_fields' => 'nullable|array',
        ]);

        $barangayId = $request->user()->barangay_id;

        // Load template (system or barangay-owned)
        $template = DocumentTemplate::where('id', $validated['template_id'])
            ->where(function ($q) use ($barangayId) {
                $q->whereNull('barangay_id')->orWhere('barangay_id', $barangayId);
            })
            ->firstOrFail();

        // Load resident if provided
        $resident = null;
        if (! empty($validated['resident_id'])) {
            $resident = Resident::where('barangay_id', $barangayId)->find($validated['resident_id']);
        }

        $apiKey = config('services.anthropic.api_key');
        if (! $apiKey) {
            return response()->json(['error' => 'AI service not configured.'], 503);
        }

        // Check AI credit balance before calling API
        $barangay = Barangay::findOrFail($barangayId);
        if (! AiService::hasMinimumCredits($barangay)) {
            return response()->json([
                'error' => 'Insufficient AI credits. Please top up to use Mabini AI.',
                'code' => 'insufficient_credits',
            ], 402);
        }

        // Build field list for the prompt
        $customInputs = $template->custom_inputs ?? [];
        $fieldLines = collect($customInputs)->map(function ($f) {
            $req = ($f['required'] ?? false) ? ' (REQUIRED)' : ' (optional)';

            return "- {$f['name']}: {$f['label']}{$req}";
        })->join("\n");
        $fieldLines .= "\n- purpose: Purpose of the document (optional)";

        $residentLine = $resident
            ? "Resident: {$resident->full_name} ({$resident->resident_number})"
            : 'No specific resident.';

        $currentJson = json_encode($validated['current_fields'] ?? [], JSON_UNESCAPED_UNICODE);

        $systemPrompt = <<<PROMPT
You are Mabini, a helpful AI assistant for a barangay office in the Philippines.
You are helping staff fill out a "{$template->name}" document.

{$residentLine}

Fields to fill:
{$fieldLines}

Current field values already filled: {$currentJson}

TASK: Extract field values from what the staff member types. They may type in Filipino, English, or Taglish.

RULES:
1. Reply in friendly Taglish — brief, 1-2 sentences max.
2. ALWAYS end your response with a JSON block in EXACTLY this format on its own line:
[FIELDS]{"field_name": "value", "another_field": "value"}[/FIELDS]
3. Only include fields that have values in the JSON block.
4. If a REQUIRED field is missing from all messages so far, ask for it specifically.
5. Do not ask for optional fields unless the user mentions them.
6. Keep dates in plain text as the user types them (e.g. "March 15, 2026").
PROMPT;

        try {
            $response = Http::withHeaders([
                'x-api-key' => $apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ])->post('https://api.anthropic.com/v1/messages', [
                'model' => 'claude-haiku-4-5',
                'max_tokens' => 400,
                'system' => $systemPrompt,
                'messages' => [['role' => 'user', 'content' => $validated['message']]],
            ]);

            if (! $response->successful()) {
                Log::warning('Document AI fill API error', ['status' => $response->status()]);

                return response()->json(['error' => 'AI request failed.'], 502);
            }

            $fullText = $response->json('content.0.text') ?? '';

            // Deduct AI credits for actual token usage
            $inputTokens = $response->json('usage.input_tokens') ?? 0;
            $outputTokens = $response->json('usage.output_tokens') ?? 0;
            if ($inputTokens > 0 || $outputTokens > 0) {
                $cost = AiService::calculateCost($inputTokens, $outputTokens, $barangay);
                $barangay->deductAiCredit($cost);
                Log::info('Document AI fill credit deducted', [
                    'barangay_id' => $barangayId,
                    'input_tokens' => $inputTokens,
                    'output_tokens' => $outputTokens,
                    'cost_php' => $cost,
                ]);
            }

            // Extract [FIELDS]{...}[/FIELDS] JSON block
            $extractedFields = [];
            if (preg_match('/\[FIELDS\](.*?)\[\/FIELDS\]/s', $fullText, $matches)) {
                try {
                    $extractedFields = json_decode(trim($matches[1]), true, 512, JSON_THROW_ON_ERROR) ?? [];
                } catch (\Throwable) {
                    $extractedFields = [];
                }
            }

            // Clean display message (strip the FIELDS block)
            $displayMessage = trim(preg_replace('/\s*\[FIELDS\].*?\[\/FIELDS\]/s', '', $fullText));

            // Check if all required fields are now satisfied
            $requiredNames = collect($customInputs)->where('required', true)->pluck('name');
            $allCurrentKeys = collect($validated['current_fields'] ?? [])->merge($extractedFields)->keys();
            $allRequiredFilled = $requiredNames->every(fn ($name) => $allCurrentKeys->contains($name) && ! empty($allCurrentKeys[$name]));

            return response()->json([
                'message' => $displayMessage ?: 'Naiintindihan ko. Nag-update na ang document!',
                'fields' => $extractedFields,
                'all_required_filled' => $allRequiredFilled,
            ]);
        } catch (\Throwable $e) {
            Log::error('Document AI fill failed', ['error' => $e->getMessage()]);

            return response()->json(['error' => 'AI extraction failed. Please fill the fields manually.'], 500);
        }
    }
}
