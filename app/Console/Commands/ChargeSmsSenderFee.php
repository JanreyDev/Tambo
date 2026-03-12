<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Admin\Barangay;
use App\Models\Platform\SmsTransaction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Charge monthly SMS sender name reservation fee to all active barangays.
 *
 * Runs on the 1st of each month. Deducts ₱300 from SMS credits for
 * maintaining the barangay's custom sender name on TxtBox.
 */
class ChargeSmsSenderFee extends Command
{
    protected $signature = 'bcmp:charge-sms-sender-fee';

    protected $description = 'Charge monthly ₱300 SMS sender name reservation fee to all active barangays';

    public function handle(): int
    {
        $fee = (float) config('bcmp.sms.monthly_sender_fee', 300.00);

        $barangays = Barangay::where('status', 'active')->get();

        $charged = 0;
        $insufficient = 0;

        foreach ($barangays as $barangay) {
            try {
                // Set tenant context for RLS
                if (DB::getDriverName() === 'pgsql') {
                    DB::statement("SET app.current_barangay_id = '{$barangay->id}'");
                }

                if ($barangay->hasSmsCredits($fee)) {
                    $barangay->deductSmsCredit($fee);

                    // Log as SMS transaction
                    SmsTransaction::create([
                        'barangay_id' => $barangay->id,
                        'recipient_phone' => 'SYSTEM',
                        'message' => 'Monthly SMS sender name reservation fee',
                        'credit_cost' => $fee,
                        'source' => 'sender_name_fee',
                        'source_id' => null,
                        'status' => 'charged',
                        'provider_response' => [
                            'type' => 'monthly_fee',
                            'month' => now()->format('Y-m'),
                            'remaining_balance' => $barangay->fresh()->sms_credit_balance,
                        ],
                    ]);

                    $charged++;
                } else {
                    // Log insufficient balance but don't block -- barangay will need to top up
                    SmsTransaction::create([
                        'barangay_id' => $barangay->id,
                        'recipient_phone' => 'SYSTEM',
                        'message' => 'Monthly SMS sender name reservation fee -- INSUFFICIENT CREDITS',
                        'credit_cost' => $fee,
                        'source' => 'sender_name_fee',
                        'source_id' => null,
                        'status' => 'failed',
                        'provider_response' => [
                            'type' => 'monthly_fee',
                            'month' => now()->format('Y-m'),
                            'reason' => 'insufficient_credits',
                            'balance' => (float) $barangay->sms_credit_balance,
                            'required' => $fee,
                        ],
                    ]);

                    $insufficient++;

                    Log::warning('SMS sender fee: insufficient credits', [
                        'barangay_id' => $barangay->id,
                        'barangay_name' => $barangay->name,
                        'balance' => $barangay->sms_credit_balance,
                        'required' => $fee,
                    ]);
                }
            } catch (\Throwable $e) {
                Log::error('SMS sender fee charge failed', [
                    'barangay_id' => $barangay->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("SMS sender fee charged: {$charged} barangays, {$insufficient} insufficient credits.");

        Log::info('Monthly SMS sender fee processed', [
            'fee' => $fee,
            'charged' => $charged,
            'insufficient' => $insufficient,
            'total_barangays' => $barangays->count(),
        ]);

        return self::SUCCESS;
    }
}
