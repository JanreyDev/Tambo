<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\PublicPortal\PublicComplaint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicComplaintController extends Controller
{
    /**
     * List public complaints with filters.
     * Note: store/destroy excluded from routes — complaints come from public portal.
     *
     * GET /api/v1/public-complaints
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = PublicComplaint::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('complaint_number', 'ilike', "%{$search}%")
                    ->orWhere('subject', 'ilike', "%{$search}%")
                    ->orWhere('complainant_name', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($category = $request->get('category')) {
            $query->where('category', $category);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['complaint_number', 'subject', 'status', 'category', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single public complaint.
     *
     * GET /api/v1/public-complaints/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $complaint = PublicComplaint::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['public_complaint' => $complaint]);
    }

    /**
     * Update a public complaint (status changes, assign, respond).
     *
     * PUT /api/v1/public-complaints/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $complaint = PublicComplaint::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'status' => ['sometimes', 'in:pending,in_progress,resolved,dismissed'],
            'assigned_to_id' => ['nullable', 'uuid'],
            'resolution' => ['nullable', 'string'],
            'category' => ['sometimes', 'string', 'max:100'],
        ]);

        $complaint->update($validated);

        return response()->json([
            'message' => 'Complaint updated.',
            'public_complaint' => $complaint->fresh(),
        ]);
    }
}
