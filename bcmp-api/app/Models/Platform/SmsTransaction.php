<?php

declare(strict_types=1);

namespace App\Models\Platform;

use App\Models\Admin\Barangay;
use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsTransaction extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'sms_transactions';

    // Only created_at column exists (no updated_at)
    public const UPDATED_AT = null;

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

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    /**
     * Scope to filter by source type.
     */
    public function scopeForSource($query, string $source)
    {
        return $query->where('source', $source);
    }

    /**
     * Scope to filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
