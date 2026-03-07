<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Admin\Barangay;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    /**
     * The current password being used by the factory.
     */
    protected static ?string $password = null;

    public function definition(): array
    {
        return [
            'barangay_id' => Barangay::factory(),
            'username' => $this->faker->unique()->userName(),
            'email' => $this->faker->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password123'),
            'phone' => '09' . $this->faker->numerify('#########'),
            'first_name' => $this->faker->firstName(),
            'middle_name' => $this->faker->optional()->lastName(),
            'last_name' => $this->faker->lastName(),
            'extension_name' => null,
            'is_super_admin' => false,
            'status' => 'active',
            'preferences' => [],
        ];
    }

    /**
     * Create a super admin user (not tied to a barangay).
     */
    public function superAdmin(): static
    {
        return $this->state(fn () => [
            'is_super_admin' => true,
            'barangay_id' => null,
        ]);
    }

    /**
     * Create a deactivated user.
     */
    public function inactive(): static
    {
        return $this->state(fn () => [
            'status' => 'deactivated',
        ]);
    }
}
