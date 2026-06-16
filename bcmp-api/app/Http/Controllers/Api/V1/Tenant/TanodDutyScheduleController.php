<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Tanod\TanodDutySchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TanodDutyScheduleController extends Controller
{
    /**
     * List tanod duty schedules with filters.
     *
     * GET /api/v1/tanod-duty-schedules
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = TanodDutySchedule::where('barangay_id', $barangayId);

        if ($tanodId = $request->get('tanod_id')) {
            $query->where('tanod_id', $tanodId);
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
        $allowedSorts = ['date', 'shift_start', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Create a new duty schedule.
     *
     * POST /api/v1/tanod-duty-schedules
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tanod_id' => ['required', 'uuid'],
            'date' => ['required', 'date'],
            'shift_start' => ['required', 'string', 'max:10'],
            'shift_end' => ['required', 'string', 'max:10'],
            'beat' => ['nullable', 'string', 'max:255'],
            'team_leader_id' => ['nullable', 'uuid'],
            'status' => ['nullable', 'in:scheduled,on_duty,completed,absent,cancelled'],
        ]);

        $schedule = TanodDutySchedule::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'status' => $validated['status'] ?? 'scheduled',
        ]);

        return response()->json([
            'message' => 'Duty schedule created.',
            'tanod_duty_schedule' => $schedule,
        ], 201);
    }

    /**
     * Update a duty schedule.
     *
     * PUT /api/v1/tanod-duty-schedules/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $schedule = TanodDutySchedule::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'tanod_id' => ['sometimes', 'uuid'],
            'date' => ['sometimes', 'date'],
            'shift_start' => ['sometimes', 'string', 'max:10'],
            'shift_end' => ['sometimes', 'string', 'max:10'],
            'beat' => ['nullable', 'string', 'max:255'],
            'team_leader_id' => ['nullable', 'uuid'],
            'status' => ['sometimes', 'in:scheduled,on_duty,completed,absent,cancelled'],
        ]);

        $schedule->update($validated);

        return response()->json([
            'message' => 'Duty schedule updated.',
            'tanod_duty_schedule' => $schedule->fresh(),
        ]);
    }

    /**
     * Delete a duty schedule.
     *
     * DELETE /api/v1/tanod-duty-schedules/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $schedule = TanodDutySchedule::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $schedule->delete();

        return response()->json(['message' => 'Duty schedule deleted.']);
    }
}
