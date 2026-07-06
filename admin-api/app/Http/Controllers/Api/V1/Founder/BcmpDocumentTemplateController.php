<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Founder;

use App\Http\Controllers\Controller;
use App\Services\BcmpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Proxy controller for BCMP system document template management.
 *
 * Forwards requests from the founder dashboard to bcmp-api using the
 * stored super-admin token (primex_admin). Because that user has
 * barangay_id = null, templates created/modified here are automatically
 * system-level (barangay_id = null) and visible to ALL barangay tenants.
 *
 * This is the master list — any template added here propagates to every
 * barangay automatically via the bcmp-api inclusive query:
 *   WHERE barangay_id = {tenant} OR barangay_id IS NULL
 */
class BcmpDocumentTemplateController extends Controller
{
    /** Fields allowed to pass through to bcmp-api (whitelist). */
    private const ALLOWED_FIELDS = [
        'name',
        'category',
        'constituent_type',
        'content',
        'title',
        'salutation',
        'merge_fields',
        'custom_inputs',
        'custom_tables',
        'approval_config',
        'settings',
        'status',
        'sort_order',
    ];

    public function __construct(private readonly BcmpService $bcmp) {}

    /**
     * List all system document templates.
     *
     * GET /api/v1/founder/bcmp/document-templates
     */
    public function index(Request $request): JsonResponse
    {
        $query = array_filter([
            'search' => $request->get('search'),
            'category' => $request->get('category'),
            'per_page' => $request->get('per_page', 100),
            'sort_by' => $request->get('sort_by', 'sort_order'),
            'sort_dir' => $request->get('sort_dir', 'asc'),
        ], fn ($v) => $v !== null && $v !== '');

        $result = $this->bcmp->get('api/v1/document-templates', $query);

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Get a single system document template.
     *
     * GET /api/v1/founder/bcmp/document-templates/{id}
     */
    public function show(string $id): JsonResponse
    {
        $result = $this->bcmp->get("api/v1/document-templates/{$id}");

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Create a new system document template.
     * barangay_id will be null because super-admin has no barangay.
     *
     * POST /api/v1/founder/bcmp/document-templates
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->only(self::ALLOWED_FIELDS);
        $result = $this->bcmp->post('api/v1/document-templates', $data);

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Update a system document template.
     *
     * PATCH /api/v1/founder/bcmp/document-templates/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $data = $request->only(self::ALLOWED_FIELDS);
        $result = $this->bcmp->patch("api/v1/document-templates/{$id}", $data);

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Archive / soft-delete a system document template.
     *
     * DELETE /api/v1/founder/bcmp/document-templates/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $result = $this->bcmp->delete("api/v1/document-templates/{$id}");

        return response()->json($result['data'], $result['status']);
    }
}
