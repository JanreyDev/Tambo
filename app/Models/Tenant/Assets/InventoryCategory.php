<?php

declare(strict_types=1);

namespace App\Models\Tenant\Assets;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class InventoryCategory extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'inventory_categories';

    protected $fillable = [
        'barangay_id',
        'name',
        'description',
    ];
}
