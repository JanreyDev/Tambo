<?php

declare(strict_types=1);

namespace App\Models\Tenant\Tanod;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class TanodIncidentReport extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'tanod_incident_reports';

    protected $fillable = [
        'barangay_id',
        'reporting_tanod_id',
        'incident_number',
        'incident_date',
        'incident_time',
        'incident_location',
        'who',
        'what',
        'when_details',
        'where_details',
        'why',
        'how',
        'actions_taken',
        'referred_to',
        'linked_blotter_id',
        'linked_vawc_case_id',
        'witness_info',
        'evidence_file_ids',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'incident_date' => 'date',
            'witness_info' => 'array',
            'evidence_file_ids' => 'array',
        ];
    }
}
