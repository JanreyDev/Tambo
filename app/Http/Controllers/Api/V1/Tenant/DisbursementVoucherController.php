<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Finance\DisbursementVoucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DisbursementVoucherController extends Controller
{
    /**
     * List disbursement vouchers with search/filter/pagination.
     *
     * GET /api/v1/disbursement-vouchers
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = DisbursementVoucher::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('dv_number', 'ilike', "%{$search}%")
                  ->orWhere('payee', 'ilike', "%{$search}%")
                  ->orWhere('particulars', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($dvType = $request->get('dv_type')) {
            $query->where('dv_type', $dvType);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['dv_number', 'payee', 'amount', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single disbursement voucher.
     *
     * GET /api/v1/disbursement-vouchers/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $voucher = DisbursementVoucher::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['disbursement_voucher' => $voucher]);
    }

    /**
     * Create a new disbursement voucher.
     *
     * POST /api/v1/disbursement-vouchers
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'dv_type' => ['nullable', 'string', 'max:100'],
            'payee' => ['required', 'string', 'max:255'],
            'particulars' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0'],
            'fund_source' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:draft,pending,certified,approved,paid,cancelled'],
            'prepared_by_id' => ['nullable', 'uuid'],
            'certified_by_id' => ['nullable', 'uuid'],
            'approved_by_id' => ['nullable', 'uuid'],
            'check_number' => ['nullable', 'string', 'max:50'],
            'check_date' => ['nullable', 'date'],
            'bank_name' => ['nullable', 'string', 'max:255'],
        ]);

        $barangayId = $request->user()->barangay_id;

        // Auto-generate DV number
        $year = now()->format('Y');
        $lastDv = DisbursementVoucher::where('barangay_id', $barangayId)
            ->where('dv_number', 'ilike', "DV-{$year}-%")
            ->orderByRaw("CAST(SUBSTRING(dv_number FROM 'DV-\\d{4}-(\\d+)') AS INTEGER) DESC NULLS LAST")
            ->first();

        $nextSeq = $lastDv
            ? ((int) preg_replace('/^DV-\d{4}-/', '', $lastDv->dv_number)) + 1
            : 1;
        $dvNumber = "DV-{$year}-" . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

        $voucher = DisbursementVoucher::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'dv_number' => $dvNumber,
            'status' => $validated['status'] ?? 'draft',
        ]);

        return response()->json([
            'message' => 'Disbursement voucher created.',
            'disbursement_voucher' => $voucher,
        ], 201);
    }

    /**
     * Update a disbursement voucher.
     *
     * PUT /api/v1/disbursement-vouchers/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $voucher = DisbursementVoucher::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'dv_type' => ['nullable', 'string', 'max:100'],
            'payee' => ['sometimes', 'string', 'max:255'],
            'particulars' => ['sometimes', 'string'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'fund_source' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'in:draft,pending,certified,approved,paid,cancelled'],
            'certified_by_id' => ['nullable', 'uuid'],
            'approved_by_id' => ['nullable', 'uuid'],
            'approved_at' => ['nullable', 'date'],
            'check_number' => ['nullable', 'string', 'max:50'],
            'check_date' => ['nullable', 'date'],
            'bank_name' => ['nullable', 'string', 'max:255'],
        ]);

        $voucher->update($validated);

        return response()->json([
            'message' => 'Disbursement voucher updated.',
            'disbursement_voucher' => $voucher->fresh(),
        ]);
    }

    /**
     * Delete a disbursement voucher.
     *
     * DELETE /api/v1/disbursement-vouchers/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $voucher = DisbursementVoucher::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $voucher->delete();

        return response()->json(['message' => 'Disbursement voucher deleted.']);
    }
}
