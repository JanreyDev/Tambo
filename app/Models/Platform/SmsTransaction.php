<?php

declare(strict_types=1);

namespace App\Models\Platform;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class SmsTransaction extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'sms_transactions';

    protected $fillable = [
        'barangay_id',
        'recipient_phone',
        'message',
        'credit_cost',
        'source',
        'source_id',
        'status',
        'provider_response',
    ];

    protected function casts(): array
    {
        return [
            'credit_cost' => 'decimal:2',
            'provider_response' => 'array',
        ];
    }
}
