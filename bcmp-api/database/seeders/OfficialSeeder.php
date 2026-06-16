<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Admin\Barangay;
use App\Models\Tenant\Officials\BarangayOfficial;
use Illuminate\Database\Seeder;

class OfficialSeeder extends Seeder
{
    public function run(): void
    {
        $tambo = Barangay::where('name', 'Tambo')->first();

        $officials = [
            ['position' => 'punong_barangay', 'committee' => 'Peace and Order, Finance', 'sort_order' => 1],
            ['position' => 'secretary', 'committee' => 'Administration', 'sort_order' => 2],
            ['position' => 'treasurer', 'committee' => 'Finance, Budget', 'sort_order' => 3],
            ['position' => 'sb_member', 'committee' => 'Education, Youth', 'sort_order' => 4],
            ['position' => 'sb_member', 'committee' => 'Health, Sanitation', 'sort_order' => 5],
            ['position' => 'sb_member', 'committee' => 'Infrastructure, Public Works', 'sort_order' => 6],
            ['position' => 'sb_member', 'committee' => 'Women and Family, Social Welfare', 'sort_order' => 7],
            ['position' => 'sb_member', 'committee' => 'Agriculture, Environment', 'sort_order' => 8],
            ['position' => 'sb_member', 'committee' => 'Peace and Order, Public Safety', 'sort_order' => 9],
            ['position' => 'sb_member', 'committee' => 'Sports, Recreation', 'sort_order' => 10],
            ['position' => 'sk_chairman', 'committee' => 'Youth Development', 'sort_order' => 11],
        ];

        foreach ($officials as $data) {
            BarangayOfficial::create([
                'barangay_id' => $tambo->id,
                'position' => $data['position'],
                'committee' => $data['committee'],
                'term_start' => '2023-06-30',
                'term_end' => '2025-06-30',
                'is_elected' => true,
                'sort_order' => $data['sort_order'],
                'status' => 'active',
            ]);
        }
    }
}
