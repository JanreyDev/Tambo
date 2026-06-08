<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Platform\AuditLog;
use App\Models\Tenant\Officials\BarangayOfficial;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class OfficialController extends Controller
{
    public function __construct(
        private readonly FileUploadService $fileUploadService,
    ) {}

    /**
     * Resolve the resident's photo_url from photoFile (only public files get a URL).
     */
    private function attachPhotoUrl(BarangayOfficial $official): void
    {
        if ($official->resident && $official->resident->relationLoaded('photoFile')) {
            $official->resident->photo_url = $official->resident->photoFile?->is_public
                ? $this->fileUploadService->getPublicUrl($official->resident->photoFile)
                : null;
        }
    }

    /**
     * List barangay officials with filters.
     *
     * GET /api/v1/officials
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = BarangayOfficial::where('barangay_id', $barangayId)
            ->with(['resident:id,first_name,middle_name,last_name,extension_name,mobile_number,email,photo_file_id', 'resident.photoFile:id,storage_path,is_public,storage_bucket']);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('position', 'ilike', "%{$search}%")
                    ->orWhere('committee', 'ilike', "%{$search}%");
            });
        }

        if ($position = $request->get('position')) {
            $query->where('position', $position);
        }

        if ($committee = $request->get('committee')) {
            $query->where('committee', $committee);
        }

        if ($request->has('is_active')) {
            $status = $request->boolean('is_active') ? 'active' : 'inactive';
            $query->where('status', $status);
        }

        $sortBy = $request->get('sort_by', 'sort_order');
        $sortDir = $request->get('sort_dir', 'asc');
        $allowedSorts = ['sort_order', 'position', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        $paginator = $query->paginate($perPage);
        $paginator->getCollection()->each(fn ($o) => $this->attachPhotoUrl($o));

        return response()->json($paginator);
    }

    /**
     * Get a single official.
     *
     * GET /api/v1/officials/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $official = BarangayOfficial::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['official' => $official]);
    }

    /**
     * Create a new barangay official record.
     *
     * POST /api/v1/officials
     */
    public function store(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $validated = $request->validate([
            // resident_id must exist AND belong to the same barangay (tenant isolation)
            'resident_id' => [
                'required',
                'uuid',
                Rule::exists('residents', 'id')->where('barangay_id', $barangayId),
            ],
            'position' => ['required', 'string', 'max:255'],
            'committees' => ['nullable', 'array'],
            'committees.*' => ['string', 'max:120'],
            'committee' => ['nullable', 'string', 'max:255'], // legacy, optional
            'is_elected' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
        ]);

        $official = BarangayOfficial::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'status' => $validated['status'] ?? 'active',
            'created_by' => $request->user()->id,
        ]);

        $official->load('resident:id,first_name,middle_name,last_name,extension_name,mobile_number,email,photo_file_id', 'resident.photoFile:id,storage_path,is_public,storage_bucket');
        $this->attachPhotoUrl($official);

        $this->audit($request, $official, 'official.created', ['data' => $validated]);

        return response()->json([
            'message' => 'Official created.',
            'official' => $official,
        ], 201);
    }

    /**
     * Update an official record.
     *
     * PUT /api/v1/officials/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $official = BarangayOfficial::where('barangay_id', $barangayId)
            ->findOrFail($id);

        $validated = $request->validate([
            'resident_id' => [
                'sometimes',
                'uuid',
                Rule::exists('residents', 'id')->where('barangay_id', $barangayId),
            ],
            'position' => ['sometimes', 'string', 'max:255'],
            'committees' => ['nullable', 'array'],
            'committees.*' => ['string', 'max:120'],
            'committee' => ['nullable', 'string', 'max:255'], // legacy, optional
            'is_elected' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'status' => ['sometimes', 'in:active,inactive,suspended'],
        ]);

        $beforeState = array_intersect_key($official->toArray(), $validated);
        $validated['updated_by'] = $request->user()->id;
        $official->update($validated);

        $this->audit($request, $official, 'official.updated', [
            'before' => $beforeState,
            'after' => array_intersect_key($official->fresh()->toArray(), $validated),
            'fields_changed' => array_keys($validated),
        ]);

        $updated = $official->fresh()->load('resident:id,first_name,middle_name,last_name,extension_name,mobile_number,email,photo_file_id', 'resident.photoFile:id,storage_path,is_public,storage_bucket');
        $this->attachPhotoUrl($updated);

        return response()->json([
            'message' => 'Official updated.',
            'official' => $updated,
        ]);
    }

    /**
     * Soft delete an official record.
     *
     * DELETE /api/v1/officials/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $official = BarangayOfficial::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $this->audit($request, $official, 'official.deleted', [
            'snapshot' => $official->toArray(),
        ]);

        $official->update(['deleted_by' => $request->user()->id]);
        $official->delete();

        return response()->json(['message' => 'Official deleted.']);
    }

    /**
     * Write an AuditLog row safely (never break the user save flow).
     */
    private function audit(Request $request, BarangayOfficial $official, string $action, array $changes = []): void
    {
        try {
            AuditLog::create([
                'barangay_id' => $official->barangay_id,
                'user_id' => $request->user()->id,
                'action' => $action,
                'resource_type' => 'barangay_official',
                'resource_id' => $official->id,
                'changes' => $changes,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'module' => 'settings',
            ]);
        } catch (\Throwable $e) {
            Log::warning("Audit log write failed for {$action}", [
                'official_id' => $official->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
