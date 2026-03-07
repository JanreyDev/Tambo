<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class AdminUser extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use HasRoles;
    use HasUuids;
    use Notifiable;
    use SoftDeletes;

    /**
     * The table associated with the model.
     */
    protected $table = 'admin_users';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'email',
        'username',
        'password',
        'first_name',
        'last_name',
        'middle_name',
        'phone',
        'photo_url',
        'role',
        'status',
        'last_login_at',
        'last_login_ip',
        'preferences',
        'email_verified_at',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'preferences' => 'array',
            'last_login_at' => 'datetime',
            'email_verified_at' => 'datetime',
        ];
    }

    /**
     * Get the audit logs for this admin user.
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'admin_user_id');
    }

    /**
     * Get the full name of the admin user.
     */
    public function getFullNameAttribute(): string
    {
        $parts = array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
        ]);

        return implode(' ', $parts);
    }

    /**
     * Record a login event for this admin user.
     */
    public function recordLogin(string $ipAddress, ?string $userAgent = null): void
    {
        $this->update([
            'last_login_at' => now(),
            'last_login_ip' => $ipAddress,
        ]);

        AuditLog::log(
            adminUserId: $this->id,
            action: 'login',
            resourceType: 'admin_user',
            resourceId: $this->id,
            description: "Admin user {$this->username} logged in",
            metadata: ['user_agent' => $userAgent],
            ipAddress: $ipAddress,
            userAgent: $userAgent,
        );
    }
}
