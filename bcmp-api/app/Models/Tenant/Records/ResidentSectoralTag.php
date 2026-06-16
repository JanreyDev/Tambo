<?php

declare(strict_types=1);

namespace App\Models\Tenant\Records;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResidentSectoralTag extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'resident_sectoral_tags';

    protected $fillable = [
        'barangay_id',
        'resident_id',
        'sector',
        'details',
        'verified_at',
        'verified_by',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
            'verified_at' => 'datetime',
        ];
    }
}
