<?php

declare(strict_types=1);

namespace App\Models\Platform;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SignInLog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'sign_in_logs';

    protected $fillable = [
        'user_id',
        'barangay_id',
        'action',
        'ip_address',
        'user_agent',
        'device_type',
        'browser',
        'os',
        'location',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }
}
