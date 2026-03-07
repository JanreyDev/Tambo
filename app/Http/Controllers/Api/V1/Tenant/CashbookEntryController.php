<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Finance\CashbookEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CashbookEntryController extends Controller
{
    /**
     * List cashbook entries with filters.
     *
     * GET /api/v1/cashbook-entries
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = CashbookEntry::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'ilike', "%{$search}%")
                  ->orWhere('reference_type', 'ilike', "%{$search}%");
            });
        }

        if ($fundType = $request->get('fund_type')) {
            $query->where('fund_type', $fundType);
        }

        if ($dateFrom = $request->get('date_from')) {
            $query->where('entry_date', '>=', $dateFrom);
        }

        if ($dateTo = $request->get('date_to')) {
            $query->where('entry_date', '<=', $dateTo);
        }

        $sortBy = $request->get('sort_by', 'entry_date');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['entry_date', 'debit', 'credit', 'balance', 'fund_type', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Create a new cashbook entry.
     *
     * POST /api/v1/cashbook-entries
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entry_date' => ['required', 'date'],
            'description' => ['required', 'string', 'max:500'],
            'reference_type' => ['nullable', 'string', 'max:100'],
            'reference_id' => ['nullable', 'uuid'],
            'debit' => ['nullable', 'numeric', 'min:0'],
            'credit' => ['nullable', 'numeric', 'min:0'],
            'balance' => ['nullable', 'numeric'],
            'fund_type' => ['nullable', 'string', 'max:100'],
        ]);

        $entry = CashbookEntry::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
        ]);

        return response()->json([
            'message' => 'Cashbook entry created.',
            'cashbook_entry' => $entry,
        ], 201);
    }

    /**
     * Update a cashbook entry.
     *
     * PUT /api/v1/cashbook-entries/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $entry = CashbookEntry::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'entry_date' => ['sometimes', 'date'],
            'description' => ['sometimes', 'string', 'max:500'],
            'reference_type' => ['nullable', 'string', 'max:100'],
            'reference_id' => ['nullable', 'uuid'],
            'debit' => ['nullable', 'numeric', 'min:0'],
            'credit' => ['nullable', 'numeric', 'min:0'],
            'balance' => ['nullable', 'numeric'],
            'fund_type' => ['nullable', 'string', 'max:100'],
        ]);

        $entry->update($validated);

        return response()->json([
            'message' => 'Cashbook entry updated.',
            'cashbook_entry' => $entry->fresh(),
        ]);
    }

    /**
     * Delete a cashbook entry.
     *
     * DELETE /api/v1/cashbook-entries/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $entry = CashbookEntry::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $entry->delete();

        return response()->json(['message' => 'Cashbook entry deleted.']);
    }
}
