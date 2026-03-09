<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Founder;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;

class ActivityController extends Controller
{
    /**
     * Get recent activity timeline across all products.
     * Aggregates audit logs into ActivityEvent format.
     */
    public function timeline(): JsonResponse
    {
        $events = AuditLog::orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn (AuditLog $log) => [
                'id' => (string) $log->id,
                'action' => $log->action,
                'actor' => $log->actor_name ?? $log->actor_type ?? 'System',
                'product' => $this->detectProduct($log),
                'description' => $log->description ?? $log->action,
                'timestamp' => $log->created_at?->toIso8601String(),
            ])
            ->all();

        return response()->json([
            'data' => $events,
        ]);
    }

    /**
     * Detect which product an audit log entry belongs to.
     */
    private function detectProduct(AuditLog $log): string
    {
        $action = $log->action ?? '';

        if (str_starts_with($action, 'founder_')) {
            return 'pulitika';
        }

        if (str_contains($action, 'bcmp') || str_contains($action, 'barangay') || str_contains($action, 'resident')) {
            return 'bcmp';
        }

        if (str_contains($action, 'lgmp') || str_contains($action, 'tarlac') || str_contains($action, 'department')) {
            return 'lgmp';
        }

        if (str_contains($action, 'pdmp') || str_contains($action, 'campaign') || str_contains($action, 'voter')) {
            return 'pdmp';
        }

        return 'system';
    }
}
