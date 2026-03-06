<?php

declare(strict_types=1);

namespace App\Models\Tenant\PublicPortal;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class PublicComplaint extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

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
