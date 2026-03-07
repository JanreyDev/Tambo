<?php

declare(strict_types=1);

namespace App\Models\Tenant\Disaster;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EvacuationFamily extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'evacuation_families';

    protected $fillable = [
        'barangay_id',
        'evacuation_id',
        'household_id',
        'head_name',
        'member_count',
        'special_needs',
        'relief_received',
    ];

    protected function casts(): array
    {
        return [
            'member_count' => 'integer',
            'relief_received' => 'array',
        ];
    }
}
