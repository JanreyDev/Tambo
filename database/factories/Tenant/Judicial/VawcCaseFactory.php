<?php

declare(strict_types=1);

namespace Database\Factories\Tenant\Judicial;

use App\Models\Admin\Barangay;
use App\Models\Tenant\Judicial\VawcCase;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VawcCase>
 */
class VawcCaseFactory extends Factory
{
    protected $model = VawcCase::class;

    public function definition(): array
    {
        $year = now()->format('Y');

        return [
            'barangay_id' => Barangay::factory(),
            'case_number' => 'VAWC-'.$year.'-'.str_pad((string) $this->faker->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'incident_type' => $this->faker->randomElement(['Physical Violence', 'Sexual Violence', 'Psychological Violence', 'Economic Abuse']),
            'filing_date' => now()->toDateString(),
            'incident_date' => $this->faker->date('Y-m-d', 'now'),
            'incident_time' => $this->faker->time('H:i'),
            'incident_place' => $this->faker->address(),
            'narrative_encrypted' => $this->faker->paragraph(3),
            'victim_name_encrypted' => $this->faker->name('female'),
            'victim_address_encrypted' => $this->faker->address(),
            'victim_phone_encrypted' => '09'.$this->faker->numerify('#########'),
            'victim_civil_status' => $this->faker->randomElement(['single', 'married', 'widowed', 'separated']),
            'respondent_name_encrypted' => $this->faker->name('male'),
            'respondent_address_encrypted' => $this->faker->address(),
            'respondent_phone_encrypted' => '09'.$this->faker->numerify('#########'),
            'respondent_relationship' => $this->faker->randomElement(['husband', 'live-in partner', 'ex-husband', 'boyfriend']),
            'respondent_civil_status' => $this->faker->randomElement(['single', 'married']),
            'bpo_issued' => false,
            'tpo_referred' => false,
            'ppo_referred' => false,
            'referred_to_pnp' => false,
            'referred_to_dswd' => false,
            'status' => 'under_investigation',
            'access_log' => [],
        ];
    }

    /**
     * Case with BPO issued.
     */
    public function withBpo(): static
    {
        return $this->state(fn () => [
            'bpo_issued' => true,
            'bpo_issued_date' => now()->toDateString(),
            'bpo_expiry_date' => now()->addDays(15)->toDateString(),
        ]);
    }

    /**
     * Resolved case.
     */
    public function resolved(): static
    {
        return $this->state(fn () => [
            'status' => 'resolved',
        ]);
    }

    /**
     * Referred case.
     */
    public function referred(): static
    {
        return $this->state(fn () => [
            'status' => 'referred',
            'referred_to_pnp' => true,
            'referred_to_dswd' => true,
        ]);
    }
}
