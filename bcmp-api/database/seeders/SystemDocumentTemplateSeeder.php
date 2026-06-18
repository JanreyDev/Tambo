<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Tenant\Documents\DocumentTemplate;
use Illuminate\Database\Seeder;

class SystemDocumentTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            // ── Resident Certificates (already seeded — skip) ──────────────────────────
            // These are guarded by firstOrCreate so they won't duplicate.

            // ── Additional Resident Certificates ──────────────────────────────────────
            [
                'name'            => 'Certificate of Guardianship',
                'category'        => 'guardianship',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATE OF GUARDIANSHIP',
                'sort_order'      => 50,
            ],
            [
                'name'            => 'Certificate of Dependency',
                'category'        => 'dependency',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATE OF DEPENDENCY',
                'sort_order'      => 51,
            ],
            [
                'name'            => 'Certificate of No Pending Case',
                'category'        => 'no_pending_case',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATE OF NO PENDING CASE',
                'sort_order'      => 52,
            ],
            [
                'name'            => 'Certificate for Overseas Employment (OFW)',
                'category'        => 'ofw',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATION FOR OVERSEAS EMPLOYMENT',
                'sort_order'      => 53,
            ],
            [
                'name'            => 'Certificate for Scholarship',
                'category'        => 'scholarship',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATION FOR SCHOLARSHIP',
                'sort_order'      => 54,
            ],
            [
                'name'            => 'Certificate for Hospitalization / Medical',
                'category'        => 'hospitalization',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATION FOR HOSPITALIZATION / MEDICAL ASSISTANCE',
                'sort_order'      => 55,
            ],
            [
                'name'            => 'Certificate of Burial Assistance',
                'category'        => 'burial_assistance',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATION FOR BURIAL ASSISTANCE',
                'sort_order'      => 56,
            ],
            [
                'name'            => 'Certificate of Separation',
                'category'        => 'separation',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATE OF SEPARATION / ANNULMENT SUPPORT',
                'sort_order'      => 57,
            ],
            [
                'name'            => 'Certificate of Singleness / Bachelorhood',
                'category'        => 'singleness',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATE OF SINGLENESS / BACHELORHOOD',
                'sort_order'      => 58,
            ],
            [
                'name'            => 'Certificate for PhilHealth Assistance',
                'category'        => 'philhealth',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATION FOR PHILHEALTH ASSISTANCE',
                'sort_order'      => 59,
            ],
            [
                'name'            => 'Certificate for 4Ps / DSWD Assistance',
                'category'        => 'dswd_4ps',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATION FOR 4Ps / DSWD ASSISTANCE',
                'sort_order'      => 60,
            ],
            [
                'name'            => 'Certificate of Living Status',
                'category'        => 'living_status',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATE OF LIVING STATUS (PROOF OF LIFE)',
                'sort_order'      => 61,
            ],
            [
                'name'            => 'Certificate of Death (Local)',
                'category'        => 'death_local',
                'constituent_type'=> 'resident',
                'title'           => 'BARANGAY CERTIFICATION OF DEATH',
                'sort_order'      => 62,
            ],
            [
                'name'            => 'Attestation / Certification Letter',
                'category'        => 'attestation',
                'constituent_type'=> 'resident',
                'title'           => 'ATTESTATION / GENERAL CERTIFICATION',
                'sort_order'      => 63,
            ],
            [
                'name'            => 'Certificate for SSS / GSIS Benefit',
                'category'        => 'sss_gsis',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATION FOR SSS / GSIS BENEFIT CLAIM',
                'sort_order'      => 64,
            ],
            [
                'name'            => 'Certificate for Pag-IBIG Assistance',
                'category'        => 'pagibig',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATION FOR PAG-IBIG ASSISTANCE',
                'sort_order'      => 65,
            ],
            [
                'name'            => 'Certificate of Indigenous People (IP) Membership',
                'category'        => 'ip_membership',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATE OF INDIGENOUS PEOPLE (IP) MEMBERSHIP',
                'sort_order'      => 66,
            ],
            [
                'name'            => 'Certificate for Voter Registration',
                'category'        => 'voter_registration',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATION FOR VOTER REGISTRATION',
                'sort_order'      => 67,
            ],
            [
                'name'            => 'Certificate of No Objection (Resident)',
                'category'        => 'no_objection_resident',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATE OF NO OBJECTION',
                'sort_order'      => 68,
            ],
            [
                'name'            => 'Certificate of Fiscal Hardship',
                'category'        => 'fiscal_hardship',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATE OF FISCAL HARDSHIP / FINANCIAL DIFFICULTY',
                'sort_order'      => 69,
            ],
            [
                'name'            => 'Certificate of Agricultural Worker',
                'category'        => 'agricultural_worker',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATE OF AGRICULTURAL WORKER',
                'sort_order'      => 70,
            ],
            [
                'name'            => 'Certificate of Good Standing',
                'category'        => 'good_standing',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATE OF GOOD STANDING',
                'sort_order'      => 71,
            ],
            [
                'name'            => 'Certificate for Legal Purposes',
                'category'        => 'legal_purposes',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATION FOR LEGAL PURPOSES',
                'sort_order'      => 72,
            ],
            [
                'name'            => 'Certificate for Bank / Loan Application',
                'category'        => 'bank_loan',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATION FOR BANK / LOAN APPLICATION',
                'sort_order'      => 73,
            ],
            [
                'name'            => 'Certificate for Lost / Stolen Document',
                'category'        => 'lost_document',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATION FOR LOST / STOLEN DOCUMENT',
                'sort_order'      => 74,
            ],
            [
                'name'            => 'Certificate of Tribal / Sitio Leader',
                'category'        => 'tribal_leader',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATE OF TRIBAL / SITIO LEADER',
                'sort_order'      => 75,
            ],
            [
                'name'            => 'Youth / SPES Certification',
                'category'        => 'youth_spes',
                'constituent_type'=> 'resident',
                'title'           => 'CERTIFICATION FOR YOUTH / SPES PROGRAM',
                'sort_order'      => 76,
            ],

            // ── KP / Case Certificates ─────────────────────────────────────────────────
            [
                'name'            => 'Certification to File Action (CFA)',
                'category'        => 'cfa',
                'constituent_type'=> 'case',
                'title'           => 'CERTIFICATION TO FILE ACTION',
                'sort_order'      => 100,
            ],
            [
                'name'            => 'Certificate of Amicable Settlement',
                'category'        => 'amicable_settlement',
                'constituent_type'=> 'case',
                'title'           => 'CERTIFICATE OF AMICABLE SETTLEMENT',
                'sort_order'      => 101,
            ],
            [
                'name'            => 'Summons / Subpoena (KP)',
                'category'        => 'kp_summons',
                'constituent_type'=> 'case',
                'title'           => 'SUMMONS / SUBPOENA (KATARUNGANG PAMBARANGAY)',
                'sort_order'      => 102,
            ],
            [
                'name'            => 'Pangkat Conciliation Order',
                'category'        => 'pangkat_order',
                'constituent_type'=> 'case',
                'title'           => 'PANGKAT CONCILIATION ORDER',
                'sort_order'      => 103,
            ],
            [
                'name'            => 'KP Award / Decision',
                'category'        => 'kp_award',
                'constituent_type'=> 'case',
                'title'           => 'KP AWARD / DECISION',
                'sort_order'      => 104,
            ],
            [
                'name'            => 'KP Complaint Form',
                'category'        => 'kp_complaint',
                'constituent_type'=> 'case',
                'title'           => 'BARANGAY COMPLAINT FORM',
                'sort_order'      => 105,
            ],
            [
                'name'            => 'Notice of Repudiation',
                'category'        => 'repudiation',
                'constituent_type'=> 'case',
                'title'           => 'NOTICE OF REPUDIATION',
                'sort_order'      => 106,
            ],

            // ── Establishment Certificates ─────────────────────────────────────────────
            [
                'name'            => 'Sanitary / Health Clearance',
                'category'        => 'sanitary_clearance',
                'constituent_type'=> 'establishment',
                'title'           => 'SANITARY / HEALTH CLEARANCE',
                'sort_order'      => 200,
            ],
            [
                'name'            => 'Certificate of No Objection (Business)',
                'category'        => 'no_objection_business',
                'constituent_type'=> 'establishment',
                'title'           => 'CERTIFICATE OF NO OBJECTION (BUSINESS)',
                'sort_order'      => 201,
            ],
            [
                'name'            => 'Certificate of No Business Record',
                'category'        => 'no_business_record',
                'constituent_type'=> 'establishment',
                'title'           => 'CERTIFICATE OF NO BUSINESS RECORD',
                'sort_order'      => 202,
            ],
            [
                'name'            => 'Business Permit Amendment Clearance',
                'category'        => 'permit_amendment',
                'constituent_type'=> 'establishment',
                'title'           => 'BUSINESS PERMIT AMENDMENT CLEARANCE',
                'sort_order'      => 203,
            ],
            [
                'name'            => 'Stall / Vending Permit',
                'category'        => 'stall_permit',
                'constituent_type'=> 'establishment',
                'title'           => 'STALL / VENDING PERMIT CLEARANCE',
                'sort_order'      => 204,
            ],
            [
                'name'            => 'Certificate of Good Standing (Business)',
                'category'        => 'business_good_standing',
                'constituent_type'=> 'establishment',
                'title'           => 'CERTIFICATE OF GOOD STANDING (BUSINESS)',
                'sort_order'      => 205,
            ],

            // ── Lot / Building Certificates ────────────────────────────────────────────
            [
                'name'            => 'Electrical Clearance',
                'category'        => 'electrical_clearance',
                'constituent_type'=> 'lot_building',
                'title'           => 'ELECTRICAL CLEARANCE',
                'sort_order'      => 300,
            ],
            [
                'name'            => 'Plumbing Clearance',
                'category'        => 'plumbing_clearance',
                'constituent_type'=> 'lot_building',
                'title'           => 'PLUMBING CLEARANCE',
                'sort_order'      => 301,
            ],
            [
                'name'            => 'Retaining Wall Clearance',
                'category'        => 'retaining_wall',
                'constituent_type'=> 'lot_building',
                'title'           => 'RETAINING WALL CLEARANCE',
                'sort_order'      => 302,
            ],
            [
                'name'            => 'Occupancy Clearance',
                'category'        => 'occupancy_clearance',
                'constituent_type'=> 'lot_building',
                'title'           => 'OCCUPANCY CLEARANCE',
                'sort_order'      => 303,
            ],
            [
                'name'            => 'Certificate of Lot Ownership (Barangay)',
                'category'        => 'lot_ownership',
                'constituent_type'=> 'lot_building',
                'title'           => 'BARANGAY CERTIFICATE OF LOT OWNERSHIP',
                'sort_order'      => 304,
            ],
            [
                'name'            => 'Drainage Clearance',
                'category'        => 'drainage_clearance',
                'constituent_type'=> 'lot_building',
                'title'           => 'DRAINAGE CLEARANCE',
                'sort_order'      => 305,
            ],
            [
                'name'            => 'No Objection Certificate (Construction)',
                'category'        => 'no_objection_construction',
                'constituent_type'=> 'lot_building',
                'title'           => 'NO OBJECTION CERTIFICATE (CONSTRUCTION)',
                'sort_order'      => 306,
            ],
        ];

        $added   = 0;
        $skipped = 0;

        foreach ($templates as $data) {
            $exists = DocumentTemplate::whereNull('barangay_id')
                ->where('name', $data['name'])
                ->exists();

            if ($exists) {
                $skipped++;
                continue;
            }

            DocumentTemplate::create([
                ...$data,
                'barangay_id'  => null,
                'status'       => 'active',
                'merge_fields' => [],
            ]);

            $added++;
        }

        $this->command->info("✅ Added {$added} new system templates. Skipped {$skipped} duplicates.");
    }
}
