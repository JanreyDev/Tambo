<?php

declare(strict_types=1);

namespace App\Models\Tenant\PublicPortal;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class BarangayWebsiteConfig extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'barangay_website_configs';

    protected $fillable = [
        'barangay_id',
        'template',
        'hero_title',
        'hero_subtitle',
        'hero_image_file_id',
        'about_content',
        'mission',
        'vision',
        'core_values',
        'contact_info',
        'social_links',
        'custom_sections',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'contact_info' => 'array',
            'social_links' => 'array',
            'custom_sections' => 'array',
            'is_published' => 'boolean',
        ];
    }
}
