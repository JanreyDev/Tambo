<?php

declare(strict_types=1);

namespace App\Models\Tenant\Assets;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'suppliers';

    protected $fillable = [
        'barangay_id',
        'name',
        'contact_person',
        'phone',
        'email',
        'address',
        'tin',
    ];
}
