<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\PlatformUpdate;
use Illuminate\Database\Seeder;

/**
 * Seeds real platform updates from the V5 build process.
 * Every feature Claude builds gets logged here.
 */
class PlatformUpdatesSeeder extends Seeder
{
    public function run(): void
    {
        $updates = [
            [
                'type' => 'feature',
                'category' => 'platform',
                'version' => '5.0.0-alpha.1',
                'title' => 'V5 BCMP Platform Initialized',
                'description' => 'Complete platform rebuild from scratch. Laravel 12 API + Next.js 16 frontend. New architecture: multi-tenant shared DB with PostgreSQL Row Level Security, offline-capable PWA design.',
                'icon' => 'Rocket',
                'is_published' => true,
                'published_at' => '2026-03-06 10:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'database',
                'version' => '5.0.0-alpha.1',
                'title' => 'Full Database Schema — 18 Migration Files',
                'description' => 'Complete database schema covering all 17 module groups: residents, households, establishments, officials, documents, judicial/KP, VAWC (encrypted), tanod, finance, inventory, disaster/DRRM, GAD, HRIS, public portal, AI conversations, blockchain records, and audit logs. 60+ tables designed for government data compliance.',
                'icon' => 'Database',
                'is_published' => true,
                'published_at' => '2026-03-06 14:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'design',
                'version' => '5.0.0-alpha.2',
                'title' => 'New Login Page with Immersive Branding',
                'description' => 'Redesigned login with dark left panel featuring floating feature cards (Residents, Documents, AI, Blockchain, SMS, Calling). Multi-tone gradient with grid pattern, decorative glows, and system status indicator.',
                'icon' => 'LogIn',
                'is_published' => true,
                'published_at' => '2026-03-07 09:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'design',
                'version' => '5.0.0-alpha.2',
                'title' => 'Dashboard with Credits Bar & Activity Table',
                'description' => 'New dashboard layout: SMS/Document/AI/Call credit cards at top, stat cards with colored borders, recent activity table with status badges, pending requests panel, and quick action buttons.',
                'icon' => 'LayoutDashboard',
                'is_published' => true,
                'published_at' => '2026-03-07 10:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'design',
                'version' => '5.0.0-alpha.2',
                'title' => 'Grouped Sidebar Navigation',
                'description' => 'Sidebar organized into logical groups: OVERVIEW (Dashboard, Map), RECORDS (Residents, Establishments, Lots, Voters), JUDICIAL (Cases, Blotter, VAWC), SERVICES (Documents, Requests, Reports), TOOLS (AI, Portal), OPERATIONS (Tanod, Finance, Inventory, Disaster, GAD, HRIS). Badge counts on active items.',
                'icon' => 'PanelLeft',
                'is_published' => true,
                'published_at' => '2026-03-07 10:30:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'design',
                'version' => '5.0.0-alpha.2',
                'title' => 'Light & Dark Mode with Accent Colors',
                'description' => 'Full theme system: Light, Dark, and System auto-detection. 8 customizable accent colors (Blue, Emerald, Violet, Rose, Amber, Cyan, Orange, Indigo). Settings saved per user in localStorage.',
                'icon' => 'Palette',
                'is_published' => true,
                'published_at' => '2026-03-07 11:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'residents',
                'version' => '5.0.0-alpha.2',
                'title' => 'Resident Flag System — Grey & Red Flags',
                'description' => 'Grey flag: shows number of barangays where a resident has records (cross-barangay detection). Red flag: auto cross-matches residents against active cases every midnight. Tellers see red flag immediately when a resident with a pending case requests services — no need to ask the lupon.',
                'icon' => 'Flag',
                'is_published' => true,
                'published_at' => '2026-03-07 12:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'platform',
                'version' => '5.0.0-alpha.2',
                'title' => 'Platform Updates Feed',
                'description' => 'This feature! Every development change is logged and displayed on the dashboard so users always know what\'s new. Categorized by type: New Feature, Improvement, Bug Fix, Security, Maintenance.',
                'icon' => 'Bell',
                'is_published' => true,
                'published_at' => '2026-03-07 13:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'security',
                'version' => '5.0.0-alpha.2',
                'title' => 'Sign-in Monitor',
                'description' => 'All login/logout events logged with device info, IP address, browser, OS, and approximate location. Visible in dashboard for administrators to monitor account access.',
                'icon' => 'ShieldCheck',
                'is_published' => true,
                'published_at' => '2026-03-07 13:30:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'platform',
                'version' => '5.0.0-alpha.2',
                'title' => 'Blockchain Verification Layer',
                'description' => 'First blockchain-integrated barangay system in the Philippines. Document hashes stored on-chain for tamper-proof verification. Certificates, clearances, and official records can be verified by anyone with a QR code.',
                'icon' => 'Link2',
                'is_published' => true,
                'published_at' => '2026-03-07 14:00:00',
                'author' => 'Claude',
            ],
        ];

        foreach ($updates as $update) {
            PlatformUpdate::create($update);
        }
    }
}
