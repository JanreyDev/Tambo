<?php

declare(strict_types=1);

namespace App\Models\Tenant\Officials;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Council extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'councils';

    protected $fillable = [
        'barangay_id',
        'council_type',
        'term',
        'status',
        'meeting_schedule',
        'members',
    ];

    protected function casts(): array
    {
        return [
            'members' => 'array',
        ];
    }
}
