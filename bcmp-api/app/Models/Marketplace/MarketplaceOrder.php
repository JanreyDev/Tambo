<?php

declare(strict_types=1);

namespace App\Models\Marketplace;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MarketplaceOrder extends Model
{
    use BelongsToBarangay, HasUuids, SoftDeletes;

    protected $table = 'marketplace_orders';

    protected $fillable = [
        'barangay_id',
        'order_number',
        'status',
        'subtotal',
        'total_amount',
        'delivery_address',
        'contact_person',
        'contact_number',
        'notes',
        'payment_method',
        'payment_status',
        'po_number',
        'expected_delivery_date',
        'delivered_date',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'float',
            'total_amount' => 'float',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(MarketplaceOrderItem::class, 'order_id');
    }
}
