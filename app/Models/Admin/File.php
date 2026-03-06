<?php

declare(strict_types=1);

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

class File extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'files';

    protected $fillable = [
        'barangay_id',
        'original_name',
        'stored_name',
        'mime_type',
        'size_bytes',
        'storage_path',
        'storage_bucket',
        'uploaded_by',
        'category',
        'is_public',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'metadata' => 'array',
            'size_bytes' => 'integer',
        ];
    }
}
