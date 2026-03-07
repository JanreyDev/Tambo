<?php

declare(strict_types=1);

namespace Database\Factories\Admin;

use App\Enums\BarangayStatus;
use App\Models\Admin\Barangay;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Barangay>
 */
class BarangayFactory extends Factory
{
    protected $model = Barangay::class;

    public function definition(): array
    {
        return [
            'psgc_code' => $this->faker->unique()->numerify('##########'),
            'name' => 'Brgy. '.$this->faker->unique()->word(),
            'municipality_psgc' => $this->faker->numerify('##########'),
            'province_psgc' => $this->faker->numerify('##########'),
            'region_psgc' => $this->faker->numerify('##########'),
            'full_address' => $this->faker->address(),
            'contact_phone' => '09'.$this->faker->numerify('#########'),
            'contact_email' => $this->faker->safeEmail(),
            'population' => $this->faker->numberBetween(500, 50000),
            'status' => BarangayStatus::Active,
            'subscription_plan' => 'standard',
            'subscription_expires_at' => now()->addYear(),
            'sms_credit_balance' => 100.00,
            'call_credit_balance' => 50.00,
            'map_credit_balance' => 50.00,
            'ai_credit_balance' => 50.00,
            'storage_used_bytes' => 0,
            'storage_limit_bytes' => 2147483648, // 2GB
            'settings' => [],
        ];
    }

    /**
     * Barangay with active status.
     */
    public function active(): static
    {
        return $this->state(fn () => [
            'status' => BarangayStatus::Active,
        ]);
    }

    /**
     * Barangay with suspended status.
     */
    public function suspended(): static
    {
        return $this->state(fn () => [
            'status' => BarangayStatus::Suspended,
        ]);
    }

    /**
     * Barangay with deactivated status.
     */
    public function deactivated(): static
    {
        return $this->state(fn () => [
            'status' => BarangayStatus::Deactivated,
        ]);
    }

    /**
     * Barangay with expired subscription.
     */
    public function expiredSubscription(): static
    {
        return $this->state(fn () => [
            'subscription_expires_at' => now()->subMonth(),
        ]);
    }
}
