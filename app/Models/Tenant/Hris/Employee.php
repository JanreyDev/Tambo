<?php

declare(strict_types=1);

namespace App\Models\Tenant\Hris;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class Employee extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'employees';

    protected $fillable = [
        'barangay_id',
        'office_id',
        'resident_id',
        'employee_number',
        'position',
        'employment_type',
        'date_hired',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'date_hired' => 'date',
        ];
    }
}
