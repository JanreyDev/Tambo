<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Records\Establishment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EstablishmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = Establishment::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('owner_name', 'ilike', "%{$search}%")
                  ->orWhere('establishment_number', 'ilike', "%{$search}%")
                  ->orWhere('business_type', 'ilike', "%{$search}%");
            });
        }

        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $sortBy = $request->get('sort_by', 'name');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $establishment = Establishment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['establishment' => $establishment]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:100'],
            'business_type' => ['nullable', 'string', 'max:255'],
            'owner_name' => ['required', 'string', 'max:255'],
            'owner_contact_number' => ['nullable', 'string', 'max:20'],
            'owner_email' => ['nullable', 'email', 'max:255'],
            'owner_address' => ['nullable', 'string', 'max:500'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'purok' => ['nullable', 'string', 'max:255'],
            'street' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'dti_sec_registration_number' => ['nullable', 'string', 'max:100'],
            'business_permit_number' => ['nullable', 'string', 'max:100'],
            'permit_expiry_date' => ['nullable', 'date'],
            'operating_hours' => ['nullable', 'string', 'max:255'],
            'employee_count' => ['nullable', 'integer', 'min:0'],
        ]);

        $barangayId = $request->user()->barangay_id;

        $lastNumber = Establishment::where('barangay_id', $barangayId)
            ->max('establishment_number');
        $nextNumber = $lastNumber
            ? str_pad((string) ((int) $lastNumber + 1), 6, '0', STR_PAD_LEFT)
            : '000001';

        $establishment = Establishment::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'establishment_number' => $nextNumber,
            'status' => 'active',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Establishment created.',
            'establishment' => $establishment,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $establishment = Establishment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:100'],
            'business_type' => ['nullable', 'string', 'max:255'],
            'owner_name' => ['sometimes', 'string', 'max:255'],
            'owner_contact_number' => ['nullable', 'string', 'max:20'],
            'owner_email' => ['nullable', 'email', 'max:255'],
            'owner_address' => ['nullable', 'string', 'max:500'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'purok' => ['nullable', 'string', 'max:255'],
            'street' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'status' => ['sometimes', 'in:active,inactive,closed'],
        ]);

        $validated['updated_by'] = $request->user()->id;
        $establishment->update($validated);

        return response()->json([
            'message' => 'Establishment updated.',
            'establishment' => $establishment->fresh(),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $establishment = Establishment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $establishment->update(['deleted_by' => $request->user()->id]);
        $establishment->delete();

        return response()->json(['message' => 'Establishment deleted.']);
    }
}
