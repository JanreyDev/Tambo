<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Documents\DocumentTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentTemplateController extends Controller
{
    /**
     * List document templates with filters.
     *
     * GET /api/v1/document-templates
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = DocumentTemplate::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('category', 'ilike', "%{$search}%");
            });
        }

        if ($category = $request->get('category')) {
            $query->where('category', $category);
        }

        if ($request->has('is_active')) {
            $status = $request->boolean('is_active') ? 'active' : 'inactive';
            $query->where('status', $status);
        }

        $sortBy = $request->get('sort_by', 'sort_order');
        $sortDir = $request->get('sort_dir', 'asc');
        $allowedSorts = ['name', 'category', 'sort_order', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single document template.
     *
     * GET /api/v1/document-templates/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $template = DocumentTemplate::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['document_template' => $template]);
    }

    /**
     * Create a new document template.
     *
     * POST /api/v1/document-templates
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'constituent_type' => ['nullable', 'string', 'max:50'],
            'content' => ['nullable', 'string'],
            'title' => ['nullable', 'string', 'max:255'],
            'salutation' => ['nullable', 'string', 'max:500'],
            'merge_fields' => ['nullable', 'array'],
            'custom_inputs' => ['nullable', 'array'],
            'custom_tables' => ['nullable', 'array'],
            'approval_config' => ['nullable', 'array'],
            'settings' => ['nullable', 'array'],
            'status' => ['nullable', 'in:active,inactive'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $template = DocumentTemplate::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'status' => $validated['status'] ?? 'active',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Document template created.',
            'document_template' => $template,
        ], 201);
    }

    /**
     * Update a document template.
     *
     * PUT /api/v1/document-templates/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $template = DocumentTemplate::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'category' => ['sometimes', 'string', 'max:100'],
            'constituent_type' => ['nullable', 'string', 'max:50'],
            'content' => ['nullable', 'string'],
            'title' => ['nullable', 'string', 'max:255'],
            'salutation' => ['nullable', 'string', 'max:500'],
            'merge_fields' => ['nullable', 'array'],
            'custom_inputs' => ['nullable', 'array'],
            'custom_tables' => ['nullable', 'array'],
            'approval_config' => ['nullable', 'array'],
            'settings' => ['nullable', 'array'],
            'status' => ['sometimes', 'in:active,inactive'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $validated['updated_by'] = $request->user()->id;
        $template->update($validated);

        return response()->json([
            'message' => 'Document template updated.',
            'document_template' => $template->fresh(),
        ]);
    }

    /**
     * Soft delete a document template.
     *
     * DELETE /api/v1/document-templates/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $template = DocumentTemplate::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $template->update(['deleted_by' => $request->user()->id]);
        $template->delete();

        return response()->json(['message' => 'Document template deleted.']);
    }
}
