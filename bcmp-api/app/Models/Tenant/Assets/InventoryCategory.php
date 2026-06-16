<?php

declare(strict_types=1);

namespace App\Models\Tenant\Assets;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryCategory extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'inventory_categories';

    protected $fillable = [
        'barangay_id',
        'name',
        'description',
    ];
}
