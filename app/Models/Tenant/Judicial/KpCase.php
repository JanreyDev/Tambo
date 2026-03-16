<?php

declare(strict_types=1);

namespace App\Models\Tenant\Judicial;

use App\Traits\BelongsToBarangay;
use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class KpCase extends Model
{
    use BelongsToBarangay, HasAuditColumns, HasFactory, HasUuids, SoftDeletes;

    protected $table = 'kp_cases';

    public function parties(): HasMany
    {
        return $this->hasMany(KpCaseParty::class, 'case_id');
    }

    public function hearings(): HasMany
    {
        return $this->hasMany(KpCaseHearing::class, 'case_id');
    }

    protected $fillable = [
        'barangay_id',
        'case_number',
        'filing_date',
        'case_level',
        'nature',
        'nature_of_complaint',
        'rpc_article',
        'case_description',
        'complainant_type',
        'respondent_type',
        'presiding_officer_id',
        'lupon_secretary_id',
        'pangkat_chairman_id',
        'pangkat_members',
        'first_meeting_date',
        'mediation_deadline',
        'pangkat_constituted_date',
        'pangkat_convene_date',
        'conciliation_deadline',
        'conciliation_extended_deadline',
        'action_taken',
        'settlement_text',
        'settlement_date',
        'arbitration_award',
        'arbitration_date',
        'repudiation_deadline',
        'execution_date',
        'certification_to_file_action',
        'cfa_date',
        'cfa_reason',
        'status',
        'remarks',
        'blockchain_hash',
    ];

    protected function casts(): array
    {
        return [
            'filing_date' => 'date',
            'first_meeting_date' => 'date',
            'mediation_deadline' => 'date',
            'pangkat_constituted_date' => 'date',
            'pangkat_convene_date' => 'date',
            'conciliation_deadline' => 'date',
            'conciliation_extended_deadline' => 'date',
            'settlement_date' => 'date',
            'arbitration_date' => 'date',
            'repudiation_deadline' => 'date',
            'execution_date' => 'date',
            'cfa_date' => 'date',
            'certification_to_file_action' => 'boolean',
            'pangkat_members' => 'array',
        ];
    }
}
