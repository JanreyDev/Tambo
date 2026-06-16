<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Models\Admin\Barangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Voter extends Model
{
    use HasUuids;

    protected $table = 'voters';

    protected $fillable = [
        'barangay_id',
        'last_name',
        'first_name',
        'middle_name',
        'full_name',
        'precinct_number',
        'address',
        'application_number',
        'resident_id',
        'matched_at',
        'imported_at',
    ];

    protected $casts = [
        'matched_at' => 'datetime',
        'imported_at' => 'datetime',
    ];

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }
}
