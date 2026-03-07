<?php

declare(strict_types=1);

namespace App\Models\Tenant\Tanod;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TanodDutySchedule extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'tanod_duty_schedules';

    protected $fillable = [
        'barangay_id',
        'tanod_id',
        'date',
        'shift_start',
        'shift_end',
        'beat',
        'team_leader_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }
}
