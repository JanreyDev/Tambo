<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Finance\CollectionsDeposit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CollectionsDepositController extends Controller
{
    /**
     * List collections deposits with filters.
     *
     * GET /api/v1/collections-deposits
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = CollectionsDeposit::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('deposit_slip_number', 'ilike', "%{$search}%")
                    ->orWhere('bank_name', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($dateFrom = $request->get('date_from')) {
            $query->where('report_date', '>=', $dateFrom);
        }

        if ($dateTo = $request->get('date_to')) {
            $query->where('report_date', '<=', $dateTo);
        }

        $sortBy = $request->get('sort_by', 'report_date');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['report_date', 'collection_amount', 'deposit_amount', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Create a new collections deposit record.
     *
     * POST /api/v1/collections-deposits
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'report_date' => ['required', 'date'],
            'collection_amount' => ['required', 'numeric', 'min:0'],
            'deposit_amount' => ['required', 'numeric', 'min:0'],
            'bank_name' => ['required', 'string', 'max:255'],
            'deposit_slip_number' => ['nullable', 'string', 'max:100'],
            'prepared_by_id' => ['nullable', 'uuid'],
            'status' => ['nullable', 'in:draft,deposited,verified'],
        ]);

        $deposit = CollectionsDeposit::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'status' => $validated['status'] ?? 'draft',
        ]);

        return response()->json([
            'message' => 'Collections deposit created.',
            'collections_deposit' => $deposit,
        ], 201);
    }

    /**
     * Update a collections deposit.
     *
     * PUT /api/v1/collections-deposits/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $deposit = CollectionsDeposit::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'report_date' => ['sometimes', 'date'],
            'collection_amount' => ['sometimes', 'numeric', 'min:0'],
            'deposit_amount' => ['sometimes', 'numeric', 'min:0'],
            'bank_name' => ['sometimes', 'string', 'max:255'],
            'deposit_slip_number' => ['nullable', 'string', 'max:100'],
            'prepared_by_id' => ['nullable', 'uuid'],
            'status' => ['sometimes', 'in:draft,deposited,verified'],
        ]);

        $deposit->update($validated);

        return response()->json([
            'message' => 'Collections deposit updated.',
            'collections_deposit' => $deposit->fresh(),
        ]);
    }

    /**
     * Delete a collections deposit.
     *
     * DELETE /api/v1/collections-deposits/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $deposit = CollectionsDeposit::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $deposit->delete();

        return response()->json(['message' => 'Collections deposit deleted.']);
    }
}
