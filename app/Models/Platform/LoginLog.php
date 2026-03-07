<?php

declare(strict_types=1);

namespace App\Models\Platform;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoginLog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'login_logs';

    /**
     * The login_logs table only has created_at (no updated_at).
     */
    public $timestamps = true;

    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'barangay_id',
        'ip_address',
        'user_agent',
        'action',
        'device_info',
    ];

    protected function casts(): array
    {
        return [
            'device_info' => 'array',
        ];
    }
}
