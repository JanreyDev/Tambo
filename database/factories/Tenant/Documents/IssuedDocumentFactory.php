<?php

declare(strict_types=1);

namespace Database\Factories\Tenant\Documents;

use App\Models\Admin\Barangay;
use App\Models\Tenant\Documents\DocumentTemplate;
use App\Models\Tenant\Documents\IssuedDocument;
use App\Models\Tenant\Resident;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IssuedDocument>
 */
class IssuedDocumentFactory extends Factory
{
    protected $model = IssuedDocument::class;

    public function definition(): array
    {
        return [
            'barangay_id' => Barangay::factory(),
            'document_number' => str_pad((string) $this->faker->unique()->numberBetween(1, 99999), 8, '0', STR_PAD_LEFT),
            'template_id' => DocumentTemplate::factory(),
            'template_name' => 'Barangay Clearance',
            'constituent_type' => 'resident',
            'constituent_id' => Resident::factory(),
            'constituent_name' => $this->faker->name(),
            'constituent_number' => null,
            'purpose' => 'Employment',
            'or_number' => null,
            'or_amount' => null,
            'issued_date' => now()->toDateString(),
            'valid_until' => now()->addMonths(3)->toDateString(),
            'status' => 'issued',
            'sms_sent' => false,
            'custom_field_values' => [],
        ];
    }

    /** Document already in released status. */
    public function released(): static
    {
        return $this->state(['status' => 'released']);
    }

    /** Document linked to a specific resident. */
    public function forResident(Resident $resident): static
    {
        return $this->state([
            'barangay_id' => $resident->barangay_id,
            'constituent_type' => 'resident',
            'constituent_id' => $resident->id,
            'constituent_name' => $resident->full_name,
        ]);
    }
}
