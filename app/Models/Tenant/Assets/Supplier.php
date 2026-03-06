<?php

declare(strict_types=1);

namespace App\Models\Tenant\Assets;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class Supplier extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

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
