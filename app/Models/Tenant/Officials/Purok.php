<?php

declare(strict_types=1);

namespace App\Models\Tenant\Officials;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class Purok extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'puroks';

    protected $fillable = [
        'barangay_id',
        'name',
        'leader_resident_id',
        'description',
        'resident_count',
        'household_count',
        'latitude',
        'longitude',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'resident_count' => 'integer',
            'household_count' => 'integer',
        ];
    }
}
