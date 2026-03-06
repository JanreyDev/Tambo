<?php

declare(strict_types=1);

namespace App\Models\Tenant\Hris;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class AttendanceRecord extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

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
