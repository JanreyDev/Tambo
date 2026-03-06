<?php

declare(strict_types=1);

namespace App\Models\Tenant\Documents;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasAuditColumns;

class DocumentTemplate extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasAuditColumns;

    protected $table = 'document_templates';

    protected $fillable = [
        'barangay_id',
        'name',
        'category',
        'constituent_type',
        'content',
        'title',
        'salutation',
        'merge_fields',
        'custom_inputs',
        'custom_tables',
        'approval_config',
        'settings',
        'status',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'merge_fields' => 'array',
            'custom_inputs' => 'array',
            'custom_tables' => 'array',
            'approval_config' => 'array',
            'settings' => 'array',
            'sort_order' => 'integer',
        ];
    }
}
