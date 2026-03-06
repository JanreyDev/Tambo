<?php

declare(strict_types=1);

namespace App\Models\Tenant\Finance;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class Payment extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'payments';

    protected $fillable = [
        'barangay_id',
        'payment_type',
        'reference_number',
        'date',
        'payer_name',
        'payer_resident_id',
        'amount',
        'or_number',
        'remarks',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'amount' => 'decimal:2',
        ];
    }
}
