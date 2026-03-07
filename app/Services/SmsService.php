<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Admin\Barangay;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    private const COST_PER_SMS = 0.50;

    /**
     * Send an SMS via TxtBox API.
     * Deducts SMS credit (0.50 per message) from barangay balance on success.
     */
    public function send(string $phone, string $message, ?Barangay $barangay = null): bool
    {
        // Check SMS credits if barangay provided
        if ($barangay && ! $barangay->hasSmsCredits(self::COST_PER_SMS)) {
            Log::warning('SMS not sent: insufficient SMS credits', [
                'barangay_id' => $barangay->id,
                'balance' => $barangay->sms_credit_balance,
                'required' => self::COST_PER_SMS,
            ]);

            return false;
        }

        $apiKey = config('services.txtbox.api_key');

        if (! $apiKey) {
            Log::warning('TxtBox API key not configured, SMS not sent', [
                'phone' => substr($phone, 0, 4).'****',
            ]);

            return false;
        }

        try {
            $response = Http::withHeaders([
                'X-TXTBOX-Auth' => $apiKey,
            ])->post(config('services.txtbox.url'), [
                'message' => $message,
                'number' => $this->normalizePhone($phone),
            ]);

            if ($response->successful()) {
                // Deduct SMS credit on successful send
                if ($barangay) {
                    $barangay->deductSmsCredit(self::COST_PER_SMS);
                }

                Log::info('SMS sent successfully', [
                    'phone' => substr($phone, 0, 4).'****',
                    'barangay_id' => $barangay?->id,
                    'cost' => self::COST_PER_SMS,
                    'remaining_balance' => $barangay?->fresh()?->sms_credit_balance,
                ]);

                return true;
            }

            Log::error('SMS send failed', [
                'phone' => substr($phone, 0, 4).'****',
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        } catch (\Throwable $e) {
            Log::error('SMS send exception', [
                'phone' => substr($phone, 0, 4).'****',
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Generate and send an OTP code.
     * Deducts SMS credit from barangay if provided.
     *
     * @return string|null The generated OTP code, or null if send failed
     */
    public function sendOtp(string $phone, string $purpose = 'verification', ?Barangay $barangay = null): ?string
    {
        $otp = (string) random_int(100000, 999999);

        $message = match ($purpose) {
            'phone_verification' => "Your kapitan.ph phone verification code is {$otp}. Valid for 5 minutes.",
            'login_2fa' => "Your kapitan.ph login code is {$otp}. Valid for 5 minutes. Do not share this code.",
            default => "Your kapitan.ph verification code is {$otp}. Valid for 5 minutes.",
        };

        $sent = $this->send($phone, $message, $barangay);

        if (! $sent) {
            return null;
        }

        // Store OTP in cache with 5-minute TTL (only after successful send)
        $cacheKey = "otp:{$purpose}:{$this->normalizePhone($phone)}";
        Cache::put($cacheKey, $otp, now()->addMinutes(5));

        return $otp;
    }

    /**
     * Verify an OTP code.
     */
    public function verifyOtp(string $phone, string $code, string $purpose = 'verification'): bool
    {
        $cacheKey = "otp:{$purpose}:{$this->normalizePhone($phone)}";
        $storedOtp = Cache::get($cacheKey);

        if (! $storedOtp || $storedOtp !== $code) {
            return false;
        }

        // Delete used OTP
        Cache::forget($cacheKey);

        return true;
    }

    /**
     * Get the cost per SMS.
     */
    public static function costPerSms(): float
    {
        return self::COST_PER_SMS;
    }

    /**
     * Normalize Philippine phone number to 09XXXXXXXXX format.
     */
    private function normalizePhone(string $phone): string
    {
        // Remove spaces, dashes, parentheses
        $phone = preg_replace('/[\s\-\(\)]/', '', $phone);

        // Convert +63 to 0
        if (str_starts_with($phone, '+63')) {
            $phone = '0'.substr($phone, 3);
        }

        // Convert 63 (without +) to 0
        if (str_starts_with($phone, '63') && strlen($phone) === 12) {
            $phone = '0'.substr($phone, 2);
        }

        return $phone;
    }
}
