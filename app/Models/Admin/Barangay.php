<?php

declare(strict_types=1);

namespace App\Models\Admin;

use App\Enums\BarangayStatus;
use App\Models\User;
use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Barangay extends Model
{
    use HasAuditColumns, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'psgc_code',
        'name',
        'municipality_psgc',
        'province_psgc',
        'region_psgc',
        'full_address',
        'logo_url',
        'seal_url',
        'contact_phone',
        'contact_email',
        'website_url',
        'latitude',
        'longitude',
        'population',
        'land_area_hectares',
        'officials_term',
        'status',
        'subscription_plan',
        'subscription_expires_at',
        'sms_credit_balance',
        'call_credit_balance',
        'map_credit_balance',
        'ai_credit_balance',
        'storage_used_bytes',
        'storage_limit_bytes',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'status' => BarangayStatus::class,
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'land_area_hectares' => 'decimal:2',
            'sms_credit_balance' => 'decimal:2',
            'call_credit_balance' => 'decimal:2',
            'map_credit_balance' => 'decimal:2',
            'ai_credit_balance' => 'decimal:2',
            'storage_used_bytes' => 'integer',
            'storage_limit_bytes' => 'integer',
            'settings' => 'array',
            'subscription_expires_at' => 'datetime',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function residents(): HasMany
    {
        return $this->hasMany(\App\Models\Tenant\Resident::class);
    }

    public function isActive(): bool
    {
        return $this->status === BarangayStatus::Active;
    }

    public function hasSubscription(): bool
    {
        return $this->subscription_expires_at !== null
            && $this->subscription_expires_at->isFuture();
    }

    public function hasSmsCredits(float $amount = 0.50): bool
    {
        return $this->sms_credit_balance >= $amount;
    }

    public function deductSmsCredit(float $amount = 0.50): void
    {
        $this->decrement('sms_credit_balance', $amount);
    }

    public function hasAiCredits(float $amount): bool
    {
        return $this->ai_credit_balance >= $amount;
    }

    public function deductAiCredit(float $amount): void
    {
        $this->decrement('ai_credit_balance', $amount);
    }

    /**
     * Get AI markup percentage for this barangay.
     * Checks barangay-level settings first, falls back to global config.
     */
    public function getAiMarkup(): float
    {
        $settings = $this->settings ?? [];

        return (float) ($settings['ai_markup_percentage'] ?? config('services.anthropic.markup_percentage', 60.00));
    }

    /**
     * Get AI model override for this barangay (if set).
     */
    public function getAiModel(): string
    {
        $settings = $this->settings ?? [];

        return $settings['ai_model'] ?? config('services.anthropic.model');
    }

    public function incrementStorage(int $bytes): void
    {
        $this->increment('storage_used_bytes', $bytes);
    }

    public function hasStorageCapacity(int $bytes): bool
    {
        return ($this->storage_used_bytes + $bytes) <= $this->storage_limit_bytes;
    }
}
