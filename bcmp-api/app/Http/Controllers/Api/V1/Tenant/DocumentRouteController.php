<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Documents\DocumentRoute;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentRouteController extends Controller
{
    /**
     * List document routes with filters.
     *
     * GET /api/v1/document-routes
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = DocumentRoute::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('document_title', 'ilike', "%{$search}%")
                    ->orWhere('reference_number', 'ilike', "%{$search}%");
            });
        }

        if ($documentType = $request->get('document_type')) {
            $query->where('document_type', $documentType);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['document_title', 'reference_number', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single document route.
     *
     * GET /api/v1/document-routes/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $route = DocumentRoute::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['document_route' => $route]);
    }

    /**
     * Create a new document route entry.
     *
     * POST /api/v1/document-routes
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'document_title' => ['required', 'string', 'max:255'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'document_type' => ['nullable', 'string', 'max:100'],
            'origin' => ['nullable', 'string', 'max:255'],
            'from_office' => ['nullable', 'string', 'max:255'],
            'to_office' => ['nullable', 'string', 'max:255'],
            'current_holder_id' => ['nullable', 'uuid'],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'status' => ['nullable', 'in:pending,in_transit,received,completed,returned'],
            'attachment_file_ids' => ['nullable', 'array'],
            'route_history' => ['nullable', 'array'],
        ]);

        $route = DocumentRoute::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'status' => $validated['status'] ?? 'pending',
        ]);

        return response()->json([
            'message' => 'Document route created.',
            'document_route' => $route,
        ], 201);
    }

    /**
     * Update a document route.
     *
     * PUT /api/v1/document-routes/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $route = DocumentRoute::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'document_title' => ['sometimes', 'string', 'max:255'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'document_type' => ['nullable', 'string', 'max:100'],
            'from_office' => ['nullable', 'string', 'max:255'],
            'to_office' => ['nullable', 'string', 'max:255'],
            'current_holder_id' => ['nullable', 'uuid'],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'status' => ['sometimes', 'in:pending,in_transit,received,completed,returned'],
            'attachment_file_ids' => ['nullable', 'array'],
            'route_history' => ['nullable', 'array'],
        ]);

        $route->update($validated);

        return response()->json([
            'message' => 'Document route updated.',
            'document_route' => $route->fresh(),
        ]);
    }

    /**
     * Delete a document route.
     *
     * DELETE /api/v1/document-routes/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $route = DocumentRoute::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $route->delete();

        return response()->json(['message' => 'Document route deleted.']);
    }
}
