<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Vault\VaultEntry;
use Illuminate\Database\Seeder;

class VaultEntrySeeder extends Seeder
{
    public function run(): void
    {
        $entries = [
            // Guide steps (ordered)
            [
                'category' => 'guide',
                'title' => 'Kung Bakit Mo Binabasa Ito',
                'content' => 'Kung nababasa mo ito, ibig sabihin may nangyari sa akin o kailangan mong malaman kung paano tatakbo ang PrimeX kung wala ako. Huwag kang mag-panic. Ang vault na ito ay ginawa para sa inyo -- para malaman ninyo kung ano ang mayroon tayo, sino ang kausap, at paano magpapatuloy ang lahat.',
                'sort_order' => 1,
                'metadata' => ['icon' => 'heart'],
            ],
            [
                'category' => 'guide',
                'title' => 'Ang Mga Negosyo Natin',
                'content' => 'Ang PrimeX Ventures Inc. ay isang software company na nagse-serve sa mga local government units (LGUs) sa Pilipinas. Ang main product natin ay ang BCMP (kapitan.ph) -- barangay management system. Mayroon din tayong LGMP para sa provincial government ng Tarlac, at PDMP para sa political campaigns. Basahin ang Business Overview section para sa buong detalye.',
                'sort_order' => 2,
                'metadata' => ['icon' => 'briefcase'],
            ],
            [
                'category' => 'guide',
                'title' => 'Mga Taong Kailangan Mong Kausapin',
                'content' => 'Sa Team Contacts section, makikita mo ang lahat ng importanteng tao -- team members, clients, at suppliers. Si Ryan Calvelo ang may server access. Si Howard Garcia ang nag-training sa clients. Si Jerry Ballonado ang operations. Kung may technical emergency, si Ryan ang unang tawagan.',
                'sort_order' => 3,
                'metadata' => ['icon' => 'users'],
            ],
            [
                'category' => 'guide',
                'title' => 'Pera at Finances',
                'content' => 'Sa Financial section, makikita mo ang bank accounts, revenue sources, at recurring expenses. Ang pinaka-importante: ang BCMP subscriptions (kapitan.ph) ay ang main source of income. Ang LGMP Tarlac ay nagbibigay ng monthly income. Siguraduhing hindi mawawala ang mga ito.',
                'sort_order' => 4,
                'metadata' => ['icon' => 'peso'],
            ],
            [
                'category' => 'guide',
                'title' => 'Infrastructure at Systems',
                'content' => 'Lahat ng servers, domains, at databases ay naka-list sa Infrastructure section. Lahat ay nasa DigitalOcean at Cloudflare. Kung may server na down, si Ryan ang pwedeng tumulong. Ang login credentials ay nasa secure location na alam ko lang. Kung kailangan, contact Ryan para sa emergency access.',
                'sort_order' => 5,
                'metadata' => ['icon' => 'server'],
            ],
            [
                'category' => 'guide',
                'title' => 'Mga Clients Natin',
                'content' => 'Sa Clients section, makikita mo ang lahat ng active clients at kung magkano ang binabayaran nila. Ang mga barangay clients sa Zambales ang pinakamarami. Si Governor Christian Yap ng Tarlac ang LGMP client. Importante na ma-maintain ang relationship sa kanila.',
                'sort_order' => 6,
                'metadata' => ['icon' => 'handshake'],
            ],
            [
                'category' => 'guide',
                'title' => 'Legal at Compliance',
                'content' => 'Sa Legal section, makikita mo ang business registration, contracts, at compliance requirements. Ang PrimeX Ventures Inc. ay registered sa SEC. Ang lahat ng products ay dapat compliant sa RA 10173 (Data Privacy Act). Kung may legal concern, consult a lawyer immediately.',
                'sort_order' => 7,
                'metadata' => ['icon' => 'scale'],
            ],

            // Business Overview
            [
                'category' => 'business_overview',
                'title' => 'PrimeX Ventures Inc.',
                'content' => "Ang PrimeX Ventures Inc. ay isang software company na nag-specialize sa government technology solutions para sa Philippine Local Government Units (LGUs).\n\nMga Products:\n- BCMP (kapitan.ph) -- Barangay management system, ~50+ barangay clients, ~P1M+/year\n- LGMP -- Provincial government management, Tarlac Province, P250k/month\n- PDMP -- Political data management, P1M-3M per campaign cycle\n\nAng company ay registered bilang PrimeX Ventures Inc. sa SEC.",
                'sort_order' => 1,
                'metadata' => null,
            ],

            // Financial
            [
                'category' => 'financial',
                'title' => 'Revenue Summary',
                'content' => "Monthly Revenue Sources:\n- BCMP Subscriptions: ~P80k-100k/month (50+ barangays, average P19,568/year each)\n- LGMP Tarlac: P250,000/month (embedded in provincial payroll)\n- PDMP: Per campaign (P1M-3M when active)\n\nMonthly Expenses:\n- DigitalOcean Infrastructure: ~P16,000/month (~$279 USD)\n- Domain Renewals: Various (Cloudflare managed)\n- Anthropic API (AI): Usage-based\n\nNote: I-update ito kapag nagbago ang amounts. Ito ay placeholder.",
                'sort_order' => 1,
                'metadata' => ['warning' => 'Placeholder data -- update with real amounts'],
            ],

            // Team Contacts
            [
                'category' => 'team_contacts',
                'title' => 'PrimeX Team',
                'content' => "Team Members:\n- Ryan Calvelo -- Chief Systems Engineer, server access holder\n- Howard Garcia -- Gov Liaison, client training\n- Jerry Ballonado -- Operations Director\n- Jan Rey Mina -- Lead Application Engineer (standby)\n- Melvin Nogoy -- Developer (standby)\n- Joseph Mangubat -- Junior Developer (standby)\n\nNote: I-update ang contact numbers dito. Ito ay placeholder.",
                'sort_order' => 1,
                'metadata' => ['warning' => 'Add contact numbers'],
            ],

            // Clients
            [
                'category' => 'clients',
                'title' => 'Active Clients',
                'content' => "BCMP Clients:\n- ~50+ barangays primarily in Zambales\n- Average subscription: P19,568/year per barangay\n\nLGMP Client:\n- Tarlac Province under Governor Christian Yap\n- Departments: PGO, PPDO, PSOC, more incoming\n- Revenue: P250,000/month\n\nNote: I-update ang detailed client list dito. Ito ay placeholder.",
                'sort_order' => 1,
                'metadata' => ['warning' => 'Add detailed client list with contacts'],
            ],

            // Infrastructure
            [
                'category' => 'infrastructure',
                'title' => 'Servers at Domains',
                'content' => "DigitalOcean Droplets:\n- primex-production (152.42.223.52) -- Main production server\n- PrimeXV4 (128.199.172.45) -- Legacy BCMP V4\n- tarlac-assets (137.184.249.255) -- LGMP/Tarlac\n- spa-call (152.42.238.242) -- SPACALL\n- BarangayMo (174.138.21.22) -- Barangaymo\n\nDomains:\n- primex.ventures -- Corporate site\n- kapitan.ph -- BCMP\n- tarlac.ph -- LGMP\n- spacall.ph -- SPACALL\n\nCloud Provider: DigitalOcean (Singapore region)\nDNS Provider: Cloudflare\n\nNote: Credentials are NOT stored here for security. Contact Ryan for emergency server access.",
                'sort_order' => 1,
                'metadata' => null,
            ],

            // Legal
            [
                'category' => 'legal',
                'title' => 'Business Registration',
                'content' => "Company: PrimeX Ventures Inc.\nRegistration: SEC registered\n\nCompliance Requirements:\n- RA 10173 (Data Privacy Act) -- applies to all products handling personal data\n- PDMP must be on completely separate infrastructure from BCMP/LGMP (legal isolation)\n\nPrevious Company Names:\n1. Jeager System Development (DTI)\n2. Velcro Tech Philippines, Inc.\n3. Homstead Philippines Trading Inc.\n4. PrimeX Ventures Inc. (current)\n\nNote: I-update ang SEC registration details at contracts dito. Ito ay placeholder.",
                'sort_order' => 1,
                'metadata' => ['warning' => 'Add SEC registration number and contract details'],
            ],
        ];

        foreach ($entries as $data) {
            $entry = new VaultEntry;
            $entry->category = $data['category'];
            $entry->title = $data['title'];
            $entry->setContent($data['content']);
            $entry->sort_order = $data['sort_order'];
            $entry->is_active = true;
            $entry->metadata = $data['metadata'];
            $entry->created_at = now();
            $entry->updated_at = now();
            $entry->save();
        }
    }
}
