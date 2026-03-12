<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Tenant\Documents\DocumentTemplate;
use Illuminate\Database\Seeder;

/**
 * Seeds system-default document templates (barangay_id = null).
 *
 * These templates are cloned per barangay during onboarding so
 * each barangay starts with a standard set of documents and can
 * then customize them independently.
 *
 * Based on V3/V4 production data: Barangay Clearance is by far
 * the most issued document, followed by Residency, Indigency,
 * Business Clearance, Cedula, and Good Moral.
 */
class DefaultDocumentTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'name' => 'Barangay Clearance',
                'category' => 'clearance',
                'constituent_type' => 'resident',
                'title' => 'BARANGAY CLEARANCE',
                'salutation' => 'TO WHOM IT MAY CONCERN:',
                'content' => "This is to certify that {{full_name}}, {{age}} years old, {{civil_status}}, Filipino, and a resident of {{address}}, is known to be of good moral character and has no derogatory record filed in this barangay.\n\nThis certification is being issued upon the request of the above-named person for {{purpose}}.",
                'merge_fields' => ['full_name', 'age', 'civil_status', 'address', 'purpose', 'photo_url'],
                'custom_inputs' => [
                    ['name' => 'purpose', 'type' => 'text', 'required' => true, 'label' => 'Purpose'],
                ],
                'approval_config' => [
                    'left' => ['label' => 'Barangay Secretary', 'position' => 'Barangay Secretary'],
                    'right' => ['label' => 'Punong Barangay', 'position' => 'Punong Barangay'],
                ],
                'settings' => [
                    'show_qr' => true,
                    'show_ctc' => true,
                    'show_doc_no' => true,
                    'show_or' => true,
                    'show_expiry' => true,
                    'expiry_months' => 6,
                    'show_photo' => true,
                ],
                'sort_order' => 1,
            ],
            [
                'name' => 'Certificate of Residency',
                'category' => 'residency',
                'constituent_type' => 'resident',
                'title' => 'CERTIFICATE OF RESIDENCY',
                'salutation' => 'TO WHOM IT MAY CONCERN:',
                'content' => "This is to certify that {{full_name}}, {{age}} years old, {{civil_status}}, Filipino, is a bonafide resident of {{address}} for {{years_of_residency}} year(s).\n\nThis certification is being issued upon the request of the above-named person for {{purpose}}.",
                'merge_fields' => ['full_name', 'age', 'civil_status', 'address', 'years_of_residency', 'purpose'],
                'custom_inputs' => [
                    ['name' => 'purpose', 'type' => 'text', 'required' => true, 'label' => 'Purpose'],
                    ['name' => 'years_of_residency', 'type' => 'number', 'required' => true, 'label' => 'Years of Residency'],
                ],
                'approval_config' => [
                    'left' => ['label' => 'Barangay Secretary', 'position' => 'Barangay Secretary'],
                    'right' => ['label' => 'Punong Barangay', 'position' => 'Punong Barangay'],
                ],
                'settings' => [
                    'show_qr' => true,
                    'show_ctc' => true,
                    'show_doc_no' => true,
                    'show_or' => true,
                    'show_expiry' => true,
                    'expiry_months' => 6,
                    'show_photo' => false,
                ],
                'sort_order' => 2,
            ],
            [
                'name' => 'Certificate of Indigency',
                'category' => 'indigency',
                'constituent_type' => 'resident',
                'title' => 'CERTIFICATE OF INDIGENCY',
                'salutation' => 'TO WHOM IT MAY CONCERN:',
                'content' => "This is to certify that {{full_name}}, {{age}} years old, {{civil_status}}, Filipino, and a resident of {{address}}, belongs to the indigent families in this barangay.\n\nThis certification is being issued upon the request of the above-named person for {{purpose}}.",
                'merge_fields' => ['full_name', 'age', 'civil_status', 'address', 'purpose'],
                'custom_inputs' => [
                    ['name' => 'purpose', 'type' => 'text', 'required' => true, 'label' => 'Purpose'],
                ],
                'approval_config' => [
                    'left' => ['label' => 'Barangay Secretary', 'position' => 'Barangay Secretary'],
                    'right' => ['label' => 'Punong Barangay', 'position' => 'Punong Barangay'],
                ],
                'settings' => [
                    'show_qr' => true,
                    'show_ctc' => false,
                    'show_doc_no' => true,
                    'show_or' => false,
                    'show_expiry' => true,
                    'expiry_months' => 3,
                    'show_photo' => false,
                ],
                'sort_order' => 3,
            ],
            [
                'name' => 'Business Clearance',
                'category' => 'business_clearance',
                'constituent_type' => 'establishment',
                'title' => 'BARANGAY BUSINESS CLEARANCE',
                'salutation' => 'TO WHOM IT MAY CONCERN:',
                'content' => "This is to certify that {{business_name}}, owned and operated by {{owner_name}}, located at {{business_address}}, has been granted clearance to operate within the jurisdiction of this barangay.\n\nNature of Business: {{nature_of_business}}",
                'merge_fields' => ['business_name', 'owner_name', 'business_address', 'nature_of_business'],
                'custom_inputs' => [
                    ['name' => 'business_name', 'type' => 'text', 'required' => true, 'label' => 'Business Name'],
                    ['name' => 'owner_name', 'type' => 'text', 'required' => true, 'label' => 'Owner Name'],
                    ['name' => 'business_address', 'type' => 'text', 'required' => true, 'label' => 'Business Address'],
                    ['name' => 'nature_of_business', 'type' => 'text', 'required' => true, 'label' => 'Nature of Business'],
                ],
                'approval_config' => [
                    'left' => ['label' => 'Barangay Secretary', 'position' => 'Barangay Secretary'],
                    'right' => ['label' => 'Punong Barangay', 'position' => 'Punong Barangay'],
                ],
                'settings' => [
                    'show_qr' => true,
                    'show_ctc' => false,
                    'show_doc_no' => true,
                    'show_or' => true,
                    'show_expiry' => true,
                    'expiry_months' => 12,
                    'show_photo' => false,
                ],
                'sort_order' => 4,
            ],
            [
                'name' => 'Cedula (Community Tax Certificate)',
                'category' => 'cedula',
                'constituent_type' => 'resident',
                'title' => 'COMMUNITY TAX CERTIFICATE',
                'salutation' => '',
                'content' => "Issued to {{full_name}}, {{age}} years old, {{civil_status}}, Filipino, resident of {{address}}.\n\nOccupation: {{occupation}}\nGross Annual Income: {{gross_income}}",
                'merge_fields' => ['full_name', 'age', 'civil_status', 'address', 'occupation', 'gross_income'],
                'custom_inputs' => [
                    ['name' => 'occupation', 'type' => 'text', 'required' => false, 'label' => 'Occupation'],
                    ['name' => 'gross_income', 'type' => 'text', 'required' => false, 'label' => 'Gross Annual Income'],
                ],
                'approval_config' => [
                    'right' => ['label' => 'Barangay Treasurer', 'position' => 'Barangay Treasurer'],
                ],
                'settings' => [
                    'show_qr' => false,
                    'show_ctc' => true,
                    'show_doc_no' => true,
                    'show_or' => true,
                    'show_expiry' => true,
                    'expiry_months' => 12,
                    'show_photo' => true,
                ],
                'sort_order' => 5,
            ],
            [
                'name' => 'Certificate of Good Moral Character',
                'category' => 'good_moral',
                'constituent_type' => 'resident',
                'title' => 'CERTIFICATE OF GOOD MORAL CHARACTER',
                'salutation' => 'TO WHOM IT MAY CONCERN:',
                'content' => "This is to certify that {{full_name}}, {{age}} years old, {{civil_status}}, Filipino, and a resident of {{address}}, is known to be of good moral character and has no pending criminal or administrative case in this barangay.\n\nThis certification is being issued upon the request of the above-named person for {{purpose}}.",
                'merge_fields' => ['full_name', 'age', 'civil_status', 'address', 'purpose'],
                'custom_inputs' => [
                    ['name' => 'purpose', 'type' => 'text', 'required' => true, 'label' => 'Purpose'],
                ],
                'approval_config' => [
                    'left' => ['label' => 'Barangay Secretary', 'position' => 'Barangay Secretary'],
                    'right' => ['label' => 'Punong Barangay', 'position' => 'Punong Barangay'],
                ],
                'settings' => [
                    'show_qr' => true,
                    'show_ctc' => true,
                    'show_doc_no' => true,
                    'show_or' => true,
                    'show_expiry' => true,
                    'expiry_months' => 6,
                    'show_photo' => false,
                ],
                'sort_order' => 6,
            ],
            [
                'name' => 'Late Registration Certificate',
                'category' => 'late_registration',
                'constituent_type' => 'resident',
                'title' => 'CERTIFICATE FOR LATE REGISTRATION',
                'salutation' => 'TO WHOM IT MAY CONCERN:',
                'content' => "This is to certify that {{full_name}}, born on {{birthdate}} at {{birthplace}}, is a resident of {{address}}.\n\nTo the best of our knowledge, the birth of the above-named person was not registered in the Local Civil Registry due to {{reason}}.\n\nThis certification is issued for the purpose of securing a late registration of birth at the Local Civil Registrar's Office.",
                'merge_fields' => ['full_name', 'birthdate', 'birthplace', 'address', 'reason'],
                'custom_inputs' => [
                    ['name' => 'birthdate', 'type' => 'date', 'required' => true, 'label' => 'Date of Birth'],
                    ['name' => 'birthplace', 'type' => 'text', 'required' => true, 'label' => 'Place of Birth'],
                    ['name' => 'reason', 'type' => 'text', 'required' => true, 'label' => 'Reason for Late Registration'],
                ],
                'approval_config' => [
                    'left' => ['label' => 'Barangay Secretary', 'position' => 'Barangay Secretary'],
                    'right' => ['label' => 'Punong Barangay', 'position' => 'Punong Barangay'],
                ],
                'settings' => [
                    'show_qr' => true,
                    'show_ctc' => true,
                    'show_doc_no' => true,
                    'show_or' => true,
                    'show_expiry' => false,
                    'show_photo' => false,
                ],
                'sort_order' => 7,
            ],
            [
                'name' => 'Lot Clearance',
                'category' => 'lot_clearance',
                'constituent_type' => 'lot_building',
                'title' => 'BARANGAY LOT CLEARANCE',
                'salutation' => 'TO WHOM IT MAY CONCERN:',
                'content' => "This is to certify that {{owner_name}}, the owner of the lot/property located at {{lot_address}}, has been granted clearance by this Barangay for {{purpose}}.\n\nLot Area: {{lot_area}} sq.m.\nTCT/Tax Declaration No.: {{tax_dec_no}}",
                'merge_fields' => ['owner_name', 'lot_address', 'purpose', 'lot_area', 'tax_dec_no'],
                'custom_inputs' => [
                    ['name' => 'owner_name', 'type' => 'text', 'required' => true, 'label' => 'Lot Owner Name'],
                    ['name' => 'lot_address', 'type' => 'text', 'required' => true, 'label' => 'Lot Address'],
                    ['name' => 'purpose', 'type' => 'text', 'required' => true, 'label' => 'Purpose'],
                    ['name' => 'lot_area', 'type' => 'text', 'required' => false, 'label' => 'Lot Area (sq.m.)'],
                    ['name' => 'tax_dec_no', 'type' => 'text', 'required' => false, 'label' => 'TCT/Tax Dec No.'],
                ],
                'approval_config' => [
                    'left' => ['label' => 'Barangay Secretary', 'position' => 'Barangay Secretary'],
                    'right' => ['label' => 'Punong Barangay', 'position' => 'Punong Barangay'],
                ],
                'settings' => [
                    'show_qr' => true,
                    'show_ctc' => false,
                    'show_doc_no' => true,
                    'show_or' => true,
                    'show_expiry' => true,
                    'expiry_months' => 12,
                    'show_photo' => false,
                ],
                'sort_order' => 8,
            ],
        ];

        foreach ($templates as $template) {
            DocumentTemplate::firstOrCreate(
                [
                    'barangay_id' => null,
                    'category' => $template['category'],
                ],
                array_merge($template, [
                    'barangay_id' => null,
                    'status' => 'published',
                ]),
            );
        }
    }
}
