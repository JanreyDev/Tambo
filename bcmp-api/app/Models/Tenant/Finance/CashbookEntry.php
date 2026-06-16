<?php

declare(strict_types=1);

namespace App\Models\Tenant\Finance;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashbookEntry extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'cashbook_entries';

    protected $fillable = [
        'barangay_id',
        'entry_date',
        'description',
        'reference_type',
        'reference_id',
        'debit',
        'credit',
        'balance',
        'fund_type',
    ];

    protected function casts(): array
    {
        return [
            'entry_date' => 'date',
            'debit' => 'decimal:2',
            'credit' => 'decimal:2',
            'balance' => 'decimal:2',
        ];
    }
}
