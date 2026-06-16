<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Gad\GadPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GadPlanController extends Controller
{
    /**
     * List GAD plans with filters.
     *
     * GET /api/v1/gad-plans
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = GadPlan::where('barangay_id', $barangayId);

        if ($fiscalYear = $request->get('fiscal_year')) {
            $query->where('fiscal_year', (int) $fiscalYear);
        }

        if ($planType = $request->get('plan_type')) {
            $query->where('plan_type', $planType);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $sortBy = $request->get('sort_by', 'fiscal_year');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['fiscal_year', 'plan_type', 'gad_budget', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single GAD plan.
     *
     * GET /api/v1/gad-plans/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $plan = GadPlan::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['gad_plan' => $plan]);
    }

    /**
     * Create a new GAD plan.
     *
     * POST /api/v1/gad-plans
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_type' => ['required', 'string', 'max:100'],
            'fiscal_year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'barangay_total_budget' => ['nullable', 'numeric', 'min:0'],
            'gad_budget' => ['required', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:draft,submitted,approved,implemented'],
        ]);

        $plan = GadPlan::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'status' => $validated['status'] ?? 'draft',
        ]);

        return response()->json([
            'message' => 'GAD plan created.',
            'gad_plan' => $plan,
        ], 201);
    }

    /**
     * Update a GAD plan.
     *
     * PUT /api/v1/gad-plans/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $plan = GadPlan::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'plan_type' => ['sometimes', 'string', 'max:100'],
            'fiscal_year' => ['sometimes', 'integer', 'min:2000', 'max:2100'],
            'barangay_total_budget' => ['nullable', 'numeric', 'min:0'],
            'gad_budget' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:draft,submitted,approved,implemented'],
            'approved_by_id' => ['nullable', 'uuid'],
            'approved_at' => ['nullable', 'date'],
        ]);

        $plan->update($validated);

        return response()->json([
            'message' => 'GAD plan updated.',
            'gad_plan' => $plan->fresh(),
        ]);
    }

    /**
     * Delete a GAD plan.
     *
     * DELETE /api/v1/gad-plans/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $plan = GadPlan::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $plan->delete();

        return response()->json(['message' => 'GAD plan deleted.']);
    }
}
