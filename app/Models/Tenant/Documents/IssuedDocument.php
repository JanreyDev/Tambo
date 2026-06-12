<?php

declare(strict_types=1);

namespace App\Models\Tenant\Documents;

use App\Traits\BelongsToBarangay;
use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class IssuedDocument extends Model
{
    use BelongsToBarangay, HasAuditColumns, HasFactory, HasUuids, SoftDeletes;

    protected $table = 'issued_documents';

    protected $appends = ['pdf_url'];

    protected $fillable = [
        'barangay_id',
        'document_number',
        'template_id',
        'template_name',
        'constituent_type',
        'constituent_id',
        'constituent_name',
        'constituent_number',
        'purpose',
        'or_number',
        'or_amount',
        'ctc_number',
        'ctc_date',
        'ctc_place',
        'issued_date',
        'valid_until',
        'custom_field_values',
        'custom_content',
        'approved_by_left',
        'approved_by_right',
        'qr_code_url',
        'blockchain_hash',
        'pdf_file_id',
        'status',
        'sms_sent',
    ];

    protected function casts(): array
    {
        return [
            'or_amount' => 'decimal:2',
            'ctc_date' => 'date',
            'issued_date' => 'date',
            'valid_until' => 'date',
            'custom_field_values' => 'array',
            'sms_sent' => 'boolean',
        ];
    }

    /**
     * Computed PDF download URL for the frontend.
     */
    public function getPdfUrlAttribute(): ?string
    {
        if (! $this->pdf_file_id) {
            return null;
        }

        return url("/api/v1/issued-documents/{$this->id}/pdf");
    }
}
