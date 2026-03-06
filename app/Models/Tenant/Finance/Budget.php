<?php

declare(strict_types=1);

namespace App\Models\Tenant\Finance;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class Budget extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'budgets';

    protected $fillable = [
        'barangay_id',
        'fiscal_year',
        'appropriation',
        'allotment',
        'obligations',
        'unobligated',
        'beginning_cash_treasury',
        'beginning_cash_bank',
        'beginning_cash_advance',
        'beginning_petty_cash',
        'gad_budget',
        'sk_budget',
        'status',
        'approved_by_id',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'fiscal_year' => 'integer',
            'appropriation' => 'decimal:2',
            'allotment' => 'decimal:2',
            'obligations' => 'decimal:2',
            'unobligated' => 'decimal:2',
            'beginning_cash_treasury' => 'decimal:2',
            'beginning_cash_bank' => 'decimal:2',
            'beginning_cash_advance' => 'decimal:2',
            'beginning_petty_cash' => 'decimal:2',
            'gad_budget' => 'decimal:2',
            'sk_budget' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }
}
