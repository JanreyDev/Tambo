<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Platform\SmsTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SmsTransactionController extends Controller
{
    /**
     * List SMS transactions for the current barangay.
     *
     * GET /api/v1/sms-transactions
     *
     * Query params:
     *   - status: sent|failed|queued (filter by status)
     *   - source: password_reset|phone_verification|notification|manual (filter by source)
     *   - from: YYYY-MM-DD (filter from date)
     *   - to: YYYY-MM-DD (filter to date)
     *   - per_page: int (default 25, max 100)
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = SmsTransaction::where('barangay_id', $barangayId)
            ->orderByDesc('created_at');

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('source')) {
            $query->where('source', $request->input('source'));
        }

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->input('to'));
        }

        $perPage = min((int) $request->input('per_page', 25), 100);

        $transactions = $query->paginate($perPage);

        // Mask phone numbers in response
        $transactions->getCollection()->transform(function ($tx) {
            $tx->recipient_phone = substr($tx->recipient_phone, 0, 4).'****'.substr($tx->recipient_phone, -2);
            // Don't expose full message content in list view (may contain OTP)
            $tx->message_preview = mb_substr($tx->message, 0, 50).(mb_strlen($tx->message) > 50 ? '...' : '');
            unset($tx->message);
            unset($tx->provider_response);

            return $tx;
        });

        return response()->json($transactions);
    }

    /**
     * Get SMS transaction summary/stats for the current barangay.
     *
     * GET /api/v1/sms-transactions/summary
     *
     * Query params:
     *   - from: YYYY-MM-DD (default: first day of current month)
     *   - to: YYYY-MM-DD (default: today)
     */
    public function summary(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $from = $request->input('from', now()->startOfMonth()->toDateString());
        $to = $request->input('to', now()->toDateString());

        // Total sent/failed/cost for the period
        $stats = SmsTransaction::where('barangay_id', $barangayId)
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->select(
                DB::raw('count(*) as total_transactions'),
                DB::raw("sum(case when status = 'sent' then 1 else 0 end) as total_sent"),
                DB::raw("sum(case when status = 'failed' then 1 else 0 end) as total_failed"),
                DB::raw("coalesce(sum(case when status = 'sent' then credit_cost else 0 end), 0) as total_cost"),
            )
            ->first();

        // Breakdown by source
        $bySource = SmsTransaction::where('barangay_id', $barangayId)
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->where('status', 'sent')
            ->select('source', DB::raw('count(*) as count'), DB::raw('sum(credit_cost) as cost'))
            ->groupBy('source')
            ->orderByDesc('count')
            ->get();

        // Daily breakdown for chart
        $daily = SmsTransaction::where('barangay_id', $barangayId)
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->where('status', 'sent')
            ->select(
                DB::raw('date(created_at) as date'),
                DB::raw('count(*) as count'),
                DB::raw('sum(credit_cost) as cost'),
            )
            ->groupBy(DB::raw('date(created_at)'))
            ->orderBy('date')
            ->get();

        // Current balance
        $barangay = $request->user()->barangay;

        return response()->json([
            'period' => ['from' => $from, 'to' => $to],
            'sms_credit_balance' => $barangay?->sms_credit_balance,
            'total_transactions' => (int) $stats->total_transactions,
            'total_sent' => (int) $stats->total_sent,
            'total_failed' => (int) $stats->total_failed,
            'total_cost' => (float) $stats->total_cost,
            'by_source' => $bySource,
            'daily' => $daily,
        ]);
    }
}
