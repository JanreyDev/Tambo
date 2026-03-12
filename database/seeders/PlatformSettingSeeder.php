<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\PlatformSetting;
use Illuminate\Database\Seeder;

class PlatformSettingSeeder extends Seeder
{
    /**
     * Seed default platform settings.
     */
    public function run(): void
    {
        $settings = [
            // General settings
            [
                'group' => 'general',
                'key' => 'app_name',
                'value' => 'PrimeX Admin',
                'type' => 'string',
                'description' => 'Application display name',
            ],
            [
                'group' => 'general',
                'key' => 'maintenance_mode',
                'value' => 'false',
                'type' => 'boolean',
                'description' => 'Enable maintenance mode across all products',
            ],
            [
                'group' => 'general',
                'key' => 'support_email',
                'value' => 'support@primex.ventures',
                'type' => 'string',
                'description' => 'Support contact email',
            ],
            [
                'group' => 'general',
                'key' => 'timezone',
                'value' => 'Asia/Manila',
                'type' => 'string',
                'description' => 'Default timezone for the platform',
            ],

            // Notification settings
            [
                'group' => 'notifications',
                'key' => 'telegram_enabled',
                'value' => 'true',
                'type' => 'boolean',
                'description' => 'Enable Telegram notifications',
            ],
            [
                'group' => 'notifications',
                'key' => 'email_enabled',
                'value' => 'false',
                'type' => 'boolean',
                'description' => 'Enable email notifications',
            ],

            // Security settings
            [
                'group' => 'security',
                'key' => 'session_lifetime_minutes',
                'value' => '120',
                'type' => 'integer',
                'description' => 'Session lifetime in minutes',
            ],
            [
                'group' => 'security',
                'key' => 'max_login_attempts',
                'value' => '5',
                'type' => 'integer',
                'description' => 'Maximum login attempts before lockout',
            ],
            [
                'group' => 'security',
                'key' => 'token_expiry_days',
                'value' => '30',
                'type' => 'integer',
                'description' => 'API token expiry in days',
            ],

            // Branding settings
            [
                'group' => 'branding',
                'key' => 'primary_color',
                'value' => '#7c3aed',
                'type' => 'string',
                'description' => 'Primary brand color (violet/indigo)',
            ],
            [
                'group' => 'branding',
                'key' => 'company_name',
                'value' => 'PrimeX Ventures Inc.',
                'type' => 'string',
                'description' => 'Company name shown in footer and branding',
            ],
            [
                'group' => 'branding',
                'key' => 'logo_url',
                'value' => null,
                'type' => 'string',
                'description' => 'URL to the company logo',
            ],

            // BCMP Subscription Pricing (Baybayin tiers)
            [
                'group' => 'bcmp_pricing',
                'key' => 'munti_annual_price',
                'value' => '15000',
                'type' => 'integer',
                'description' => 'Munti tier annual price (PHP) -- up to 5 GB storage',
            ],
            [
                'group' => 'bcmp_pricing',
                'key' => 'gitna_annual_price',
                'value' => '25000',
                'type' => 'integer',
                'description' => 'Gitna tier annual price (PHP) -- up to 15 GB storage',
            ],
            [
                'group' => 'bcmp_pricing',
                'key' => 'malaki_annual_price',
                'value' => '45000',
                'type' => 'integer',
                'description' => 'Malaki tier annual price (PHP) -- up to 50 GB storage',
            ],
            [
                'group' => 'bcmp_pricing',
                'key' => 'sms_credit_price',
                'value' => '0.50',
                'type' => 'string',
                'description' => 'Price per SMS credit (PHP)',
            ],
            [
                'group' => 'bcmp_pricing',
                'key' => 'ai_credit_price',
                'value' => '1.00',
                'type' => 'string',
                'description' => 'Price per AI credit (PHP)',
            ],
            [
                'group' => 'bcmp_pricing',
                'key' => 'call_credit_price',
                'value' => '2.00',
                'type' => 'string',
                'description' => 'Price per call credit (PHP)',
            ],
            [
                'group' => 'bcmp_pricing',
                'key' => 'map_credit_price',
                'value' => '0.25',
                'type' => 'string',
                'description' => 'Price per map credit (PHP)',
            ],
            [
                'group' => 'bcmp_pricing',
                'key' => 'storage_warning_threshold',
                'value' => '80',
                'type' => 'integer',
                'description' => 'Storage usage percentage to trigger warning notification',
            ],
        ];

        foreach ($settings as $setting) {
            PlatformSetting::firstOrCreate(
                ['group' => $setting['group'], 'key' => $setting['key']],
                $setting,
            );
        }
    }
}
