<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Admin\Barangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, HasUuids, Notifiable, SoftDeletes, HasApiTokens, HasRoles;

    protected $fillable = [
        'barangay_id',
        'username',
        'email',
        'password',
        'phone',
        'first_name',
        'middle_name',
        'last_name',
        'extension_name',
        'photo_url',
        'is_super_admin',
        'last_login_at',
        'last_login_ip',
        'status',
        'preferences',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_super_admin' => 'boolean',
            'preferences' => 'array',
        ];
    }

    // ── Relationships ──

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    // ── Accessors ──

    public function getFullNameAttribute(): string
    {
        $parts = array_filter([
            $this->last_name,
            $this->first_name,
            $this->middle_name ? mb_substr($this->middle_name, 0, 1) . '.' : null,
            $this->extension_name,
        ]);

        return implode(', ', [$this->last_name ?? '']) . ', '
            . implode(' ', array_filter([
                $this->first_name,
                $this->middle_name ? mb_substr($this->middle_name, 0, 1) . '.' : null,
                $this->extension_name,
            ]));
    }

    // ── Helpers ──

    public function isSuperAdmin(): bool
    {
        return $this->is_super_admin === true;
    }

    public function belongsToBarangay(string $barangayId): bool
    {
        return $this->barangay_id === $barangayId;
    }

    public function recordLogin(string $ip, ?string $userAgent = null): void
    {
        $this->update([
            'last_login_at' => now(),
            'last_login_ip' => $ip,
        ]);

        // Dispatch login event for dashboard real-time feed
        // LoginRecorded::dispatch($this, $ip, $userAgent);
    }
}
