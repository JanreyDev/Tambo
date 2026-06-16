<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Admin\Barangay;
use Illuminate\Support\Facades\Log;

class MapService
{
    /**
     * Deduct map credit for a new resident pin placement.
     *
     * @return bool Whether the deduction was successful (false = insufficient credits)
     */
    public function chargeNewPin(Barangay $barangay, ?string $residentId = null): bool
    {
        $cost = (float) config('bcmp.map.cost_per_new_pin', 1.00);

        return $this->deduct($barangay, $cost, 'new_pin', $residentId);
    }

    /**
     * Deduct map credit for editing a resident pin location.
     *
     * @return bool Whether the deduction was successful (false = insufficient credits)
     */
    public function chargeEditPin(Barangay $barangay, ?string $residentId = null): bool
    {
        $cost = (float) config('bcmp.map.cost_per_edit_pin', 1.00);

        return $this->deduct($barangay, $cost, 'edit_pin', $residentId);
    }

    /**
     * Check if barangay has sufficient map credits.
     */
    public function hasCredits(Barangay $barangay, float $amount): bool
    {
        return $barangay->map_credit_balance >= $amount;
    }

    /**
     * Get cost for a new pin.
     */
    public static function costPerNewPin(): float
    {
        return (float) config('bcmp.map.cost_per_new_pin', 1.00);
    }

    /**
     * Get cost for an edit pin.
     */
    public static function costPerEditPin(): float
    {
        return (float) config('bcmp.map.cost_per_edit_pin', 1.00);
    }

    /**
     * Deduct map credits from barangay balance.
     */
    private function deduct(Barangay $barangay, float $cost, string $action, ?string $residentId): bool
    {
        if (! $this->hasCredits($barangay, $cost)) {
            Log::warning('Map credit deduction failed: insufficient balance', [
                'barangay_id' => $barangay->id,
                'balance' => $barangay->map_credit_balance,
                'required' => $cost,
                'action' => $action,
                'resident_id' => $residentId,
            ]);

            return false;
        }

        $barangay->decrement('map_credit_balance', $cost);

        Log::info('Map credit deducted', [
            'barangay_id' => $barangay->id,
            'cost' => $cost,
            'action' => $action,
            'resident_id' => $residentId,
            'remaining_balance' => $barangay->fresh()->map_credit_balance,
        ]);

        return true;
    }
}
