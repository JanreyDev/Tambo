<?php

declare(strict_types=1);

namespace App\Models\Tenant\Records;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ResidentCrossBarangayFlag extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'resident_cross_barangay_flags';

    protected $fillable = [
        'resident_id',
        'other_barangay_id',
        'match_confidence',
        'last_transaction_date',
        'detected_at',
        'acknowledged_at',
    ];

    protected function casts(): array
    {
        return [
            'match_confidence' => 'decimal:2',
            'last_transaction_date' => 'date',
            'detected_at' => 'datetime',
            'acknowledged_at' => 'datetime',
        ];
    }
}
