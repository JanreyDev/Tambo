<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Admin\Barangay;
use App\Models\Platform\LoginLog;
use App\Models\Tenant\Resident;
use App\Models\Tenant\Records\Establishment;
use App\Models\Tenant\Records\LotBuilding;
use App\Models\Tenant\Documents\IssuedDocument;
use App\Models\Tenant\Judicial\BlotterRecord;
use App\Models\Tenant\Judicial\KpCase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics for the current barangay.
     *
     * GET /api/v1/dashboard/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $stats = [
            'total_residents' => Resident::where('barangay_id', $barangayId)->count(),
            'total_households' => Resident::where('barangay_id', $barangayId)
                ->where('is_head_of_household', true)->count(),
            'total_establishments' => Establishment::where('barangay_id', $barangayId)->count(),
            'total_lots_buildings' => LotBuilding::where('barangay_id', $barangayId)->count(),
            'total_documents_issued' => IssuedDocument::where('barangay_id', $barangayId)->count(),
            'total_blotters' => BlotterRecord::where('barangay_id', $barangayId)->count(),
            'total_kp_cases' => KpCase::where('barangay_id', $barangayId)->count(),
            'pending_blotters' => BlotterRecord::where('barangay_id', $barangayId)
                ->where('status', 'pending')->count(),
            'active_kp_cases' => KpCase::where('barangay_id', $barangayId)
                ->whereNotIn('status', ['settled', 'dismissed', 'elevated'])->count(),
        ];

        // Gender distribution
        $stats['gender_distribution'] = Resident::where('barangay_id', $barangayId)
            ->select('sex', DB::raw('count(*) as count'))
            ->groupBy('sex')
            ->pluck('count', 'sex')
            ->toArray();

        // Age distribution
        $stats['age_groups'] = $this->getAgeDistribution($barangayId);

        // Recent registrations (last 7 days)
        $stats['recent_registrations'] = Resident::where('barangay_id', $barangayId)
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        // Documents this month
        $stats['documents_this_month'] = IssuedDocument::where('barangay_id', $barangayId)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        return response()->json($stats);
    }

    /**
     * Get recent activity feed for the dashboard.
     *
     * GET /api/v1/dashboard/activity
     */
    public function activity(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $limit = min((int) $request->get('limit', 20), 50);

        // Recent documents
        $recentDocuments = IssuedDocument::where('barangay_id', $barangayId)
            ->with('issuedBy:id,first_name,last_name')
            ->latest()
            ->take($limit)
            ->get()
            ->map(fn ($doc) => [
                'type' => 'document',
                'id' => $doc->id,
                'description' => "Document #{$doc->document_number} issued",
                'template_type' => $doc->template_type,
                'status' => $doc->status,
                'user' => $doc->issuedBy?->full_name,
                'created_at' => $doc->created_at->toIso8601String(),
            ]);

        // Recent residents
        $recentResidents = Resident::where('barangay_id', $barangayId)
            ->latest()
            ->take($limit)
            ->get()
            ->map(fn ($r) => [
                'type' => 'resident',
                'id' => $r->id,
                'description' => "Resident registered: {$r->full_name}",
                'status' => $r->status?->value,
                'created_at' => $r->created_at->toIso8601String(),
            ]);

        // Merge and sort by date
        $activity = $recentDocuments->concat($recentResidents)
            ->sortByDesc('created_at')
            ->take($limit)
            ->values();

        return response()->json(['activity' => $activity]);
    }

    /**
     * Get sign-in monitor data.
     *
     * GET /api/v1/dashboard/sign-ins
     */
    public function signIns(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $signIns = LoginLog::where('barangay_id', $barangayId)
            ->with('user:id,first_name,last_name,photo_url')
            ->latest()
            ->take(20)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'user' => $log->user?->full_name,
                'photo_url' => $log->user?->photo_url,
                'action' => $log->action,
                'device_type' => $log->device_type,
                'browser' => $log->browser,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->toIso8601String(),
            ]);

        return response()->json(['sign_ins' => $signIns]);
    }

    /**
     * Get barangay credits and storage info.
     *
     * GET /api/v1/dashboard/credits
     */
    public function credits(Request $request): JsonResponse
    {
        $barangay = $request->user()->barangay;

        if (! $barangay) {
            return response()->json(['message' => 'No barangay assigned.'], 404);
        }

        return response()->json([
            'credits' => [
                'sms' => [
                    'balance' => (float) $barangay->sms_credit_balance,
                    'label' => 'SMS Credits',
                ],
                'ai' => [
                    'balance' => (float) $barangay->ai_credit_balance,
                    'label' => 'AI Credits',
                ],
                'call' => [
                    'balance' => (float) $barangay->call_credit_balance,
                    'label' => 'Call Credits',
                ],
                'map' => [
                    'balance' => (float) $barangay->map_credit_balance,
                    'label' => 'Map Credits',
                ],
            ],
            'storage' => [
                'used_bytes' => $barangay->storage_used_bytes,
                'limit_bytes' => $barangay->storage_limit_bytes,
                'used_formatted' => $this->formatBytes($barangay->storage_used_bytes),
                'limit_formatted' => $this->formatBytes($barangay->storage_limit_bytes),
                'percentage' => $barangay->storage_limit_bytes > 0
                    ? round(($barangay->storage_used_bytes / $barangay->storage_limit_bytes) * 100, 1)
                    : 0,
            ],
        ]);
    }

    // ── Private Helpers ──

    private function getAgeDistribution(string $barangayId): array
    {
        $ranges = [
            '0-14' => [0, 14],
            '15-30' => [15, 30],
            '31-45' => [31, 45],
            '46-59' => [46, 59],
            '60+' => [60, 200],
        ];

        $distribution = [];

        foreach ($ranges as $label => [$min, $max]) {
            $distribution[$label] = Resident::where('barangay_id', $barangayId)
                ->whereNotNull('date_of_birth')
                ->whereRaw("EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN ? AND ?", [$min, $max])
                ->count();
        }

        return $distribution;
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 1) . ' GB';
        }

        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 1) . ' MB';
        }

        return number_format($bytes / 1024, 1) . ' KB';
    }
}
