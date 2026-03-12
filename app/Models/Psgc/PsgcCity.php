<?php

declare(strict_types=1);

namespace App\Models\Psgc;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PsgcCity extends Model
{
    protected $table = 'psgc_cities';

    protected $primaryKey = 'psgc_code';

    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected $fillable = ['psgc_code', 'name', 'province_psgc', 'city_class'];

    public function province(): BelongsTo
    {
        return $this->belongsTo(PsgcProvince::class, 'province_psgc', 'psgc_code');
    }

    public function barangays(): HasMany
    {
        return $this->hasMany(PsgcBarangay::class, 'city_psgc', 'psgc_code');
    }
}
