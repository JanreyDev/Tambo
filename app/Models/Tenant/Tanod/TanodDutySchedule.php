<?php

declare(strict_types=1);

namespace App\Models\Tenant\Tanod;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class TanodDutySchedule extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

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
