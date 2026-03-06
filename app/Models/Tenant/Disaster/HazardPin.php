<?php

declare(strict_types=1);

namespace App\Models\Tenant\Disaster;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class HazardPin extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'hazard_pins';

    protected $fillable = [
        'barangay_id',
        'hazard_type',
        'name',
        'description',
        'latitude',
        'longitude',
        'severity',
        'status',
        'reported_by_id',
        'photo_file_ids',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'photo_file_ids' => 'array',
        ];
    }
}
