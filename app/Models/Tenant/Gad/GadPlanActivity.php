<?php

declare(strict_types=1);

namespace App\Models\Tenant\Gad;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GadPlanActivity extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'gad_plan_activities';

    protected $fillable = [
        'barangay_id',
        'gad_plan_id',
        'activity_name',
        'objective',
        'target_beneficiaries',
        'budget_allocated',
        'timeline_start',
        'timeline_end',
        'responsible_office',
        'performance_indicator',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'budget_allocated' => 'decimal:2',
            'timeline_start' => 'date',
            'timeline_end' => 'date',
            'sort_order' => 'integer',
        ];
    }
}
