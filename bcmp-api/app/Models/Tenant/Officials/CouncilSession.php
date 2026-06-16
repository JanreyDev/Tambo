<?php

declare(strict_types=1);

namespace App\Models\Tenant\Officials;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CouncilSession extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'council_sessions';

    protected $fillable = [
        'barangay_id',
        'council_id',
        'session_type',
        'session_number',
        'date',
        'time_start',
        'time_end',
        'venue',
        'agenda',
        'minutes',
        'attendees',
        'quorum_met',
        'presiding_officer_id',
        'secretary_id',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'attendees' => 'array',
            'quorum_met' => 'boolean',
            'session_number' => 'integer',
        ];
    }
}
