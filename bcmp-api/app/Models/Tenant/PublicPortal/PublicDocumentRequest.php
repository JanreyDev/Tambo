<?php

declare(strict_types=1);

namespace App\Models\Tenant\PublicPortal;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PublicDocumentRequest extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'public_document_requests';

    protected $fillable = [
        'barangay_id',
        'request_number',
        'requester_name',
        'requester_phone',
        'requester_email',
        'requester_resident_id',
        'document_type',
        'purpose',
        'delivery_method',
        'status',
        'estimated_date',
        'fee_amount',
        'payment_status',
        'issued_document_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'estimated_date' => 'date',
            'fee_amount' => 'decimal:2',
        ];
    }
}
