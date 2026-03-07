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
                'value' => 'Pulitika Admin',
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
        ];

        foreach ($settings as $setting) {
            PlatformSetting::firstOrCreate(
                ['group' => $setting['group'], 'key' => $setting['key']],
                $setting,
            );
        }
    }
}
