<?php

declare(strict_types=1);

namespace App\Models\Tenant\PublicPortal;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BarangayPost extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

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
