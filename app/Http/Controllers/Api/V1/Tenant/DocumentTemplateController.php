<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Platform\AuditLog;
use App\Models\Tenant\Documents\DocumentTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class DocumentTemplateController extends Controller
{
    // Category is intentionally free-form (max:50) — seeded data uses per-template slugs
    // like business_clearance_new, vehicle_clearance, late_registration. Both founder and
    // tenant UIs render their own curated dropdowns; BE just stores the value.

    private const VALID_CONSTITUENT_TYPES = [
        'resident', 'establishment', 'lot_building', 'case',
    ];

    private const VALID_STATUSES = ['draft', 'active', 'published', 'archived'];

    /**
     * List document templates — barangay's own + system defaults.
     *
     * GET /api/v1/document-templates
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = DocumentTemplate::query()
            ->where(function ($q) use ($barangayId) {
                $q->whereNull('barangay_id')        // system defaults
                  ->orWhere('barangay_id', $barangayId); // own
            });

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('title', 'ilike', "%{$search}%");
            });
        }

        if ($category = $request->get('category')) {
            $query->where('category', $category);
        }

        if ($constituentType = $request->get('constituent_type')) {
            $query->where('constituent_type', $constituentType);
        }

        if ($request->has('is_active')) {
            if ($request->boolean('is_active')) {
                $query->whereIn('status', ['active', 'published']);
            } else {
                $query->whereNotIn('status', ['active', 'published']);
            }
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        // 'owned' filter: only barangay's own (skip system defaults)
        if ($request->boolean('owned_only')) {
            $query->where('barangay_id', $barangayId);
        }

        // 'system' filter: only system defaults
        if ($request->boolean('system_only')) {
            $query->whereNull('barangay_id');
        }

        $sortBy = $request->get('sort_by', 'sort_order');
        $sortDir = $request->get('sort_dir', 'asc') === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['sort_order', 'name', 'category', 'created_at', 'updated_at'];

        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('sort_order', 'asc');
        }
        $query->orderBy('name', 'asc'); // tie-breaker

        $perPage = min((int) $request->get('per_page', 50), 200);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single template — must be system default or owned by current barangay.
     *
     * GET /api/v1/document-templates/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $template = DocumentTemplate::query()
            ->where('id', $id)
            ->where(function ($q) use ($barangayId) {
                $q->whereNull('barangay_id')
                  ->orWhere('barangay_id', $barangayId);
            })
            ->firstOrFail();

        return response()->json(['document_template' => $template]);
    }

    /**
     * Create a new template owned by the current barangay.
     *
     * POST /api/v1/document-templates
     */
    public function store(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $validated = $this->validatePayload($request, $barangayId, null);

        $template = DocumentTemplate::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'status' => $validated['status'] ?? 'active',
            'created_by' => $request->user()->id,
        ]);

        $this->audit($request, $template, 'document_template.created', [
            'data' => $validated,
        ]);

        return response()->json([
            'message' => 'Certificate type created.',
            'document_template' => $template,
        ], 201);
    }

    /**
     * Update a template — own only for tenants, system-only for super-admin (barangay_id = NULL).
     *
     * PUT /api/v1/document-templates/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $template = $this->scopeToOwner(
            DocumentTemplate::query()->where('id', $id),
            $barangayId,
        )->firstOrFail();

        $validated = $this->validatePayload($request, $barangayId, $template->id);

        $beforeState = array_intersect_key($template->toArray(), $validated);

        $validated['updated_by'] = $request->user()->id;
        $template->update($validated);

        $this->audit($request, $template, 'document_template.updated', [
            'before' => $beforeState,
            'after' => array_intersect_key($template->fresh()->toArray(), $validated),
            'fields_changed' => array_keys($validated),
        ]);

        return response()->json([
            'message' => 'Certificate type updated.',
            'document_template' => $template->fresh(),
        ]);
    }

    /**
     * Soft delete a template — own only for tenants, system-only for super-admin.
     *
     * DELETE /api/v1/document-templates/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $template = $this->scopeToOwner(
            DocumentTemplate::query()->where('id', $id),
            $barangayId,
        )->firstOrFail();

        $this->audit($request, $template, 'document_template.deleted', [
            'snapshot' => $template->toArray(),
        ]);

        $template->update(['deleted_by' => $request->user()->id]);
        $template->delete();

        return response()->json(['message' => 'Certificate type deleted.']);
    }

    /**
     * Clone a system or owned template into a new barangay-owned copy.
     * Used by Stage 3 "Add from standards" — barangay activates a system template.
     *
     * POST /api/v1/document-templates/{id}/clone
     */
    public function clone(Request $request, string $id): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $source = DocumentTemplate::query()
            ->where('id', $id)
            ->where(function ($q) use ($barangayId) {
                $q->whereNull('barangay_id')
                  ->orWhere('barangay_id', $barangayId);
            })
            ->firstOrFail();

        $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        $newName = $request->get('name') ?: $this->uniqueName($source->name, $barangayId);

        $clone = DocumentTemplate::create([
            'barangay_id' => $barangayId,
            'name' => $newName,
            'category' => $source->category,
            'constituent_type' => $source->constituent_type,
            'title' => $source->title,
            'salutation' => $source->salutation,
            'content' => $source->content,
            'merge_fields' => $source->merge_fields,
            'custom_inputs' => $source->custom_inputs,
            'custom_tables' => $source->custom_tables,
            'approval_config' => $source->approval_config,
            'settings' => $source->settings,
            'status' => 'active',
            'sort_order' => $source->sort_order,
            'created_by' => $request->user()->id,
        ]);

        $this->audit($request, $clone, 'document_template.cloned', [
            'source_id' => $source->id,
            'source_name' => $source->name,
            'source_was_system' => $source->barangay_id === null,
        ]);

        return response()->json([
            'message' => "\"{$clone->name}\" added.",
            'document_template' => $clone,
        ], 201);
    }

    /**
     * Validation rules shared by store + update.
     * $barangayId may be null when the actor is super-admin acting on system templates.
     */
    private function validatePayload(Request $request, ?string $barangayId, ?string $templateId): array
    {
        $isCreate = $templateId === null;
        $required = $isCreate ? 'required' : 'sometimes';

        return $request->validate([
            'name' => [
                $required, 'string', 'max:255',
                Rule::unique('document_templates', 'name')
                    ->where(fn ($q) => $barangayId
                        ? $q->where('barangay_id', $barangayId)->whereNull('deleted_at')
                        : $q->whereNull('barangay_id')->whereNull('deleted_at')
                    )
                    ->ignore($templateId),
            ],
            'category' => [$required, 'string', 'max:50'],
            'constituent_type' => [$required, 'string', Rule::in(self::VALID_CONSTITUENT_TYPES)],
            'title' => ['nullable', 'string', 'max:255'],
            'salutation' => ['nullable', 'string', 'max:1000'],
            'content' => ['nullable', 'string', 'max:50000'],

            'merge_fields' => ['nullable', 'array'],
            'merge_fields.*' => ['string', 'max:64'],

            'custom_inputs' => ['nullable', 'array'],
            'custom_inputs.*.name' => ['required_with:custom_inputs', 'string', 'max:64'],
            'custom_inputs.*.type' => ['required_with:custom_inputs', 'string', Rule::in(['text', 'textarea', 'number', 'date', 'select', 'checkbox'])],
            'custom_inputs.*.label' => ['nullable', 'string', 'max:120'],
            'custom_inputs.*.required' => ['nullable', 'boolean'],
            'custom_inputs.*.options' => ['nullable', 'array'],

            'custom_tables' => ['nullable', 'array'],

            'approval_config' => ['nullable', 'array'],
            'approval_config.left' => ['nullable', 'array'],
            'approval_config.left.label' => ['nullable', 'string', 'max:120'],
            'approval_config.left.position' => ['nullable', 'string', 'max:120'],
            'approval_config.right' => ['nullable', 'array'],
            'approval_config.right.label' => ['nullable', 'string', 'max:120'],
            'approval_config.right.position' => ['nullable', 'string', 'max:120'],

            'settings' => ['nullable', 'array'],
            'settings.show_qr' => ['nullable', 'boolean'],
            'settings.show_ctc' => ['nullable', 'boolean'],
            'settings.show_doc_no' => ['nullable', 'boolean'],
            'settings.show_or' => ['nullable', 'boolean'],
            'settings.show_expiry' => ['nullable', 'boolean'],
            'settings.expiry_months' => ['nullable', 'integer', 'min:1', 'max:120'],

            'settings.use_global_design' => ['nullable', 'boolean'],
            'settings.document_layout' => ['nullable', 'string', 'max:50'],
            'settings.document_color_theme' => ['nullable', 'string', 'max:50'],
            'settings.document_design_pattern' => ['nullable', 'string', 'max:50'],
            'settings.document_font' => ['nullable', 'string', 'max:50'],

            'status' => ['nullable', Rule::in(self::VALID_STATUSES)],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ]);
    }

    /**
     * Compute a unique name within the actor's scope (own barangay, or system if super-admin).
     */
    private function uniqueName(string $base, ?string $barangayId): string
    {
        $candidate = $base;
        $suffix = 1;

        while ($this->scopeToOwner(DocumentTemplate::query(), $barangayId)
            ->where('name', $candidate)
            ->exists()
        ) {
            $suffix++;
            $candidate = $suffix === 2 ? "{$base} (Copy)" : "{$base} (Copy {$suffix})";
        }

        return $candidate;
    }

    /**
     * Scope a query to "owner's templates only" — own barangay for tenants,
     * system-level (barangay_id = NULL) for super-admin.
     */
    private function scopeToOwner($query, ?string $barangayId)
    {
        return $barangayId
            ? $query->where('barangay_id', $barangayId)
            : $query->whereNull('barangay_id');
    }

    /**
     * Write an AuditLog row safely.
     */
    private function audit(Request $request, DocumentTemplate $template, string $action, array $changes = []): void
    {
        try {
            AuditLog::create([
                'barangay_id' => $template->barangay_id ?? $request->user()->barangay_id,
                'user_id' => $request->user()->id,
                'action' => $action,
                'resource_type' => 'document_template',
                'resource_id' => $template->id,
                'changes' => $changes,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'module' => 'documents',
            ]);
        } catch (\Throwable $e) {
            Log::warning("Audit log write failed for {$action}", [
                'template_id' => $template->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
