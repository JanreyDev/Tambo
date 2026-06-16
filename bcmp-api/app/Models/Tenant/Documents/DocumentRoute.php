<?php

declare(strict_types=1);

namespace App\Models\Tenant\Documents;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentRoute extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'document_routes';

    protected $fillable = [
        'barangay_id',
        'document_title',
        'reference_number',
        'document_type',
        'origin',
        'from_office',
        'to_office',
        'current_holder_id',
        'remarks',
        'status',
        'attachment_file_ids',
        'route_history',
    ];

    protected function casts(): array
    {
        return [
            'attachment_file_ids' => 'array',
            'route_history' => 'array',
        ];
    }
}
