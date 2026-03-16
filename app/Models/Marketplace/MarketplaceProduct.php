<?php

declare(strict_types=1);

namespace App\Models\Marketplace;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MarketplaceProduct extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'marketplace_products';

    protected $fillable = [
        'name',
        'description',
        'category',
        'price',
        'original_price',
        'stock_qty',
        'unit',
        'sku',
        'supplier_name',
        'image_file_id',
        'rating',
        'total_orders',
        'is_active',
        'is_featured',
        'tag',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'original_price' => 'float',
            'rating' => 'float',
            'total_orders' => 'integer',
            'stock_qty' => 'integer',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }
}
