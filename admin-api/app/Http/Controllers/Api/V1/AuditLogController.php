<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * List audit logs with filtering and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['sometimes', 'string', 'max:100'],
            'resource_type' => ['sometimes', 'string', 'max:100'],
            'admin_user_id' => ['sometimes', 'uuid'],
            'date_from' => ['sometimes', 'date'],
            'date_to' => ['sometimes', 'date'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = AuditLog::with('adminUser:id,username,first_name,last_name')
            ->orderByDesc('created_at');

        if (isset($validated['action'])) {
            $query->where('action', $validated['action']);
        }

        if (isset($validated['resource_type'])) {
            $query->where('resource_type', $validated['resource_type']);
        }

        if (isset($validated['admin_user_id'])) {
            $query->where('admin_user_id', $validated['admin_user_id']);
        }

        if (isset($validated['date_from'])) {
            $query->where('created_at', '>=', $validated['date_from']);
        }

        if (isset($validated['date_to'])) {
            $query->where('created_at', '<=', $validated['date_to'].' 23:59:59');
        }

        $perPage = $validated['per_page'] ?? 25;
        $auditLogs = $query->paginate($perPage);

        return response()->json($auditLogs);
    }
}
