<?php

declare(strict_types=1);

namespace App\Models\Platform;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemTemplate extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'system_templates';

    protected $fillable = [
        'name',
        'category',
        'content',
        'merge_fields',
        'settings',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'merge_fields' => 'array',
            'settings' => 'array',
            'is_default' => 'boolean',
        ];
    }
}
