<?php

declare(strict_types=1);

namespace App\Models\Tenant\Hris;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceRecord extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'attendance_records';

    protected $fillable = [
        'barangay_id',
        'employee_id',
        'date',
        'time_in',
        'time_out',
        'status',
        'leave_type',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'time_in' => 'datetime',
            'time_out' => 'datetime',
        ];
    }
}
