<?php

declare(strict_types=1);

namespace App\Models\Tenant\Finance;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class CollectionsDeposit extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'collections_deposits';

    protected $fillable = [
        'barangay_id',
        'report_date',
        'collection_amount',
        'deposit_amount',
        'bank_name',
        'deposit_slip_number',
        'prepared_by_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'report_date' => 'date',
            'collection_amount' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
        ];
    }
}
