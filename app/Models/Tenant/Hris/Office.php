<?php

declare(strict_types=1);

namespace App\Models\Tenant\Hris;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class Office extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'offices';

    protected $fillable = [
        'barangay_id',
        'name',
        'description',
        'head_user_id',
    ];
}
