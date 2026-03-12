<?php

declare(strict_types=1);

namespace App\Models\Psgc;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PsgcProvince extends Model
{
    protected $table = 'psgc_provinces';

    protected $primaryKey = 'psgc_code';

    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected $fillable = ['psgc_code', 'name', 'region_psgc'];

    public function region(): BelongsTo
    {
        return $this->belongsTo(PsgcRegion::class, 'region_psgc', 'psgc_code');
    }

    public function cities(): HasMany
    {
        return $this->hasMany(PsgcCity::class, 'province_psgc', 'psgc_code');
    }
}
