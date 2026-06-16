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
        // Clear existing entries to avoid duplicates on re-seed
        PlatformUpdate::query()->forceDelete();

        $updates = [
            // ── March 6: Foundation ──
            [
                'type' => 'feature',
                'category' => 'platform',
                'version' => '5.0.0-alpha.1',
                'title' => 'V5 BCMP Platform Initialized',
                'description' => 'Complete platform rebuild from scratch. Laravel 12 API + Next.js 16 frontend. Multi-tenant shared DB with PostgreSQL Row Level Security, offline-capable PWA design.',
                'icon' => 'Rocket',
                'is_published' => true,
                'published_at' => '2026-03-06 10:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'database',
                'version' => '5.0.0-alpha.1',
                'title' => 'Full Database Schema — 33 Migrations',
                'description' => 'Complete database schema covering residents, households, establishments, officials, documents, judicial/KP, VAWC (encrypted), tanod, finance, inventory, disaster/DRRM, GAD, HRIS, public portal, AI conversations, blockchain records, and audit logs. 60+ tables designed for government data compliance.',
                'icon' => 'Database',
                'is_published' => true,
                'published_at' => '2026-03-06 14:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'security',
                'category' => 'platform',
                'version' => '5.0.0-alpha.1',
                'title' => 'Production Server Hardening',
                'description' => 'fail2ban, UFW firewall, SSH hardening (key-only, MaxAuthTries 3), Cloudflare SSL Full mode, health check monitoring with auto-restart. All secrets in env vars, zero hardcoded credentials.',
                'icon' => 'ShieldCheck',
                'is_published' => true,
                'published_at' => '2026-03-06 16:00:00',
                'author' => 'Claude',
            ],

            // ── March 7: Core UI ──
            [
                'type' => 'feature',
                'category' => 'design',
                'version' => '5.0.0-alpha.2',
                'title' => 'Login Page with Immersive Branding',
                'description' => 'Redesigned login with dark left panel featuring floating feature cards (Residents, Documents, AI, Blockchain, SMS, Calling). System status indicator and barangay branding.',
                'icon' => 'LogIn',
                'is_published' => true,
                'published_at' => '2026-03-07 09:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'design',
                'version' => '5.0.0-alpha.2',
                'title' => 'Grouped Sidebar Navigation',
                'description' => 'Sidebar organized into logical groups: Overview, Records, Judicial, Services, Tools, Operations. Collapsible sections, badge counts, and bottom-pinned links for Settings, Help, and What\'s New.',
                'icon' => 'PanelLeft',
                'is_published' => true,
                'published_at' => '2026-03-07 10:30:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'design',
                'version' => '5.0.0-alpha.2',
                'title' => 'Light & Dark Mode with 8 Accent Colors',
                'description' => 'Full theme system: Light, Dark, and System auto-detection. 8 customizable accent colors (Blue, Emerald, Violet, Rose, Amber, Cyan, Orange, Indigo). Settings saved per user.',
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
                'description' => 'Grey flag: shows number of barangays where a resident has records. Red flag: auto cross-matches against active cases every midnight. Tellers see red flags immediately when a flagged resident requests services.',
                'icon' => 'Flag',
                'is_published' => true,
                'published_at' => '2026-03-07 12:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'security',
                'version' => '5.0.0-alpha.2',
                'title' => 'Sign-in Monitor',
                'description' => 'All login/logout events logged with device info, IP address, browser, OS, and approximate location. Visible on dashboard for administrators.',
                'icon' => 'ShieldCheck',
                'is_published' => true,
                'published_at' => '2026-03-07 13:30:00',
                'author' => 'Claude',
            ],

            // ── March 13-14: Production ──
            [
                'type' => 'feature',
                'category' => 'platform',
                'version' => '5.0.0-beta.1',
                'title' => 'CI/CD Pipeline — Zero-Downtime Deploys',
                'description' => 'Automated GitLab CI/CD for all 4 repos. Lint, security audit, test, build, and atomic swap deployment. PHP-FPM graceful reload, PM2 hot reload. Previous release kept for instant rollback.',
                'icon' => 'Workflow',
                'is_published' => true,
                'published_at' => '2026-03-13 10:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'maintenance',
                'category' => 'platform',
                'version' => '5.0.0-beta.1',
                'title' => 'Infrastructure Consolidation',
                'description' => 'Consolidated 6 droplets down to 3. Staging infrastructure deleted — production-only architecture. Monthly hosting cost reduced from $311 to $135.',
                'icon' => 'Server',
                'is_published' => true,
                'published_at' => '2026-03-14 08:00:00',
                'author' => 'Claude',
            ],

            // ── March 15: Core Features ──
            [
                'type' => 'feature',
                'category' => 'dashboard',
                'version' => '5.0.0-beta.2',
                'title' => 'Live Dashboard — Stats, Activity & Sign-ins',
                'description' => 'Dashboard wired to real API data. Total residents, pending requests, recent blotters, quick action buttons. Activity feed and sign-in logs displayed in real-time. Skeleton loading states.',
                'icon' => 'LayoutDashboard',
                'is_published' => true,
                'published_at' => '2026-03-15 09:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'residents',
                'version' => '5.0.0-beta.2',
                'title' => 'Residents List — Full CRUD with Search & Filters',
                'description' => 'Paginated resident list with real-time search, sort by name/age/registration date, and multi-filter support (status, sex, civil status, voter, PWD, senior, indigenous). Avatars, purok addresses, and last transaction shown per row.',
                'icon' => 'Users',
                'is_published' => true,
                'published_at' => '2026-03-15 10:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'residents',
                'version' => '5.0.0-beta.2',
                'title' => 'New Resident Registration Form',
                'description' => 'Full registration form with photo capture/upload, auto-geocoding, PSGC-based address, and all personal/contact/government ID fields. Create and edit modes properly branched — no more silent duplicate creation.',
                'icon' => 'UserPlus',
                'is_published' => true,
                'published_at' => '2026-03-15 11:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'residents',
                'version' => '5.0.0-beta.2',
                'title' => 'Resident Detail Page — 11 Tabs',
                'description' => 'Comprehensive resident profile with left panel photo/bio and 11 tabbed sections: Personal, Address, Sectoral, Education, Work, Business, Government IDs, Assistance, Pets, Relatives, Emergency Contacts. Profile completion bar and Mabini AI button.',
                'icon' => 'UserCheck',
                'is_published' => true,
                'published_at' => '2026-03-15 12:00:00',
                'author' => 'Claude',
            ],

            // ── March 16: Census & Map ──
            [
                'type' => 'feature',
                'category' => 'residents',
                'version' => '5.0.0-beta.3',
                'title' => 'Census Mode — Mobile-First Field Registration',
                'description' => 'Full-screen 11-step wizard optimized for mobile field workers. Steps: Personal Info, Address, Family, Sectoral, Education, Employment, Government IDs, Assistance, Pets, Photo, Review & Submit. Offline-capable with draft auto-save. Double-submit prevention and comprehensive validation.',
                'icon' => 'ClipboardList',
                'is_published' => true,
                'is_breaking' => false,
                'published_at' => '2026-03-16 08:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'map',
                'version' => '5.0.0-beta.3',
                'title' => 'Interactive Google Maps Dashboard',
                'description' => 'Full-featured map view with Google Maps integration. Resident markers with photo pins, barangay boundary overlay from Nominatim, heatmap mode, stat cards (total plotted, male/female/senior/PWD). Click markers to view resident details. Draggable markers for coordinate updates.',
                'icon' => 'Map',
                'is_published' => true,
                'published_at' => '2026-03-16 09:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'improvement',
                'category' => 'residents',
                'version' => '5.0.0-beta.3',
                'title' => 'Photo Upload with Camera Capture',
                'description' => 'Resident photos can be captured directly from device camera or uploaded from file. Auto-resize to 800px, JPEG compression. Offline photos saved locally and uploaded on reconnect. BCMP watermark in empty state.',
                'icon' => 'Camera',
                'is_published' => true,
                'published_at' => '2026-03-16 09:30:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'platform',
                'version' => '5.0.0-beta.3',
                'title' => 'EN/FIL Language Switcher',
                'description' => 'Full English and Filipino translation support across all UI labels, navigation, headers, help pages, and notifications. Toggle in header. Filipino translations use natural Taglish for technical terms.',
                'icon' => 'Languages',
                'is_published' => true,
                'published_at' => '2026-03-16 10:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'platform',
                'version' => '5.0.0-beta.3',
                'title' => 'Help & Manual — In-App Documentation',
                'description' => 'Searchable help page with step-by-step guides for all major features: login, residents, documents, blotter, requests, reports, settings. Written in Taglish at grade 5 reading level. Tips & tricks section included.',
                'icon' => 'HelpCircle',
                'is_published' => true,
                'published_at' => '2026-03-16 10:30:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'feature',
                'category' => 'platform',
                'version' => '5.0.0-beta.3',
                'title' => 'What\'s New — Platform Updates Page',
                'description' => 'This page! Browse all platform updates filtered by type: New Feature, Improvement, Bug Fix, Security, Maintenance. Grouped by date with version tags. Auto-refreshes on visit.',
                'icon' => 'Sparkles',
                'is_published' => true,
                'published_at' => '2026-03-16 11:00:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'security',
                'category' => 'platform',
                'version' => '5.0.0-beta.3',
                'title' => 'Full Security Audit & Hardening',
                'description' => 'Double-submit prevention on all forms, input validation with maxLength constraints, touch target compliance (44px minimum), CORS restricted, rate limiting on auth endpoints, Sanctum token expiry, no stack traces in production.',
                'icon' => 'Shield',
                'is_published' => true,
                'published_at' => '2026-03-16 11:30:00',
                'author' => 'Claude',
            ],
            [
                'type' => 'improvement',
                'category' => 'design',
                'version' => '5.0.0-beta.3',
                'title' => 'Accessibility & Tanga-Proof Improvements',
                'description' => 'All interactive elements now meet 44px minimum touch target. Aria-labels on icon buttons. Focus indicators on keyboard navigation. Form error messages with screen reader support. Confirmation dialogs on destructive actions.',
                'icon' => 'Accessibility',
                'is_published' => true,
                'published_at' => '2026-03-16 12:00:00',
                'author' => 'Claude',
            ],
        ];

        foreach ($updates as $update) {
            PlatformUpdate::create($update);
        }
    }
}
