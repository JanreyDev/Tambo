<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Documents\IssuedDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IssuedDocumentController extends Controller
{
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

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['document_number', 'issued_date', 'status', 'created_at'];

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
     * Create a new issued document.
     *
     * POST /api/v1/issued-documents
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
        ]);

        $barangayId = $request->user()->barangay_id;

        // Auto-generate document number
        $lastNumber = IssuedDocument::where('barangay_id', $barangayId)
            ->max('document_number');
        $nextNumber = $lastNumber
            ? str_pad((string) ((int) $lastNumber + 1), 8, '0', STR_PAD_LEFT)
            : '00000001';

        $document = IssuedDocument::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'document_number' => $nextNumber,
            'issued_date' => $validated['issued_date'] ?? now()->toDateString(),
            'status' => 'issued',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Document issued.',
            'issued_document' => $document,
        ], 201);
    }

    /**
     * Update an issued document (status changes, amendments).
     *
     * PUT /api/v1/issued-documents/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $document = IssuedDocument::where('barangay_id', $request->user()->barangay_id)
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

        $validated['updated_by'] = $request->user()->id;
        $document->update($validated);

        return response()->json([
            'message' => 'Issued document updated.',
            'issued_document' => $document->fresh(),
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
}
