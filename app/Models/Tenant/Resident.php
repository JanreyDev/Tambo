<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\CivilStatus;
use App\Enums\ResidentStatus;
use App\Models\Tenant\Records\Household;
use App\Models\Tenant\Records\ResidentSectoralTag;
use App\Traits\BelongsToBarangay;
use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;

class Resident extends Model
{
    use BelongsToBarangay, HasAuditColumns, HasFactory, HasUuids, Searchable, SoftDeletes;

    protected $fillable = [
        'barangay_id',
        'resident_number',
        'registration_date',
        'resident_type',
        'transfer_date',

        // Personal
        'first_name',
        'middle_name',
        'last_name',
        'extension_name',
        'mothers_maiden_name',
        'date_of_birth',
        'place_of_birth',
        'sex',
        'civil_status',
        'citizenship',
        'blood_type',
        'height_cm',
        'weight_kg',
        'complexion',
        'religion',
        'ethnicity',

        // Contact
        'email',
        'mobile_number',
        'telephone',

        // Address
        'purok',
        'sitio',
        'house_block_lot',
        'street',
        'subdivision_village',
        'zip_code',

        // Voter
        'is_voter',
        'is_resident_voter',
        'voter_precinct_number',
        'last_voted_year',

        // Government IDs (encrypted)
        'philhealth_number_encrypted',
        'sss_gsis_number_encrypted',
        'pagibig_number_encrypted',
        'tin_number_encrypted',

        // Education
        'highest_education',
        'education_details',

        // Employment
        'occupation',
        'employer',
        'monthly_income_range',
        'source_of_income',

        // Biometric file references
        'photo_file_id',
        'signature_file_id',
        'left_thumbmark_file_id',
        'right_thumbmark_file_id',

        // Emergency
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_address',
        'emergency_contact_relationship',

        // Status
        'is_head_of_household',
        'household_id',
        'profile_completion_pct',
        'status',
        'approved_at',
        'approved_by',
        'qr_code_data',
    ];

    protected function casts(): array
    {
        return [
            'civil_status' => CivilStatus::class,
            'status' => ResidentStatus::class,
            'date_of_birth' => 'date',
            'registration_date' => 'date',
            'transfer_date' => 'date',
            'is_voter' => 'boolean',
            'is_resident_voter' => 'boolean',
            'is_head_of_household' => 'boolean',
            'height_cm' => 'decimal:1',
            'weight_kg' => 'decimal:1',
            'education_details' => 'array',
            'profile_completion_pct' => 'integer',
            'approved_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    public function sectoralTags(): HasMany
    {
        return $this->hasMany(ResidentSectoralTag::class);
    }

    public function issuedDocuments(): HasMany
    {
        return $this->hasMany(\App\Models\Tenant\IssuedDocument::class, 'constituent_id')
            ->where('constituent_type', 'resident');
    }

    // ── Meilisearch ──

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'barangay_id' => $this->barangay_id,
            'resident_number' => $this->resident_number,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'extension_name' => $this->extension_name,
            'full_name' => "{$this->last_name}, {$this->first_name} {$this->middle_name}",
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'sex' => $this->sex,
            'purok' => $this->purok,
            'mobile_number' => $this->mobile_number,
            'status' => $this->status?->value,
        ];
    }

    // ── Accessors ──

    public function getFullNameAttribute(): string
    {
        $parts = array_filter([
            $this->first_name,
            $this->middle_name ? mb_substr($this->middle_name, 0, 1).'.' : null,
            $this->extension_name,
        ]);

        return strtoupper($this->last_name ?? '').', '.implode(' ', $parts);
    }

    public function getAgeAttribute(): ?int
    {
        return $this->date_of_birth?->age;
    }

    // ── Helpers ──

    public function isSkEligible(): bool
    {
        $age = $this->age;

        return $age !== null && $age >= 15 && $age <= 30;
    }

    public function isSeniorCitizen(): bool
    {
        $age = $this->age;

        return $age !== null && $age >= 60;
    }

    public function isVoter(): bool
    {
        return $this->is_voter === true;
    }

    public function calculateProfileCompletion(): int
    {
        $fields = [
            'first_name', 'last_name', 'date_of_birth', 'place_of_birth',
            'sex', 'civil_status', 'citizenship', 'mobile_number',
            'purok', 'occupation', 'photo_file_id', 'is_voter',
            'highest_education', 'religion', 'blood_type',
        ];

        $filled = collect($fields)->filter(fn ($field) => ! empty($this->$field))->count();

        return (int) round(($filled / count($fields)) * 100);
    }
}
