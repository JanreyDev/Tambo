<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BarangayAddressEntry extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'barangay_address_entries';

    protected $fillable = [
        'barangay_id',
        'kind',
        'canonical',
        'count',
        'aliases',
    ];

    protected function casts(): array
    {
        return [
            'count' => 'integer',
            'aliases' => 'array',
        ];
    }
}
