<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\PublicPortal\PublicDocumentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicDocumentRequestController extends Controller
{
    /**
     * List public document requests with filters.
     * Note: store/destroy excluded from routes — requests come from public portal.
     *
     * GET /api/v1/public-document-requests
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = PublicDocumentRequest::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('request_number', 'ilike', "%{$search}%")
                  ->orWhere('requester_name', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($documentType = $request->get('document_type')) {
            $query->where('document_type', $documentType);
        }

        if ($paymentStatus = $request->get('payment_status')) {
            $query->where('payment_status', $paymentStatus);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['request_number', 'document_type', 'status', 'estimated_date', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single public document request.
     *
     * GET /api/v1/public-document-requests/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $docRequest = PublicDocumentRequest::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['public_document_request' => $docRequest]);
    }

    /**
     * Update a public document request (status changes, processing notes).
     *
     * PUT /api/v1/public-document-requests/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $docRequest = PublicDocumentRequest::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'status' => ['sometimes', 'in:pending,processing,ready,released,cancelled'],
            'estimated_date' => ['nullable', 'date'],
            'fee_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['sometimes', 'in:unpaid,paid,waived'],
            'issued_document_id' => ['nullable', 'uuid'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $docRequest->update($validated);

        return response()->json([
            'message' => 'Document request updated.',
            'public_document_request' => $docRequest->fresh(),
        ]);
    }
}
