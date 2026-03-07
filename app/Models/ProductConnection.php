<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductConnection extends Model
{
    use HasFactory;
    use HasUuids;

    /**
     * The table associated with the model.
     */
    protected $table = 'product_connections';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'product_slug',
        'product_name',
        'api_base_url',
        'api_token',
        'status',
        'last_health_check_at',
        'last_health_status',
        'settings',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'api_token' => 'encrypted',
            'last_health_check_at' => 'datetime',
        ];
    }

    /**
     * Check if the product connection is healthy.
     */
    public function isHealthy(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->last_health_check_at === null) {
            return false;
        }

        // Consider unhealthy if last check was more than 10 minutes ago
        if ($this->last_health_check_at->diffInMinutes(now()) > 10) {
            return false;
        }

        return $this->last_health_status === 'healthy';
    }
}
