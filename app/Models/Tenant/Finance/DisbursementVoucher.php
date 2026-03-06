<?php

declare(strict_types=1);

namespace App\Models\Tenant\Finance;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class DisbursementVoucher extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'disbursement_vouchers';

    protected $fillable = [
        'barangay_id',
        'dv_number',
        'dv_type',
        'payee',
        'particulars',
        'amount',
        'fund_source',
        'status',
        'prepared_by_id',
        'certified_by_id',
        'approved_by_id',
        'approved_at',
        'check_number',
        'check_date',
        'bank_name',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'approved_at' => 'datetime',
            'check_date' => 'date',
        ];
    }
}
