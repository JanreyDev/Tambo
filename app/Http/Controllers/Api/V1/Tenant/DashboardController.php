<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Admin\Barangay;
use App\Models\Platform\LoginLog;
use App\Models\Tenant\Documents\IssuedDocument;
use App\Models\Tenant\Finance\CashbookEntry;
use App\Models\Tenant\Judicial\BlotterRecord;
use App\Models\Tenant\Judicial\KpCase;
use App\Models\Tenant\Judicial\VawcCase;
use App\Models\Tenant\Officials\CouncilSession;
use App\Models\Tenant\PublicPortal\PublicDocumentRequest;
use App\Models\Tenant\Records\Establishment;
use App\Models\Tenant\Records\LotBuilding;
use App\Models\Tenant\Resident;
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

        // Resident demographics (for residents page stat cards)
        $stats['voter_count'] = Resident::where('barangay_id', $barangayId)
            ->where('is_voter', true)->count();

        // PWD and senior citizen counts come from sectoral tags (not boolean columns on residents)
        $stats['pwd_count'] = DB::table('resident_sectoral_tags')
            ->where('barangay_id', $barangayId)
            ->where('sector', 'pwd')
            ->count();

        $stats['senior_citizen_count'] = DB::table('resident_sectoral_tags')
            ->where('barangay_id', $barangayId)
            ->where('sector', 'senior_citizen')
            ->count();

        // Status breakdown — valid values: active, deceased, transferred, archived
        $statusCounts = Resident::where('barangay_id', $barangayId)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $stats['active_count'] = (int) ($statusCounts['active'] ?? 0);
        $stats['deceased_count'] = (int) ($statusCounts['deceased'] ?? 0);
        $stats['transferred_count'] = (int) ($statusCounts['transferred'] ?? 0);
        $stats['archived_count'] = (int) ($statusCounts['archived'] ?? 0);

        // Public document requests — pending count for dashboard widget
        $stats['pending_public_requests'] = PublicDocumentRequest::where('barangay_id', $barangayId)
            ->whereIn('status', ['pending', 'reviewed'])
            ->count();

        // VAWC active cases (RA 9262)
        $stats['active_vawc_cases'] = VawcCase::where('barangay_id', $barangayId)
            ->whereNotIn('status', ['closed', 'dismissed', 'elevated'])
            ->count();

        // Finance — this month's collections (credits)
        $stats['collections_this_month'] = (float) CashbookEntry::where('barangay_id', $barangayId)
            ->where('entry_date', '>=', now()->startOfMonth())
            ->sum('credit');

        // Finance — this month's disbursements (debits)
        $stats['disbursements_this_month'] = (float) CashbookEntry::where('barangay_id', $barangayId)
            ->where('entry_date', '>=', now()->startOfMonth())
            ->sum('debit');

        // Last-month documents for MoM delta on the Documents Issued stat card
        $stats['documents_last_month'] = IssuedDocument::where('barangay_id', $barangayId)
            ->whereBetween('created_at', [
                now()->subMonthNoOverflow()->startOfMonth(),
                now()->subMonthNoOverflow()->endOfMonth(),
            ])
            ->count();

        // Last-month new residents for MoM delta on the Total Residents card
        $stats['residents_this_month'] = Resident::where('barangay_id', $barangayId)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        return response()->json($stats);
    }

    /**
     * Get last-7-days document generation trend for the Document Generation chart.
     *
     * GET /api/v1/dashboard/document-trend
     */
    public function documentTrend(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $startDate = now()->subDays(6)->startOfDay();

        // Postgres-friendly day-grouped count
        $rows = IssuedDocument::where('barangay_id', $barangayId)
            ->where('created_at', '>=', $startDate)
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('count(*) as count'))
            ->groupBy('day')
            ->pluck('count', 'day')
            ->toArray();

        // Fill in zero-days so the chart always has 7 datapoints
        $trend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $trend[] = [
                'date' => $date,
                'day_label' => now()->subDays($i)->format('D'),
                'count' => (int) ($rows[$date] ?? 0),
            ];
        }

        $total = array_sum(array_column($trend, 'count'));

        // Week-over-week delta
        $previousWeekTotal = IssuedDocument::where('barangay_id', $barangayId)
            ->whereBetween('created_at', [
                now()->subDays(13)->startOfDay(),
                now()->subDays(7)->endOfDay(),
            ])
            ->count();

        $deltaPct = $previousWeekTotal > 0
            ? round((($total - $previousWeekTotal) / $previousWeekTotal) * 100, 1)
            : null;

        return response()->json([
            'trend' => $trend,
            'total_this_week' => $total,
            'total_last_week' => $previousWeekTotal,
            'delta_pct' => $deltaPct,
        ]);
    }

    /**
     * Top pending public document requests.
     *
     * GET /api/v1/dashboard/pending-requests
     */
    public function pendingRequests(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $limit = min((int) $request->get('limit', 5), 20);

        $requests = PublicDocumentRequest::where('barangay_id', $barangayId)
            ->whereIn('status', ['pending', 'reviewed'])
            ->latest()
            ->take($limit)
            ->get()
            ->map(fn ($req) => [
                'id' => $req->id,
                'request_number' => $req->request_number,
                'requester_name' => $req->requester_name,
                'document_type' => $req->document_type,
                'status' => $req->status,
                'created_at' => $req->created_at->toIso8601String(),
                'urgency' => $this->classifyUrgency($req->created_at),
            ]);

        return response()->json(['requests' => $requests]);
    }

    /**
     * Upcoming council sessions / barangay events.
     *
     * GET /api/v1/dashboard/upcoming-events
     */
    public function upcomingEvents(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $limit = min((int) $request->get('limit', 4), 10);

        $events = CouncilSession::where('barangay_id', $barangayId)
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->orderBy('time_start')
            ->take($limit)
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'title' => $this->formatSessionTitle($s->session_type, $s->session_number),
                'session_type' => $s->session_type,
                'date' => $s->date?->toDateString(),
                'time_start' => $s->time_start,
                'venue' => $s->venue,
            ]);

        return response()->json(['events' => $events]);
    }

    private function classifyUrgency($createdAt): string
    {
        $hoursAgo = $createdAt->diffInHours(now());
        if ($hoursAgo >= 72) {
            return 'high';
        }
        if ($hoursAgo >= 24) {
            return 'medium';
        }

        return 'low';
    }

    private function formatSessionTitle(?string $type, ?int $number): string
    {
        $typeLabel = match ($type) {
            'regular' => 'Regular Session',
            'special' => 'Special Session',
            'public_hearing' => 'Public Hearing',
            'committee' => 'Committee Meeting',
            default => 'Council Session',
        };

        return $number ? "{$typeLabel} #{$number}" : $typeLabel;
    }

    /**
     * Get recent document activity feed for the dashboard.
     * Document-centric (each row = one document issued, with constituent + template + status).
     *
     * GET /api/v1/dashboard/activity
     */
    public function activity(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $limit = min((int) $request->get('limit', 10), 50);

        $documents = IssuedDocument::where('barangay_id', $barangayId)
            ->latest()
            ->take($limit)
            ->get()
            ->map(fn ($doc) => [
                'id' => $doc->id,
                'document_number' => $doc->document_number,
                'template_name' => $doc->template_name,
                'constituent_name' => $doc->constituent_name,
                'constituent_number' => $doc->constituent_number,
                'status' => $doc->status,
                'created_at' => $doc->created_at->toIso8601String(),
            ]);

        return response()->json(['activity' => $documents]);
    }

    /**
     * Get recent resident registrations for the dashboard widget.
     *
     * GET /api/v1/dashboard/recent-residents
     */
    public function recentResidents(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $limit = min((int) $request->get('limit', 5), 20);

        $residents = Resident::where('barangay_id', $barangayId)
            ->latest()
            ->take($limit)
            ->get(['id', 'first_name', 'last_name', 'middle_name', 'date_of_birth', 'sex', 'purok', 'created_at'])
            ->map(fn ($r) => [
                'id' => $r->id,
                'first_name' => $r->first_name,
                'last_name' => $r->last_name,
                'middle_name' => $r->middle_name,
                'age' => $r->date_of_birth
                    ? (int) floor((time() - strtotime((string) $r->date_of_birth)) / 31557600)
                    : null,
                'sex' => $r->sex,
                'purok' => $r->purok,
                'created_at' => $r->created_at->toIso8601String(),
            ]);

        return response()->json(['residents' => $residents]);
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
            ->with('user:id,first_name,last_name,username')
            ->latest()
            ->take(20)
            ->get()
            ->map(function ($log) {
                $deviceInfo = $log->device_info ?? [];
                $userName = $log->user
                    ? trim((string) ($log->user->first_name ?? '').' '.($log->user->last_name ?? ''))
                    : $log->attempted_username;

                return [
                    'id' => $log->id,
                    'user' => $userName ?: $log->attempted_username,
                    'photo_url' => null,
                    'action' => $log->action,
                    'device_type' => $deviceInfo['device_type'] ?? $deviceInfo['platform'] ?? 'Unknown',
                    'browser' => $deviceInfo['browser'] ?? '',
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at->toIso8601String(),
                ];
            });

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
                ->whereRaw('EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN ? AND ?', [$min, $max])
                ->count();
        }

        return $distribution;
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 1).' GB';
        }

        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 1).' MB';
        }

        return number_format($bytes / 1024, 1).' KB';
    }
}
