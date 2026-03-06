<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Platform Update — "What's New" / "Platform Updates"
 *
 * Tracks all development changes visible to users on the dashboard.
 * NOT tenant-scoped — platform-wide updates visible to all barangays.
 */
class PlatformUpdate extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'type',
        'category',
        'version',
        'title',
        'description',
        'icon',
        'badge_color',
        'is_published',
        'is_breaking',
        'published_at',
        'commit_hash',
        'author',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'is_breaking' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    // Scopes

    public function scopePublished($query)
    {
        return $query->where('is_published', true)->orderByDesc('published_at');
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeInCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    // Helpers

    public function getTypeBadgeColor(): string
    {
        return match ($this->type) {
            'feature' => '#3b82f6',
            'improvement' => '#8b5cf6',
            'bugfix' => '#ef4444',
            'security' => '#f59e0b',
            'maintenance' => '#6b7280',
            default => '#3b82f6',
        };
    }

    public function getTypeLabel(): string
    {
        return match ($this->type) {
            'feature' => 'New Feature',
            'improvement' => 'Improvement',
            'bugfix' => 'Bug Fix',
            'security' => 'Security',
            'maintenance' => 'Maintenance',
            default => $this->type,
        };
    }
}
