<?php

declare(strict_types=1);

namespace App\Models\Tenant\Records;

use App\Traits\BelongsToBarangay;
use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Establishment extends Model
{
    use BelongsToBarangay, HasAuditColumns, HasFactory, HasUuids, SoftDeletes;

    protected $table = 'establishments';

    protected $fillable = [
        'barangay_id',
        'establishment_number',
        'business_name',
        'business_type',
        'owner_resident_id',
        'owner_name',
        'owner_contact',
        'owner_email',
        'owner_address',
        'purok',
        'street',
        'exact_address',
        'registration_date',
        'permit_number',
        'permit_expiry',
        'status',
        'latitude',
        'longitude',
    ];

    protected function casts(): array
    {
        return [
            'registration_date' => 'date',
            'permit_expiry' => 'date',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
        ];
    }
}
