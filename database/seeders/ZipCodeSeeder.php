<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seed Philippine zip codes into psgc_cities table.
 *
 * Source: Philippine Postal Corporation (PHLPost) official zip code directory.
 * Maps city PSGC codes to their primary zip codes.
 *
 * Usage: php artisan db:seed --class=ZipCodeSeeder
 */
class ZipCodeSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding zip codes...');

        $zipCodes = $this->getZipCodes();
        $updated = 0;

        foreach ($zipCodes as $cityName => $zip) {
            $count = DB::table('psgc_cities')
                ->where('name', 'like', "%{$cityName}%")
                ->whereNull('zip_code')
                ->update(['zip_code' => $zip]);
            $updated += $count;
        }

        $this->command->info("  {$updated} cities updated with zip codes.");
    }

    private function getZipCodes(): array
    {
        return [
            // NCR - Metro Manila
            'City of Manila' => '1000',
            'Quezon City' => '1100',
            'City of Caloocan' => '1400',
            'City of Las Piñas' => '1740',
            'City of Makati' => '1200',
            'City of Malabon' => '1470',
            'City of Mandaluyong' => '1550',
            'City of Marikina' => '1800',
            'City of Muntinlupa' => '1770',
            'City of Navotas' => '1485',
            'City of Parañaque' => '1700',
            'Paranaque' => '1700',
            'City of Pasig' => '1600',
            'Pasay City' => '1300',
            'Pateros' => '1620',
            'City of San Juan' => '1500',
            'City of Taguig' => '1630',
            'City of Valenzuela' => '1440',

            // Region III - Central Luzon
            'City of Balanga' => '2100',
            'City of Malolos' => '3000',
            'City of Meycauayan' => '3020',
            'City of San Jose Del Monte' => '3023',
            'City of Angeles' => '2009',
            'City of San Fernando' => '2000',
            'City of Olongapo' => '2200',
            'Subic' => '2209',
            'City of Cabanatuan' => '3100',
            'City of Palayan' => '3132',
            'City of Tarlac' => '2300',
            'Tarlac City' => '2300',

            // Region I - Ilocos
            'City of Laoag' => '2900',
            'City of Vigan' => '2700',
            'City of San Fernando (La Union)' => '2500',
            'City of Dagupan' => '2400',
            'City of Alaminos' => '2404',
            'City of Urdaneta' => '2428',

            // Region II - Cagayan Valley
            'City of Tuguegarao' => '3500',
            'City of Santiago' => '3311',
            'City of Cauayan' => '3305',
            'City of Ilagan' => '3300',

            // Region IV-A - CALABARZON
            'City of Antipolo' => '1870',
            'City of Bacoor' => '4102',
            'City of Batangas' => '4200',
            'City of Calamba' => '4027',
            'City of Cavite' => '4100',
            'City of Dasmariñas' => '4114',
            'City of General Trias' => '4107',
            'City of Imus' => '4103',
            'City of Lipa' => '4217',
            'City of Lucena' => '4301',
            'City of San Pablo' => '4000',
            'City of San Pedro' => '4023',
            'City of Santa Rosa' => '4026',
            'City of Tagaytay' => '4120',
            'City of Tanauan' => '4232',
            'Biñan' => '4024',

            // Region IV-B - MIMAROPA
            'City of Calapan' => '5200',
            'City of Puerto Princesa' => '5300',

            // Region V - Bicol
            'City of Legazpi' => '4500',
            'City of Naga' => '4400',
            'City of Iriga' => '4431',
            'City of Sorsogon' => '4700',
            'City of Masbate' => '5400',
            'City of Tabaco' => '4511',

            // Region VI - Western Visayas
            'City of Iloilo' => '5000',
            'City of Bacolod' => '6100',
            'City of Roxas' => '5800',
            'City of Kabankalan' => '6111',

            // Region VII - Central Visayas
            'City of Cebu' => '6000',
            'City of Lapu-Lapu' => '6015',
            'City of Mandaue' => '6014',
            'City of Talisay' => '6045',
            'City of Tagbilaran' => '6300',
            'City of Dumaguete' => '6200',

            // Region VIII - Eastern Visayas
            'City of Tacloban' => '6500',
            'City of Ormoc' => '6541',
            'City of Calbayog' => '6710',

            // Region IX - Zamboanga Peninsula
            'City of Zamboanga' => '7000',
            'City of Dipolog' => '7100',
            'City of Pagadian' => '7016',

            // Region X - Northern Mindanao
            'City of Cagayan De Oro' => '9000',
            'City of Iligan' => '9200',
            'City of Malaybalay' => '8700',
            'City of Valencia' => '8709',

            // Region XI - Davao
            'City of Davao' => '8000',
            'City of Digos' => '8002',
            'City of Tagum' => '8100',
            'City of Panabo' => '8105',
            'Island Garden City of Samal' => '8119',

            // Region XII - SOCCSKSARGEN
            'City of General Santos' => '9500',
            'City of Koronadal' => '9506',
            'City of Kidapawan' => '9400',
            'City of Cotabato' => '9600',
            'City of Tacurong' => '9800',

            // Region XIII - Caraga
            'City of Butuan' => '8600',
            'City of Surigao' => '8400',
            'City of Bislig' => '8311',
            'City of Bayugan' => '8502',

            // CAR - Cordillera
            'City of Baguio' => '2600',
            'City of Tabuk' => '3800',

            // BARMM
            'City of Marawi' => '9700',
            'City of Lamitan' => '7300',

            // Zambales municipalities
            'Iba' => '2201',
            'Botolan' => '2202',
            'Cabangan' => '2203',
            'Candelaria' => '2212',
            'Castillejos' => '2208',
            'Masinloc' => '2206',
            'Palauig' => '2205',
            'San Antonio' => '2206',
            'San Felipe' => '2204',
            'San Marcelino' => '2207',
            'San Narciso' => '2210',
            'Santa Cruz' => '2213',
        ];
    }
}
