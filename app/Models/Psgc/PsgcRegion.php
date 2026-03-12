<?php

declare(strict_types=1);

namespace App\Models\Psgc;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PsgcRegion extends Model
{
    protected $table = 'psgc_regions';

    protected $primaryKey = 'psgc_code';

    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected $fillable = ['psgc_code', 'name'];

    public function provinces(): HasMany
    {
        return $this->hasMany(PsgcProvince::class, 'region_psgc', 'psgc_code');
    }
}
