<?php

declare(strict_types=1);

namespace App\Models\Tenant\Records;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LotBuildingTransaction extends Model
{
    use HasUuids;

    protected $table = 'lot_building_transactions';

    public $timestamps = false; // only created_at, no updated_at

    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    protected $fillable = [
        'barangay_id',
        'lot_building_id',
        'transaction_type',
        'year',
        'notes',
        'created_by',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'year'       => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function lotBuilding(): BelongsTo
    {
        return $this->belongsTo(LotBuilding::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
