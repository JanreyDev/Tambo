<?php

declare(strict_types=1);

namespace App\Models\Tenant\Tanod;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TanodTraining extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'tanod_trainings';

    protected $fillable = [
        'barangay_id',
        'tanod_id',
        'training_name',
        'provider',
        'date_completed',
        'certificate_file_id',
        'expiry_date',
    ];

    protected function casts(): array
    {
        return [
            'date_completed' => 'date',
            'expiry_date' => 'date',
        ];
    }
}
