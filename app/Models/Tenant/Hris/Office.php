<?php

declare(strict_types=1);

namespace App\Models\Tenant\Hris;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Office extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'offices';

    protected $fillable = [
        'barangay_id',
        'name',
        'description',
        'head_user_id',
    ];
}
