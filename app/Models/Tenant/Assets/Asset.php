<?php

declare(strict_types=1);

namespace App\Models\Tenant\Assets;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToBarangay;
use App\Traits\HasAuditColumns;

class Asset extends Model
{
    use HasFactory, HasUuids, SoftDeletes, BelongsToBarangay, HasAuditColumns;

    protected $table = 'assets';

    protected $fillable = [
        'barangay_id',
        'air_id',
        'asset_id_tag',
        'description',
        'classification',
        'uacs_code',
        'quantity',
        'unit',
        'unit_price',
        'total_value',
        'acquisition_date',
        'condition',
        'location',
        'assigned_to_id',
        'latitude',
        'longitude',
        'status',
        'disposal_date',
        'disposal_method',
        'photo_file_id',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'total_value' => 'decimal:2',
            'acquisition_date' => 'date',
            'disposal_date' => 'date',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
        ];
    }
}
