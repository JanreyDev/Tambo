<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $templates = [
            [
                'name' => 'Demolition Clearance',
                'category' => 'demolition_clearance',
                'title' => 'BARANGAY DEMOLITION CLEARANCE',
                'content' => 'This is to certify that {{owner_name}} has been granted clearance to demolish the structure located at {{property_address}} within this barangay. Purpose: {{purpose}}.',
                'sort_order' => 27,
            ],
            [
                'name' => 'Renovation Clearance',
                'category' => 'renovation_clearance',
                'title' => 'BARANGAY RENOVATION CLEARANCE',
                'content' => 'This is to certify that {{owner_name}} has been granted clearance to renovate the structure located at {{property_address}} within this barangay. Purpose: {{purpose}}.',
                'sort_order' => 28,
            ],
        ];

        foreach ($templates as $template) {
            if (DB::table('document_templates')->whereNull('barangay_id')->where('category', $template['category'])->exists()) {
                continue;
            }

            DB::table('document_templates')->insert([
                'id' => (string) Str::uuid(),
                'barangay_id' => null,
                'name' => $template['name'],
                'category' => $template['category'],
                'constituent_type' => 'lot_building',
                'title' => $template['title'],
                'salutation' => 'TO WHOM IT MAY CONCERN:',
                'content' => $template['content'],
                'merge_fields' => json_encode(['owner_name', 'property_address', 'purpose']),
                'approval_config' => json_encode(['right' => ['label' => 'Punong Barangay', 'position' => 'Punong Barangay']]),
                'settings' => json_encode(['show_qr' => true, 'show_doc_no' => true, 'show_expiry' => true, 'expiry_months' => 6]),
                'status' => 'published',
                'sort_order' => $template['sort_order'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('document_templates')
            ->whereNull('barangay_id')
            ->whereIn('category', ['demolition_clearance', 'renovation_clearance'])
            ->delete();
    }
};
