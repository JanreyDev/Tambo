<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Finance\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /**
     * List payments with search/filter/pagination.
     *
     * GET /api/v1/payments
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = Payment::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('or_number', 'ilike', "%{$search}%")
                  ->orWhere('payer_name', 'ilike', "%{$search}%")
                  ->orWhere('reference_number', 'ilike', "%{$search}%");
            });
        }

        if ($paymentType = $request->get('payment_type')) {
            $query->where('payment_type', $paymentType);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($dateFrom = $request->get('date_from')) {
            $query->where('date', '>=', $dateFrom);
        }

        if ($dateTo = $request->get('date_to')) {
            $query->where('date', '<=', $dateTo);
        }

        $sortBy = $request->get('sort_by', 'date');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['or_number', 'payer_name', 'amount', 'date', 'payment_type', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single payment.
     *
     * GET /api/v1/payments/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $payment = Payment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['payment' => $payment]);
    }

    /**
     * Create a new payment record.
     *
     * POST /api/v1/payments
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_type' => ['required', 'string', 'max:100'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'date' => ['required', 'date'],
            'payer_name' => ['required', 'string', 'max:255'],
            'payer_resident_id' => ['nullable', 'uuid'],
            'amount' => ['required', 'numeric', 'min:0'],
            'or_number' => ['required', 'string', 'max:50'],
            'remarks' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', 'in:paid,cancelled,refunded'],
        ]);

        $payment = Payment::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'status' => $validated['status'] ?? 'paid',
        ]);

        return response()->json([
            'message' => 'Payment recorded.',
            'payment' => $payment,
        ], 201);
    }

    /**
     * Update a payment record.
     *
     * PUT /api/v1/payments/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $payment = Payment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'payment_type' => ['sometimes', 'string', 'max:100'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'payer_name' => ['sometimes', 'string', 'max:255'],
            'payer_resident_id' => ['nullable', 'uuid'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'remarks' => ['nullable', 'string', 'max:500'],
            'status' => ['sometimes', 'in:paid,cancelled,refunded'],
        ]);

        $payment->update($validated);

        return response()->json([
            'message' => 'Payment updated.',
            'payment' => $payment->fresh(),
        ]);
    }

    /**
     * Delete a payment record.
     *
     * DELETE /api/v1/payments/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $payment = Payment::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $payment->delete();

        return response()->json(['message' => 'Payment deleted.']);
    }
}
