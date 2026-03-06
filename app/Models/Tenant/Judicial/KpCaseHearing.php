<?php

declare(strict_types=1);

namespace App\Models\Tenant\Judicial;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class KpCaseHearing extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'kp_case_hearings';

    protected $fillable = [
        'barangay_id',
        'case_id',
        'hearing_type',
        'hearing_date',
        'hearing_time',
        'venue',
        'minutes',
        'attendees',
        'outcome',
        'next_hearing_date',
    ];

    protected function casts(): array
    {
        return [
            'hearing_date' => 'date',
            'next_hearing_date' => 'date',
            'attendees' => 'array',
        ];
    }
}
