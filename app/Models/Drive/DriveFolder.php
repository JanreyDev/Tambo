<?php

declare(strict_types=1);

namespace App\Models\Drive;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DriveFolder extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'barangay_id',
        'user_id',
        'name',
        'parent_id',
        'color',
        'is_shared_with_barangay',
    ];

    protected $casts = [
        'is_shared_with_barangay' => 'boolean',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(DriveFolder::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(DriveFolder::class, 'parent_id');
    }
}
