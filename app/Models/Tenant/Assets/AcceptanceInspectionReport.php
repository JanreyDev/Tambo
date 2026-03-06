<?php

declare(strict_types=1);

namespace App\Models\Tenant\Assets;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class AcceptanceInspectionReport extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'acceptance_inspection_reports';

    protected $fillable = [
        'barangay_id',
        'air_number',
        'supplier_id',
        'delivery_date',
        'accepted_date',
        'delivery_status',
        'inspected_by_id',
        'accepted_by_id',
        'remarks',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'delivery_date' => 'date',
            'accepted_date' => 'date',
        ];
    }
}
