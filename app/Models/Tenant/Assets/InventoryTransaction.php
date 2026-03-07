<?php

declare(strict_types=1);

namespace App\Models\Tenant\Assets;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

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
