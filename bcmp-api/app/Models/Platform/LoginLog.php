<?php

declare(strict_types=1);

namespace App\Models\Platform;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'attempted_username',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
