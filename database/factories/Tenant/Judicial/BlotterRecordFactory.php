<?php

declare(strict_types=1);

namespace Database\Factories\Tenant\Judicial;

use App\Models\Admin\Barangay;
use App\Models\Tenant\Judicial\BlotterRecord;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BlotterRecord>
 */
class BlotterRecordFactory extends Factory
{
    protected $model = BlotterRecord::class;

    public function definition(): array
    {
        $year = now()->format('Y');

        return [
            'barangay_id' => Barangay::factory(),
            'blotter_number' => 'BLT-'.$year.'-'.str_pad((string) $this->faker->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'filing_date' => now()->toDateString(),
            'complainant_name' => $this->faker->name(),
            'complainant_address' => $this->faker->address(),
            'complainant_mobile' => '09'.$this->faker->numerify('#########'),
            'respondent_name' => $this->faker->name(),
            'respondent_address' => $this->faker->address(),
            'respondent_mobile' => '09'.$this->faker->numerify('#########'),
            'incident_type' => $this->faker->randomElement(['Physical Injury', 'Theft', 'Noise Complaint', 'Trespassing', 'Verbal Abuse']),
            'incident_date' => $this->faker->date('Y-m-d', 'now'),
            'incident_time' => $this->faker->time('H:i'),
            'incident_place' => $this->faker->address(),
            'narrative' => $this->faker->paragraph(3),
            'status' => 'filed',
        ];
    }

    /**
     * Blotter that is settled.
     */
    public function settled(): static
    {
        return $this->state(fn () => [
            'status' => 'settled',
            'resolution' => $this->faker->paragraph(),
        ]);
    }

    /**
     * Blotter that is closed.
     */
    public function closed(): static
    {
        return $this->state(fn () => [
            'status' => 'closed',
            'resolution' => $this->faker->paragraph(),
        ]);
    }

    /**
     * Blotter for hearing.
     */
    public function forHearing(): static
    {
        return $this->state(fn () => [
            'status' => 'for_hearing',
        ]);
    }
}
