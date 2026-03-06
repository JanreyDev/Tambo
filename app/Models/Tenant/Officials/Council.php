<?php

declare(strict_types=1);

namespace App\Models\Tenant\Officials;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class Council extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

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
