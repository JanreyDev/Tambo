<?php

declare(strict_types=1);

namespace Database\Factories\Tenant\Documents;

use App\Models\Tenant\Documents\DocumentTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentTemplate>
 */
class DocumentTemplateFactory extends Factory
{
    protected $model = DocumentTemplate::class;

    public function definition(): array
    {
        return [
            'barangay_id' => null, // null = system template by default
            'name' => $this->faker->words(3, true),
            'category' => $this->faker->randomElement(['Clearance', 'Residency', 'Indigency']),
            'constituent_type' => 'resident',
            'title' => 'TO WHOM IT MAY CONCERN',
            'salutation' => null,
            'content' => 'This is to certify that {{full_name}}, {{age}} years old, is a bonafide resident.',
            'merge_fields' => ['full_name', 'age', 'address'],
            'custom_inputs' => [],
            'custom_tables' => null,
            'approval_config' => [
                'left' => ['label' => 'Prepared by', 'position' => 'Barangay Secretary'],
                'right' => ['label' => 'Approved by', 'position' => 'Punong Barangay'],
            ],
            'settings' => [
                'show_qr' => true,
                'show_ctc' => false,
                'show_or' => false,
                'show_doc_no' => true,
                'show_expiry' => false,
                'show_photo' => false,
                'show_thumbmark' => false,
                'expiry_months' => 3,
            ],
            'status' => 'active',
            'sort_order' => 0,
        ];
    }

    /** System-level template (visible to all barangays). */
    public function system(): static
    {
        return $this->state(['barangay_id' => null]);
    }

    /** Barangay-owned template. */
    public function forBarangay(string $barangayId): static
    {
        return $this->state(['barangay_id' => $barangayId]);
    }
}
