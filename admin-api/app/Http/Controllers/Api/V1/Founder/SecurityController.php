<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Founder;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SecurityController extends Controller
{
    /**
     * Get a security feed with recent events.
     */
    public function feed(): JsonResponse
    {
        $since = now()->subDay();

        // Failed login attempts (both Sanctum and Founder auth).
        $failedLogins = AuditLog::where('created_at', '>=', $since)
            ->whereIn('action', ['failed_login', 'founder_passcode_failed', 'founder_auth_failed'])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn (AuditLog $log) => [
                'action' => $log->action,
                'description' => $log->description,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'metadata' => $log->metadata,
                'created_at' => $log->created_at?->toIso8601String(),
            ]);

        // Count of blocked / suspicious requests (logged by BlockSuspiciousRequests middleware).
        $blockedRequests = AuditLog::where('created_at', '>=', $since)
            ->where('action', 'blocked_request')
            ->count();

        // Suspicious IPs -- IPs with 3+ failed auth events in last 24h.
        $suspiciousIps = AuditLog::where('created_at', '>=', $since)
            ->whereIn('action', ['failed_login', 'founder_passcode_failed', 'founder_auth_failed'])
            ->whereNotNull('ip_address')
            ->select('ip_address', DB::raw('COUNT(*) as attempt_count'))
            ->groupBy('ip_address')
            ->having(DB::raw('COUNT(*)'), '>=', 3)
            ->orderBy(DB::raw('COUNT(*)'), 'desc')
            ->limit(20)
            ->get()
            ->map(fn ($row) => [
                'ip_address' => $row->ip_address,
                'attempt_count' => $row->attempt_count,
            ]);

        // Recent founder access activity.
        $founderActivity = AuditLog::where('created_at', '>=', $since)
            ->whereIn('action', ['founder_login', 'founder_logout', 'founder_auth_failed'])
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn (AuditLog $log) => [
                'action' => $log->action,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'data' => [
                'failed_logins_24h' => $failedLogins->count(),
                'blocked_requests_24h' => $blockedRequests,
                'suspicious_ips' => $suspiciousIps->map(fn ($row) => [
                    'ip' => $row['ip_address'],
                    'attempts' => $row['attempt_count'],
                    'last_seen' => now()->toIso8601String(),
                    'country' => 'Unknown',
                ])->all(),
                'last_updated_at' => now()->toIso8601String(),
            ],
        ]);
    }
}
