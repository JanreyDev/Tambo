<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Hris\AttendanceRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceRecordController extends Controller
{
    /**
     * List attendance records with filters.
     *
     * GET /api/v1/attendance-records
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = AttendanceRecord::where('barangay_id', $barangayId);

        if ($employeeId = $request->get('employee_id')) {
            $query->where('employee_id', $employeeId);
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
        $allowedSorts = ['date', 'status', 'time_in', 'time_out', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Create a new attendance record.
     *
     * POST /api/v1/attendance-records
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'uuid'],
            'date' => ['required', 'date'],
            'time_in' => ['nullable', 'date_format:H:i'],
            'time_out' => ['nullable', 'date_format:H:i'],
            'status' => ['required', 'in:present,absent,late,half_day,leave,holiday'],
            'leave_type' => ['nullable', 'string', 'max:100'],
            'remarks' => ['nullable', 'string', 'max:500'],
        ]);

        $record = AttendanceRecord::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
        ]);

        return response()->json([
            'message' => 'Attendance record created.',
            'attendance_record' => $record,
        ], 201);
    }

    /**
     * Update an attendance record.
     *
     * PUT /api/v1/attendance-records/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $record = AttendanceRecord::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'time_in' => ['nullable', 'date_format:H:i'],
            'time_out' => ['nullable', 'date_format:H:i'],
            'status' => ['sometimes', 'in:present,absent,late,half_day,leave,holiday'],
            'leave_type' => ['nullable', 'string', 'max:100'],
            'remarks' => ['nullable', 'string', 'max:500'],
        ]);

        $record->update($validated);

        return response()->json([
            'message' => 'Attendance record updated.',
            'attendance_record' => $record->fresh(),
        ]);
    }

    /**
     * Delete an attendance record.
     *
     * DELETE /api/v1/attendance-records/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $record = AttendanceRecord::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $record->delete();

        return response()->json(['message' => 'Attendance record deleted.']);
    }
}
