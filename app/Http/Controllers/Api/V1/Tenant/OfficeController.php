<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Hris\Office;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfficeController extends Controller
{
    /**
     * GET /api/v1/offices
     */
    public function index(Request $request): JsonResponse
    {
        $offices = Office::where('barangay_id', $request->user()->barangay_id)
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $offices]);
    }

    /**
     * POST /api/v1/offices
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $office = Office::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
        ]);

        return response()->json(['office' => $office], 201);
    }

    /**
     * GET /api/v1/offices/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $office = Office::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['office' => $office]);
    }

    /**
     * PUT /api/v1/offices/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $office = Office::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $office->update($validated);

        return response()->json(['office' => $office->fresh()]);
    }

    /**
     * DELETE /api/v1/offices/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        Office::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id)
            ->delete();

        return response()->json(['message' => 'Office deleted.']);
    }
}
