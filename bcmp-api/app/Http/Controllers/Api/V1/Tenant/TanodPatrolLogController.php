<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Tanod\TanodPatrolLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TanodPatrolLogController extends Controller
{
    /**
     * List patrol logs with filters.
     *
     * GET /api/v1/tanod-patrol-logs
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = TanodPatrolLog::where('barangay_id', $barangayId);

        if ($tanodId = $request->get('tanod_id')) {
            $query->where('tanod_id', $tanodId);
        }

        if ($scheduleId = $request->get('schedule_id')) {
            $query->where('schedule_id', $scheduleId);
        }

        if ($dateFrom = $request->get('date_from')) {
            $query->where('log_time', '>=', $dateFrom);
        }

        if ($dateTo = $request->get('date_to')) {
            $query->where('log_time', '<=', $dateTo.' 23:59:59');
        }

        $sortBy = $request->get('sort_by', 'log_time');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['log_time', 'location', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Create a new patrol log entry.
     *
     * POST /api/v1/tanod-patrol-logs
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tanod_id' => ['required', 'uuid'],
            'schedule_id' => ['nullable', 'uuid'],
            'log_time' => ['required', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'activity' => ['nullable', 'string', 'max:500'],
            'observations' => ['nullable', 'string'],
            'attachments' => ['nullable', 'array'],
        ]);

        $log = TanodPatrolLog::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
        ]);

        return response()->json([
            'message' => 'Patrol log created.',
            'tanod_patrol_log' => $log,
        ], 201);
    }

    /**
     * Update a patrol log entry.
     *
     * PUT /api/v1/tanod-patrol-logs/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $log = TanodPatrolLog::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'location' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'activity' => ['nullable', 'string', 'max:500'],
            'observations' => ['nullable', 'string'],
            'attachments' => ['nullable', 'array'],
        ]);

        $log->update($validated);

        return response()->json([
            'message' => 'Patrol log updated.',
            'tanod_patrol_log' => $log->fresh(),
        ]);
    }

    /**
     * Delete a patrol log entry.
     *
     * DELETE /api/v1/tanod-patrol-logs/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $log = TanodPatrolLog::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $log->delete();

        return response()->json(['message' => 'Patrol log deleted.']);
    }
}
