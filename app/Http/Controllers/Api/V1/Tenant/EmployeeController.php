<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Hris\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    /**
     * List employees with search/filter/pagination.
     *
     * GET /api/v1/employees
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = Employee::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('employee_number', 'ilike', "%{$search}%")
                    ->orWhere('position', 'ilike', "%{$search}%");
            });
        }

        if ($officeId = $request->get('office_id')) {
            $query->where('office_id', $officeId);
        }

        if ($employmentType = $request->get('employment_type')) {
            $query->where('employment_type', $employmentType);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $sortBy = $request->get('sort_by', 'employee_number');
        $sortDir = $request->get('sort_dir', 'asc');
        $allowedSorts = ['employee_number', 'position', 'date_hired', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single employee record.
     *
     * GET /api/v1/employees/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $employee = Employee::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['employee' => $employee]);
    }

    /**
     * Create a new employee record.
     *
     * POST /api/v1/employees
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'resident_id' => ['required', 'uuid'],
            'office_id' => ['nullable', 'uuid'],
            'position' => ['required', 'string', 'max:255'],
            'employment_type' => ['required', 'in:regular,casual,job_order,elected,appointed'],
            'date_hired' => ['required', 'date'],
            'status' => ['nullable', 'in:active,inactive,resigned,terminated'],
        ]);

        $barangayId = $request->user()->barangay_id;

        // Auto-generate employee number
        $lastEmployee = Employee::where('barangay_id', $barangayId)
            ->max('employee_number');
        $nextNumber = $lastEmployee
            ? str_pad((string) ((int) $lastEmployee + 1), 4, '0', STR_PAD_LEFT)
            : '0001';

        $employee = Employee::create([
            ...$validated,
            'barangay_id' => $barangayId,
            'employee_number' => $nextNumber,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'message' => 'Employee created.',
            'employee' => $employee,
        ], 201);
    }

    /**
     * Update an employee record.
     *
     * PUT /api/v1/employees/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $employee = Employee::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'office_id' => ['nullable', 'uuid'],
            'position' => ['sometimes', 'string', 'max:255'],
            'employment_type' => ['sometimes', 'in:regular,casual,job_order,elected,appointed'],
            'date_hired' => ['sometimes', 'date'],
            'status' => ['sometimes', 'in:active,inactive,resigned,terminated'],
        ]);

        $employee->update($validated);

        return response()->json([
            'message' => 'Employee updated.',
            'employee' => $employee->fresh(),
        ]);
    }

    /**
     * Delete an employee record.
     *
     * DELETE /api/v1/employees/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $employee = Employee::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $employee->delete();

        return response()->json(['message' => 'Employee deleted.']);
    }
}
