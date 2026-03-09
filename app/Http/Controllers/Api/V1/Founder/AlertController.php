<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Founder;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Founder\SystemAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AlertController extends Controller
{
    /**
     * List system alerts with filtering and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'severity' => ['sometimes', 'string', 'in:critical,warning,info'],
            'source' => ['sometimes', 'string', 'max:50'],
            'resolved' => ['sometimes', 'string', 'in:true,false'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = SystemAlert::orderByDesc('created_at');

        if (isset($validated['severity'])) {
            $query->ofSeverity($validated['severity']);
        }

        if (isset($validated['source'])) {
            $query->fromSource($validated['source']);
        }

        if (isset($validated['resolved'])) {
            if ($validated['resolved'] === 'true') {
                $query->whereNotNull('resolved_at');
            } else {
                $query->unresolved();
            }
        }

        $perPage = (int) ($validated['per_page'] ?? 20);
        $alerts = $query->paginate($perPage);

        return response()->json([
            'data' => $alerts->items(),
            'meta' => [
                'current_page' => $alerts->currentPage(),
                'last_page' => $alerts->lastPage(),
                'per_page' => $alerts->perPage(),
                'total' => $alerts->total(),
            ],
        ]);
    }

    /**
     * Acknowledge a system alert.
     */
    public function acknowledge(Request $request, string $id): JsonResponse
    {
        $alert = SystemAlert::find($id);

        if ($alert === null) {
            return response()->json([
                'message' => 'Alert not found.',
            ], 404);
        }

        if ($alert->acknowledged_at !== null) {
            return response()->json([
                'message' => 'Alert already acknowledged.',
                'data' => $alert,
            ]);
        }

        $alert->acknowledge();

        Log::info('System alert acknowledged', [
            'alert_id' => $alert->id,
            'title' => $alert->title,
            'ip' => $request->ip(),
        ]);

        AuditLog::log(
            adminUserId: null,
            action: 'alert_acknowledged',
            resourceType: 'system_alert',
            resourceId: $alert->id,
            description: "Alert acknowledged: {$alert->title}",
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'message' => 'Alert acknowledged.',
            'data' => $alert->fresh(),
        ]);
    }

    /**
     * Resolve a system alert.
     */
    public function resolve(Request $request, string $id): JsonResponse
    {
        $alert = SystemAlert::find($id);

        if ($alert === null) {
            return response()->json([
                'message' => 'Alert not found.',
            ], 404);
        }

        if ($alert->resolved_at !== null) {
            return response()->json([
                'message' => 'Alert already resolved.',
                'data' => $alert,
            ]);
        }

        $alert->resolve();

        Log::info('System alert resolved', [
            'alert_id' => $alert->id,
            'title' => $alert->title,
            'ip' => $request->ip(),
        ]);

        AuditLog::log(
            adminUserId: null,
            action: 'alert_resolved',
            resourceType: 'system_alert',
            resourceId: $alert->id,
            description: "Alert resolved: {$alert->title}",
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'message' => 'Alert resolved.',
            'data' => $alert->fresh(),
        ]);
    }
}
