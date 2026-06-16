<?php

declare(strict_types=1);

namespace App\Models\Tenant\Records;

use App\Traits\BelongsToBarangay;
use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LotBuilding extends Model
{
    use BelongsToBarangay, HasAuditColumns, HasFactory, HasUuids, SoftDeletes;

    protected $table = 'lots_buildings';

    protected $fillable = [
        'barangay_id',
        'lot_building_number',
        'classification',           // lot_only, building_only, lot_and_building
        'property_classification',  // residential, commercial, agricultural, industrial, institutional
        'owner_resident_id',
        'owner_name',
        'owner_contact',
        'owner_email',
        'owner_address',
        'size',
        'mri',
        'purok',
        'street',
        'exact_address',
        'lot_number',
        'block_number',
        'boundary_north',
        'boundary_south',
        'boundary_east',
        'boundary_west',
        'tax_declaration_number',
        'registration_date',
        'number_of_floors',
        'building_material',
        'year_constructed',
        'assessed_value',
        'market_value',
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
            'assessed_value' => 'decimal:2',
            'market_value' => 'decimal:2',
            'number_of_floors' => 'integer',
            'year_constructed' => 'integer',
        ];
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(LotBuildingTransaction::class);
    }
}
