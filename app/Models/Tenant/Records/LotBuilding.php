<?php

declare(strict_types=1);

namespace App\Models\Tenant\Records;

use App\Traits\BelongsToBarangay;
use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LotBuilding extends Model
{
    use BelongsToBarangay, HasAuditColumns, HasFactory, HasUuids, SoftDeletes;

    protected $table = 'lots_buildings';

    protected $fillable = [
        'barangay_id',
        'lot_building_number',
        'classification',
        'owner_resident_id',
        'owner_name',
        'owner_contact',
        'owner_email',
        'owner_address',
        'size',
        'mri',
        'purok',
        'exact_address',
        'boundary_north',
        'boundary_south',
        'boundary_east',
        'boundary_west',
        'tax_declaration_number',
        'registration_date',
        'status',
        'latitude',
        'longitude',
    ];

    protected function casts(): array
    {
        return [
            'registration_date' => 'date',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
        ];
    }
}
