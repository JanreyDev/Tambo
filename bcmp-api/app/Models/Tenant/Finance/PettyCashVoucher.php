<?php

declare(strict_types=1);

namespace App\Models\Tenant\Finance;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PettyCashVoucher extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'petty_cash_vouchers';

    protected $fillable = [
        'barangay_id',
        'pcv_number',
        'date',
        'payee',
        'particulars',
        'amount',
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
