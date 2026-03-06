<?php

declare(strict_types=1);

namespace App\Models\Tenant\Judicial;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToBarangay;
use App\Traits\HasAuditColumns;

class VawcCase extends Model
{
    use HasFactory, HasUuids, SoftDeletes, BelongsToBarangay, HasAuditColumns;

    protected $table = 'vawc_cases';

    protected $fillable = [
        'barangay_id',
        'case_number',
        'incident_type',
        'filing_date',
        'incident_date',
        'incident_time',
        'incident_place',
        'narrative_encrypted',
        'victim_name_encrypted',
        'victim_dob',
        'victim_address_encrypted',
        'victim_phone_encrypted',
        'victim_occupation',
        'victim_income_range',
        'victim_civil_status',
        'victim_resident_id',
        'respondent_name_encrypted',
        'respondent_dob',
        'respondent_address_encrypted',
        'respondent_phone_encrypted',
        'respondent_occupation',
        'respondent_civil_status',
        'respondent_relationship',
        'children_info_encrypted',
        'bpo_issued',
        'bpo_issued_date',
        'bpo_expiry_date',
        'tpo_referred',
        'tpo_date',
        'ppo_referred',
        'ppo_date',
        'referred_to_pnp',
        'pnp_referral_time',
        'referred_to_dswd',
        'dswd_referral_time',
        'other_referrals',
        'status',
        'vaw_desk_officer_id',
        'logbook_type',
        'logbook_page_number',
        'access_log',
    ];

    protected function casts(): array
    {
        return [
            'filing_date' => 'date',
            'incident_date' => 'date',
            'victim_dob' => 'date',
            'respondent_dob' => 'date',
            'bpo_issued' => 'boolean',
            'bpo_issued_date' => 'date',
            'bpo_expiry_date' => 'date',
            'tpo_referred' => 'boolean',
            'tpo_date' => 'date',
            'ppo_referred' => 'boolean',
            'ppo_date' => 'date',
            'referred_to_pnp' => 'boolean',
            'pnp_referral_time' => 'datetime',
            'referred_to_dswd' => 'boolean',
            'dswd_referral_time' => 'datetime',
            'other_referrals' => 'array',
            'access_log' => 'array',
            'logbook_page_number' => 'integer',
        ];
    }
}
