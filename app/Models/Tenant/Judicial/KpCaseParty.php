<?php

declare(strict_types=1);

namespace App\Models\Tenant\Judicial;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KpCaseParty extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'kp_case_parties';

    const UPDATED_AT = null; // table only has created_at

    protected $fillable = [
        'barangay_id',
        'case_id',
        'resident_id',
        'party_type',
        'party_mode',
        'first_name',
        'middle_name',
        'last_name',
        'full_name',
        'address',
        'mobile_number',
    ];
}
