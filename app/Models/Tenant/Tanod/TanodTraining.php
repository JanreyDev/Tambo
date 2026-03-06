<?php

declare(strict_types=1);

namespace App\Models\Tenant\Tanod;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class TanodTraining extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

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
