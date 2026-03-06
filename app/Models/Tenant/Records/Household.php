<?php

declare(strict_types=1);

namespace App\Models\Tenant\Records;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToBarangay;
use App\Traits\HasAuditColumns;

class Household extends Model
{
    use HasFactory, HasUuids, SoftDeletes, BelongsToBarangay, HasAuditColumns;

    protected $table = 'households';

    protected $fillable = [
        'barangay_id',
        'household_number',
        'household_name',
        'head_resident_id',
        'household_type',
        'tenure_status',
        'housing_unit',
        'purok',
        'address',
        'member_count',
        'latitude',
        'longitude',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'member_count' => 'integer',
        ];
    }
}
