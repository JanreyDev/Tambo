<?php

declare(strict_types=1);

namespace App\Models\Platform;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SubscriptionPlan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'subscription_plans';

    protected $fillable = [
        'name',
        'price_annual',
        'price_quarterly',
        'features',
        'storage_limit_bytes',
        'sms_credits_included',
    ];

    protected function casts(): array
    {
        return [
            'price_annual' => 'decimal:2',
            'price_quarterly' => 'decimal:2',
            'features' => 'array',
            'storage_limit_bytes' => 'integer',
            'sms_credits_included' => 'integer',
        ];
    }
}
