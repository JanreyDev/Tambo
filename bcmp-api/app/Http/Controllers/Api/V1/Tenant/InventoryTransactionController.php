<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Assets\InventoryTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryTransactionController extends Controller
{
    /**
     * List inventory transactions with filters.
     *
     * GET /api/v1/inventory-transactions
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = InventoryTransaction::where('barangay_id', $barangayId);

        if ($itemId = $request->get('item_id')) {
            $query->where('item_id', $itemId);
        }

        if ($transactionType = $request->get('transaction_type')) {
            $query->where('transaction_type', $transactionType);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['transaction_type', 'quantity', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Create a new inventory transaction.
     *
     * POST /api/v1/inventory-transactions
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_id' => ['required', 'uuid'],
            'transaction_type' => ['required', 'in:in,out,adjustment'],
            'quantity' => ['required', 'integer'],
            'reference' => ['nullable', 'string', 'max:255'],
            'performed_by_id' => ['nullable', 'uuid'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $transaction = InventoryTransaction::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'performed_by_id' => $validated['performed_by_id'] ?? $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Inventory transaction recorded.',
            'inventory_transaction' => $transaction,
        ], 201);
    }

    /**
     * Delete an inventory transaction.
     *
     * DELETE /api/v1/inventory-transactions/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $transaction = InventoryTransaction::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $transaction->delete();

        return response()->json(['message' => 'Inventory transaction deleted.']);
    }
}
