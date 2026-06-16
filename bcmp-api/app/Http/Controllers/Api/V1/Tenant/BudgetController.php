<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Finance\Budget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    /**
     * List budgets with filters.
     *
     * GET /api/v1/budgets
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = Budget::where('barangay_id', $barangayId);

        if ($fiscalYear = $request->get('fiscal_year')) {
            $query->where('fiscal_year', (int) $fiscalYear);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $sortBy = $request->get('sort_by', 'fiscal_year');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['fiscal_year', 'appropriation', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single budget record.
     *
     * GET /api/v1/budgets/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $budget = Budget::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['budget' => $budget]);
    }

    /**
     * Create a new budget record.
     *
     * POST /api/v1/budgets
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fiscal_year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'appropriation' => ['required', 'numeric', 'min:0'],
            'allotment' => ['nullable', 'numeric', 'min:0'],
            'obligations' => ['nullable', 'numeric', 'min:0'],
            'unobligated' => ['nullable', 'numeric', 'min:0'],
            'beginning_cash_treasury' => ['nullable', 'numeric', 'min:0'],
            'beginning_cash_bank' => ['nullable', 'numeric', 'min:0'],
            'beginning_cash_advance' => ['nullable', 'numeric', 'min:0'],
            'beginning_petty_cash' => ['nullable', 'numeric', 'min:0'],
            'gad_budget' => ['nullable', 'numeric', 'min:0'],
            'sk_budget' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:draft,approved,enacted'],
        ]);

        $budget = Budget::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'status' => $validated['status'] ?? 'draft',
        ]);

        return response()->json([
            'message' => 'Budget created.',
            'budget' => $budget,
        ], 201);
    }

    /**
     * Update a budget record.
     *
     * PUT /api/v1/budgets/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $budget = Budget::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'fiscal_year' => ['sometimes', 'integer', 'min:2000', 'max:2100'],
            'appropriation' => ['sometimes', 'numeric', 'min:0'],
            'allotment' => ['nullable', 'numeric', 'min:0'],
            'obligations' => ['nullable', 'numeric', 'min:0'],
            'unobligated' => ['nullable', 'numeric', 'min:0'],
            'beginning_cash_treasury' => ['nullable', 'numeric', 'min:0'],
            'beginning_cash_bank' => ['nullable', 'numeric', 'min:0'],
            'beginning_cash_advance' => ['nullable', 'numeric', 'min:0'],
            'beginning_petty_cash' => ['nullable', 'numeric', 'min:0'],
            'gad_budget' => ['nullable', 'numeric', 'min:0'],
            'sk_budget' => ['nullable', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:draft,approved,enacted'],
            'approved_by_id' => ['nullable', 'uuid'],
            'approved_at' => ['nullable', 'date'],
        ]);

        $budget->update($validated);

        return response()->json([
            'message' => 'Budget updated.',
            'budget' => $budget->fresh(),
        ]);
    }

    /**
     * Delete a budget record.
     *
     * DELETE /api/v1/budgets/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $budget = Budget::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $budget->delete();

        return response()->json(['message' => 'Budget deleted.']);
    }
}
