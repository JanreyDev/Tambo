<?php

declare(strict_types=1);

namespace App\Models\Tenant\PublicPortal;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class BarangayPost extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'barangay_posts';

    protected $fillable = [
        'barangay_id',
        'title',
        'content',
        'category',
        'cover_image_file_id',
        'is_pinned',
        'published_at',
        'status',
        'author_id',
    ];

    protected function casts(): array
    {
        return [
            'is_pinned' => 'boolean',
            'published_at' => 'datetime',
        ];
    }
}
