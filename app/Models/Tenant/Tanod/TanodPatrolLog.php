<?php

declare(strict_types=1);

namespace App\Models\Tenant\Tanod;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class TanodPatrolLog extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'tanod_patrol_logs';

    protected $fillable = [
        'barangay_id',
        'tanod_id',
        'schedule_id',
        'log_time',
        'location',
        'latitude',
        'longitude',
        'activity',
        'observations',
        'attachments',
    ];

    protected function casts(): array
    {
        return [
            'log_time' => 'datetime',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'attachments' => 'array',
        ];
    }
}
