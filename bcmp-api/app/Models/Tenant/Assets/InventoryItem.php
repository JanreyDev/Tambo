<?php

declare(strict_types=1);

namespace App\Models\Tenant\Assets;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'inventory_items';

    protected $fillable = [
        'barangay_id',
        'category_id',
        'name',
        'description',
        'sku',
        'quantity',
        'minimum_stock',
        'unit',
        'location',
        'expiry_date',
        'condition',
        'photo_file_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'minimum_stock' => 'integer',
            'expiry_date' => 'date',
        ];
    }
}
