<?php

declare(strict_types=1);

namespace App\Models\Tenant\Gad;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GadAccomplishment extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'gad_accomplishments';

    protected $fillable = [
        'barangay_id',
        'gad_plan_id',
        'activity_id',
        'actual_expenditure',
        'beneficiaries_reached',
        'outcome',
        'supporting_documents',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'actual_expenditure' => 'decimal:2',
            'beneficiaries_reached' => 'integer',
            'supporting_documents' => 'array',
        ];
    }
}
