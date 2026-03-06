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
            ['position' => 'Punong Barangay', 'name' => 'Ricardo Santos', 'prefix' => 'Hon.', 'committees' => ['Peace and Order', 'Finance'], 'sort_order' => 1],
            ['position' => 'Barangay Secretary', 'name' => 'Maria Reyes', 'prefix' => '', 'committees' => ['Administration'], 'sort_order' => 2],
            ['position' => 'Barangay Treasurer', 'name' => 'Jose Mendoza', 'prefix' => '', 'committees' => ['Finance', 'Budget'], 'sort_order' => 3],
            ['position' => 'Kagawad', 'name' => 'Pedro Villanueva', 'prefix' => 'Hon.', 'committees' => ['Education', 'Youth'], 'sort_order' => 4],
            ['position' => 'Kagawad', 'name' => 'Lorna Fernandez', 'prefix' => 'Hon.', 'committees' => ['Health', 'Sanitation'], 'sort_order' => 5],
            ['position' => 'Kagawad', 'name' => 'Eduardo Ramos', 'prefix' => 'Hon.', 'committees' => ['Infrastructure', 'Public Works'], 'sort_order' => 6],
            ['position' => 'Kagawad', 'name' => 'Rosalinda Villanueva', 'prefix' => 'Hon.', 'committees' => ['Women and Family', 'Social Welfare'], 'sort_order' => 7],
            ['position' => 'Kagawad', 'name' => 'Roberto Aquino', 'prefix' => 'Hon.', 'committees' => ['Agriculture', 'Environment'], 'sort_order' => 8],
            ['position' => 'Kagawad', 'name' => 'Gloria Bautista', 'prefix' => 'Hon.', 'committees' => ['Peace and Order', 'Public Safety'], 'sort_order' => 9],
            ['position' => 'Kagawad', 'name' => 'Armando Dizon', 'prefix' => 'Hon.', 'committees' => ['Sports', 'Recreation'], 'sort_order' => 10],
            ['position' => 'SK Chairperson', 'name' => 'Angelo Pascual', 'prefix' => 'Hon.', 'committees' => ['Youth Development'], 'sort_order' => 11],
        ];

        foreach ($officials as $data) {
            BarangayOfficial::create([
                'barangay_id' => $tambo->id,
                'position' => $data['position'],
                'full_name' => $data['name'],
                'prefix' => $data['prefix'],
                'committees' => $data['committees'],
                'term_start' => '2023',
                'term_end' => '2025',
                'is_active' => true,
                'show_on_certificate' => true,
                'sort_order' => $data['sort_order'],
            ]);
        }
    }
}
