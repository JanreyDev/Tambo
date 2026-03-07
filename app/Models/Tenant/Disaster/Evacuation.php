<?php

declare(strict_types=1);

namespace App\Models\Tenant\Disaster;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evacuation extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'evacuations';

    protected $fillable = [
        'barangay_id',
        'evacuation_name',
        'cause_type',
        'start_date',
        'end_date',
        'evacuation_center',
        'center_latitude',
        'center_longitude',
        'evacuee_count',
        'family_count',
        'status',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'center_latitude' => 'decimal:8',
            'center_longitude' => 'decimal:8',
            'evacuee_count' => 'integer',
            'family_count' => 'integer',
        ];
    }
}
