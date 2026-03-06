<?php

declare(strict_types=1);

namespace App\Models\Tenant\Judicial;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToBarangay;
use App\Traits\HasAuditColumns;

class BlotterRecord extends Model
{
    use HasFactory, HasUuids, SoftDeletes, BelongsToBarangay, HasAuditColumns;

    protected $table = 'blotter_records';

    protected $fillable = [
        'barangay_id',
        'blotter_number',
        'filing_date',
        'complainant_name',
        'complainant_address',
        'complainant_mobile',
        'complainant_resident_id',
        'respondent_name',
        'respondent_address',
        'respondent_mobile',
        'respondent_resident_id',
        'incident_type',
        'incident_date',
        'incident_time',
        'incident_place',
        'narrative',
        'resolution',
        'officer_on_duty_id',
        'status',
        'linked_kp_case_id',
        'attachment_file_ids',
    ];

    protected function casts(): array
    {
        return [
            'filing_date' => 'date',
            'incident_date' => 'date',
            'attachment_file_ids' => 'array',
        ];
    }
}
