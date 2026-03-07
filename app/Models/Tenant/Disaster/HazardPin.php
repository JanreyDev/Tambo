<?php

declare(strict_types=1);

namespace App\Models\Tenant\Disaster;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HazardPin extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

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
