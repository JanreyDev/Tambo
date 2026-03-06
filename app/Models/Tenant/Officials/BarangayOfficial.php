<?php

declare(strict_types=1);

namespace App\Models\Tenant\Officials;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToBarangay;
use App\Traits\HasAuditColumns;

class BarangayOfficial extends Model
{
    use HasFactory, HasUuids, SoftDeletes, BelongsToBarangay, HasAuditColumns;

    protected $table = 'barangay_officials';

    protected $fillable = [
        'barangay_id',
        'resident_id',
        'position',
        'committee',
        'term_start',
        'term_end',
        'appointment_date',
        'oath_date',
        'is_elected',
        'sort_order',
        'status',
        'photo_file_id',
        'signature_file_id',
    ];

    protected function casts(): array
    {
        return [
            'term_start' => 'date',
            'term_end' => 'date',
            'appointment_date' => 'date',
            'oath_date' => 'date',
            'is_elected' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
