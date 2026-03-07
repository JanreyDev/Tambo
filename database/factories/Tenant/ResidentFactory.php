<?php

declare(strict_types=1);

namespace Database\Factories\Tenant;

use App\Enums\CivilStatus;
use App\Enums\ResidentStatus;
use App\Models\Admin\Barangay;
use App\Models\Tenant\Resident;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Resident>
 */
class ResidentFactory extends Factory
{
    protected $model = Resident::class;

    public function definition(): array
    {
        return [
            'barangay_id' => Barangay::factory(),
            'resident_number' => $this->faker->unique()->numerify('######'),
            'registration_date' => now()->toDateString(),
            'resident_type' => 'permanent',
            'first_name' => $this->faker->firstName(),
            'middle_name' => $this->faker->optional()->lastName(),
            'last_name' => $this->faker->lastName(),
            'date_of_birth' => $this->faker->date('Y-m-d', '-18 years'),
            'place_of_birth' => $this->faker->city(),
            'sex' => $this->faker->randomElement(['male', 'female']),
            'civil_status' => $this->faker->randomElement(CivilStatus::cases()),
            'citizenship' => 'Filipino',
            'mobile_number' => '09' . $this->faker->numerify('#########'),
            'purok' => 'Purok ' . $this->faker->numberBetween(1, 7),
            'street' => $this->faker->streetAddress(),
            'is_voter' => $this->faker->boolean(70),
            'is_resident_voter' => $this->faker->boolean(50),
            'status' => ResidentStatus::Active,
            'profile_completion_pct' => $this->faker->numberBetween(30, 100),
        ];
    }

    /**
     * Create a deceased resident.
     */
    public function deceased(): static
    {
        return $this->state(fn () => [
            'status' => ResidentStatus::Deceased,
        ]);
    }

    /**
     * Create a transferred resident.
     */
    public function transferred(): static
    {
        return $this->state(fn () => [
            'status' => ResidentStatus::Transferred,
            'transfer_date' => now()->subMonths(3)->toDateString(),
        ]);
    }

    /**
     * Create an archived resident.
     */
    public function archived(): static
    {
        return $this->state(fn () => [
            'status' => ResidentStatus::Archived,
        ]);
    }

    /**
     * Create a voter.
     */
    public function voter(): static
    {
        return $this->state(fn () => [
            'is_voter' => true,
            'is_resident_voter' => true,
            'voter_precinct_number' => $this->faker->numerify('####A'),
        ]);
    }

    /**
     * Create a senior citizen.
     */
    public function seniorCitizen(): static
    {
        return $this->state(fn () => [
            'date_of_birth' => $this->faker->date('Y-m-d', '-65 years'),
        ]);
    }

    /**
     * Create an SK-eligible youth (15-30 years old).
     */
    public function skEligible(): static
    {
        return $this->state(fn () => [
            'date_of_birth' => now()->subYears(20)->toDateString(),
        ]);
    }
}
