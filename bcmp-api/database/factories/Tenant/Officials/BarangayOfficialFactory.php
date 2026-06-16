<?php

declare(strict_types=1);

namespace Database\Factories\Tenant\Officials;

use App\Models\Admin\Barangay;
use App\Models\Tenant\Officials\BarangayOfficial;
use App\Models\Tenant\Resident;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BarangayOfficial>
 */
class BarangayOfficialFactory extends Factory
{
    protected $model = BarangayOfficial::class;

    public function definition(): array
    {
        return [
            'barangay_id' => Barangay::factory(),
            'resident_id' => Resident::factory(),
            'position' => $this->faker->randomElement(['kapitan', 'kagawad', 'secretary', 'treasurer']),
            'committee' => null,
            'term_start' => '2025-07-01',
            'term_end' => '2028-06-30',
            'appointment_date' => null,
            'oath_date' => null,
            'is_elected' => true,
            'sort_order' => 0,
            'status' => 'active',
        ];
    }
}
