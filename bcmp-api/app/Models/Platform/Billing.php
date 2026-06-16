<?php

declare(strict_types=1);

namespace App\Models\Platform;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Billing extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'billings';

    protected $fillable = [
        'barangay_id',
        'billing_number',
        'period_start',
        'period_end',
        'amount',
        'balance',
        'status',
        'invoice_number',
        'or_number',
        'due_date',
        'paid_at',
        'remarks',
        'line_items',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'amount' => 'decimal:2',
            'balance' => 'decimal:2',
            'due_date' => 'date',
            'paid_at' => 'datetime',
            'line_items' => 'array',
        ];
    }
}
