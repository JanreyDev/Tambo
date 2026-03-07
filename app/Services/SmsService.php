<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Admin\Barangay;
use App\Models\Platform\SmsTransaction;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Cost per 160-character SMS segment (in PHP pesos).
     * If message exceeds 160 chars, each additional 160-char block costs another segment.
     * Example: 161 chars = 2 segments = 1.00, 320 chars = 2 segments = 1.00, 321 chars = 3 segments = 1.50
     */
    private const COST_PER_SEGMENT = 0.50;

    private const CHARS_PER_SEGMENT = 160;

    /**
     * Calculate the number of SMS segments for a message.
     */
    public static function calculateSegments(string $message): int
    {
        $length = mb_strlen($message);

        return $length === 0 ? 1 : (int) ceil($length / self::CHARS_PER_SEGMENT);
    }

    /**
     * Calculate the cost of sending an SMS based on message length.
     */
    public static function calculateCost(string $message): float
    {
        return self::calculateSegments($message) * self::COST_PER_SEGMENT;
    }

    /**
     * Get the cost per SMS segment.
     */
    public static function costPerSegment(): float
    {
        return self::COST_PER_SEGMENT;
    }

    /**
     * Send an SMS via TxtBox API.
     * Calculates cost based on message segments (ceil(length/160) * 0.50).
     * Logs every SMS to sms_transactions table.
     * Deducts SMS credit from barangay balance on success.
     *
     * @param  string  $source  Source context (e.g., 'phone_verification', 'password_reset', 'notification')
     * @param  string|null  $sourceId  Related entity UUID (e.g., user_id, resident_id)
     */
    public function send(
        string $phone,
        string $message,
        ?Barangay $barangay = null,
        string $source = 'manual',
        ?string $sourceId = null,
    ): bool {
        $cost = self::calculateCost($message);
        $segments = self::calculateSegments($message);
        $normalizedPhone = $this->normalizePhone($phone);
        $maskedPhone = substr($normalizedPhone, 0, 4).'****'.substr($normalizedPhone, -2);

        // Check SMS credits if barangay provided
        if ($barangay && ! $barangay->hasSmsCredits($cost)) {
            Log::warning('SMS not sent: insufficient SMS credits', [
                'barangay_id' => $barangay->id,
                'balance' => $barangay->sms_credit_balance,
                'required' => $cost,
                'segments' => $segments,
            ]);

            // Log the failed attempt
            $this->logTransaction($barangay, $normalizedPhone, $message, $cost, $source, $sourceId, 'failed', [
                'reason' => 'insufficient_credits',
                'balance' => (float) $barangay->sms_credit_balance,
            ]);

            return false;
        }

        $apiKey = config('services.txtbox.api_key');

        if (! $apiKey) {
            Log::warning('TxtBox API key not configured, SMS not sent', [
                'phone' => $maskedPhone,
            ]);

            $this->logTransaction($barangay, $normalizedPhone, $message, $cost, $source, $sourceId, 'failed', [
                'reason' => 'api_key_not_configured',
            ]);

            return false;
        }

        try {
            $response = Http::withHeaders([
                'X-TXTBOX-Auth' => $apiKey,
            ])->post(config('services.txtbox.url'), [
                'message' => $message,
                'number' => $normalizedPhone,
            ]);

            if ($response->successful()) {
                // Deduct SMS credit on successful send
                if ($barangay) {
                    $barangay->deductSmsCredit($cost);
                }

                // Log successful transaction
                $this->logTransaction($barangay, $normalizedPhone, $message, $cost, $source, $sourceId, 'sent', [
                    'provider' => 'txtbox',
                    'segments' => $segments,
                    'response_status' => $response->status(),
                ]);

                Log::info('SMS sent successfully', [
                    'phone' => $maskedPhone,
                    'barangay_id' => $barangay?->id,
                    'segments' => $segments,
                    'cost' => $cost,
                    'remaining_balance' => $barangay?->fresh()?->sms_credit_balance,
                    'source' => $source,
                ]);

                return true;
            }

            // Log failed transaction
            $this->logTransaction($barangay, $normalizedPhone, $message, $cost, $source, $sourceId, 'failed', [
                'provider' => 'txtbox',
                'response_status' => $response->status(),
                'response_body' => $response->body(),
            ]);

            Log::error('SMS send failed', [
                'phone' => $maskedPhone,
                'status' => $response->status(),
                'body' => $response->body(),
                'source' => $source,
            ]);

            return false;
        } catch (\Throwable $e) {
            $this->logTransaction($barangay, $normalizedPhone, $message, $cost, $source, $sourceId, 'failed', [
                'reason' => 'exception',
                'error' => $e->getMessage(),
            ]);

            Log::error('SMS send exception', [
                'phone' => $maskedPhone,
                'error' => $e->getMessage(),
                'source' => $source,
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
            'phone_verification' => "Your Kapitan verification code is {$otp}. Valid for 5 minutes.",
            'password_reset' => "Your Kapitan password reset code is {$otp}. Valid for 5 minutes. Do not share this code.",
            'login_2fa' => "Your Kapitan login code is {$otp}. Valid for 5 minutes. Do not share this code.",
            default => "Your Kapitan verification code is {$otp}. Valid for 5 minutes.",
        };

        $sent = $this->send($phone, $message, $barangay, $purpose);

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
     * Normalize Philippine phone number to 09XXXXXXXXX format.
     */
    public function normalizePhone(string $phone): string
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

    /**
     * Log every SMS activity to sms_transactions table.
     * Sets tenant context for RLS if barangay is provided.
     */
    private function logTransaction(
        ?Barangay $barangay,
        string $phone,
        string $message,
        float $cost,
        string $source,
        ?string $sourceId,
        string $status,
        array $providerResponse = [],
    ): void {
        try {
            // Set tenant context for RLS
            if ($barangay && DB::getDriverName() === 'pgsql') {
                DB::statement("SET app.current_barangay_id = '{$barangay->id}'");
            }

            SmsTransaction::create([
                'barangay_id' => $barangay?->id,
                'recipient_phone' => $phone,
                'message' => $message,
                'credit_cost' => $cost,
                'source' => $source,
                'source_id' => $sourceId,
                'status' => $status,
                'provider_response' => $providerResponse,
            ]);
        } catch (\Throwable $e) {
            // Never let logging failure break SMS flow
            Log::error('Failed to log SMS transaction', [
                'error' => $e->getMessage(),
                'phone' => substr($phone, 0, 4).'****',
                'source' => $source,
            ]);
        }
    }
}
