<?php

declare(strict_types=1);

namespace App\Models\Tenant\Gad;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class GadPlan extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'gad_plans';

    protected $fillable = [
        'barangay_id',
        'plan_type',
        'fiscal_year',
        'barangay_total_budget',
        'gad_budget',
        'status',
        'approved_by_id',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'fiscal_year' => 'integer',
            'barangay_total_budget' => 'decimal:2',
            'gad_budget' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }
}
