<?php

declare(strict_types=1);

namespace App\Models\Platform;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlockchainRecord extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'blockchain_records';

    protected $fillable = [
        'barangay_id',
        'record_type',
        'record_id',
        'data_hash',
        'transaction_hash',
        'chain',
        'block_number',
        'verified_at',
        'verification_url',
    ];

    protected function casts(): array
    {
        return [
            'block_number' => 'integer',
            'verified_at' => 'datetime',
        ];
    }
}
