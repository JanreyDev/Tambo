<?php

declare(strict_types=1);

namespace App\Models\Tenant\Assets;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class InventoryTransaction extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'inventory_transactions';

    protected $fillable = [
        'barangay_id',
        'item_id',
        'transaction_type',
        'quantity',
        'reference',
        'performed_by_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
        ];
    }
}
