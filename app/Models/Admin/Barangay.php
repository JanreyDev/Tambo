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
        'city_municipality',
        'province',
        'zip_code',
        'logo_url',
        'seal_url',
        'municipality_logo_url',
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
        'motto',
        'office_hours',
        'established_year',
        'captain_name',
        'boundary_geojson',
        'boundary_fetched_at',
        'boundary_source',
        'setup_complete',
        'document_header_text',
        'document_footer_text',
        'sms_sender_name',
        'notification_preferences',
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
            'setup_complete' => 'boolean',
            'established_year' => 'integer',
            'boundary_geojson' => 'array',
            'boundary_fetched_at' => 'datetime',
            'notification_preferences' => 'array',
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

    public function files(): HasMany
    {
        return $this->hasMany(File::class);
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

    public function hasMapCredits(float $amount): bool
    {
        return $this->map_credit_balance >= $amount;
    }

    public function deductMapCredit(float $amount): void
    {
        $this->decrement('map_credit_balance', $amount);
    }

    public function hasCallCredits(float $amount): bool
    {
        return $this->call_credit_balance >= $amount;
    }

    public function deductCallCredit(float $amount): void
    {
        $this->decrement('call_credit_balance', $amount);
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
        $this->increment('storage_used_bytes', max(0, $bytes));
    }

    public function decrementStorage(int $bytes): void
    {
        $newValue = max(0, $this->storage_used_bytes - $bytes);
        $this->update(['storage_used_bytes' => $newValue]);
    }

    public function hasStorageCapacity(int $bytes): bool
    {
        return ($this->storage_used_bytes + $bytes) <= $this->storage_limit_bytes;
    }

    /**
     * Recalculate storage_used_bytes from the files table.
     * Use when data may be out of sync.
     */
    public function recalculateStorage(): int
    {
        $actualBytes = (int) $this->files()->sum('size_bytes');
        $this->update(['storage_used_bytes' => $actualBytes]);

        return $actualBytes;
    }
}
