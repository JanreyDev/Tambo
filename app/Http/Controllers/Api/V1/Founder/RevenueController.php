<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Founder;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class RevenueController extends Controller
{
    /**
     * Get revenue overview with monthly breakdown by product.
     *
     * Returns estimated revenue data based on known contracts.
     * Real payment integration will replace this with actual transaction data.
     */
    public function overview(): JsonResponse
    {
        // Known revenue sources (from business context):
        // BCMP: ~P1M+/yr (~P83k/mo from ~50 barangays at ~P19,568/yr avg)
        // LGMP: P250k/mo (Tarlac Province payroll)
        // PDMP: P0 (no active campaign)
        $currentYear = (int) now()->year;
        $currentMonth = (int) now()->month;

        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $monthLabel = $date->format('M Y');
            $isPast = $date->month < $currentMonth || $date->year < $currentYear;

            $bcmp = $isPast ? 83000 : 0;
            $lgmp = $isPast ? 250000 : 0;
            $pdmp = 0;

            $months[] = [
                'month' => $monthLabel,
                'bcmp' => $bcmp,
                'lgmp' => $lgmp,
                'pdmp' => $pdmp,
                'total' => $bcmp + $lgmp + $pdmp,
            ];
        }

        return response()->json([
            'data' => $months,
        ]);
    }
}
