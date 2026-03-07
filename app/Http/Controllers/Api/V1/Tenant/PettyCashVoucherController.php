<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Finance\PettyCashVoucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PettyCashVoucherController extends Controller
{
    /**
     * List petty cash vouchers with filters.
     *
     * GET /api/v1/petty-cash-vouchers
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = PettyCashVoucher::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('pcv_number', 'ilike', "%{$search}%")
                  ->orWhere('payee', 'ilike', "%{$search}%")
                  ->orWhere('particulars', 'ilike', "%{$search}%");
            });
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
        $allowedSorts = ['pcv_number', 'date', 'amount', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Create a new petty cash voucher.
     *
     * POST /api/v1/petty-cash-vouchers
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'payee' => ['required', 'string', 'max:255'],
            'particulars' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:draft,approved,paid,cancelled'],
        ]);

        $barangayId = $request->user()->barangay_id;

        // Auto-generate PCV number
        $year = now()->format('Y');
        $lastPcv = PettyCashVoucher::where('barangay_id', $barangayId)
            ->where('pcv_number', 'ilike', "PCV-{$year}-%")
            ->orderByRaw("CAST(SUBSTRING(pcv_number FROM 'PCV-\\d{4}-(\\d+)') AS INTEGER) DESC NULLS LAST")
            ->first();

        $nextSeq = $lastPcv
            ? ((int) preg_replace('/^PCV-\d{4}-/', '', $lastPcv->pcv_number)) + 1
            : 1;
        $pcvNumber = "PCV-{$year}-" . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

        $voucher = PettyCashVoucher::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'pcv_number' => $pcvNumber,
            'status' => $validated['status'] ?? 'draft',
        ]);

        return response()->json([
            'message' => 'Petty cash voucher created.',
            'petty_cash_voucher' => $voucher,
        ], 201);
    }

    /**
     * Update a petty cash voucher.
     *
     * PUT /api/v1/petty-cash-vouchers/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $voucher = PettyCashVoucher::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'date' => ['sometimes', 'date'],
            'payee' => ['sometimes', 'string', 'max:255'],
            'particulars' => ['sometimes', 'string'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:draft,approved,paid,cancelled'],
        ]);

        $voucher->update($validated);

        return response()->json([
            'message' => 'Petty cash voucher updated.',
            'petty_cash_voucher' => $voucher->fresh(),
        ]);
    }

    /**
     * Delete a petty cash voucher.
     *
     * DELETE /api/v1/petty-cash-vouchers/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $voucher = PettyCashVoucher::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $voucher->delete();

        return response()->json(['message' => 'Petty cash voucher deleted.']);
    }
}
