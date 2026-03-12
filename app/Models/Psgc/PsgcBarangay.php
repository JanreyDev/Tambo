<?php

declare(strict_types=1);

namespace App\Models\Psgc;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PsgcBarangay extends Model
{
    protected $table = 'psgc_barangays';

    protected $primaryKey = 'psgc_code';

    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected $fillable = ['psgc_code', 'name', 'city_psgc', 'population', 'population_year'];

    protected function casts(): array
    {
        return [
            'population' => 'integer',
            'population_year' => 'integer',
        ];
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(PsgcCity::class, 'city_psgc', 'psgc_code');
    }
}
