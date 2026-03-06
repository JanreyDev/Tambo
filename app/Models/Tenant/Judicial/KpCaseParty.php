<?php

declare(strict_types=1);

namespace App\Models\Tenant\Judicial;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class KpCaseParty extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'kp_case_parties';

    protected $fillable = [
        'barangay_id',
        'case_id',
        'resident_id',
        'party_type',
        'full_name',
        'address',
        'mobile_number',
    ];
}
