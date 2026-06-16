<?php

declare(strict_types=1);

namespace App\Models\Tenant\PublicPortal;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PublicComplaint extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'public_complaints';

    protected $fillable = [
        'barangay_id',
        'complaint_number',
        'complainant_name',
        'complainant_phone',
        'complainant_email',
        'complainant_resident_id',
        'subject',
        'description',
        'category',
        'location',
        'attachment_file_ids',
        'assigned_to_id',
        'resolution',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'attachment_file_ids' => 'array',
        ];
    }
}
