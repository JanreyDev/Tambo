<?php

declare(strict_types=1);

namespace App\Models\Tenant\Officials;

use App\Models\Tenant\Resident;
use App\Traits\BelongsToBarangay;
use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class BarangayOfficial extends Model
{
    use BelongsToBarangay, HasAuditColumns, HasFactory, HasUuids, SoftDeletes;

    protected $table = 'barangay_officials';

    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class, 'resident_id');
    }

    protected $fillable = [
        'barangay_id',
        'resident_id',
        'position',
        'committee',     // legacy single field — kept for backward compat
        'committees',    // current: array of committee names
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
            'committees' => 'array',
        ];
    }
}
