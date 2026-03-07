<?php

declare(strict_types=1);

namespace App\Models\Tenant\Tanod;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tanod extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'tanods';

    protected $fillable = [
        'barangay_id',
        'resident_id',
        'official_id',
        'badge_number',
        'appointment_date',
        'appointed_by_id',
        'beat_assignment',
        'team',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date',
        ];
    }
}
