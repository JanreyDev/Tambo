<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Resident Record Card — {{ $fullName }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: sans-serif;
            font-size: 9pt;
            color: #1a1a1a;
            background: #fff;
        }

        /* ── Page Header ── */
        .page-header {
            border-bottom: 3px solid #1a3a6e;
            padding-bottom: 10px;
            margin-bottom: 12px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-seal-cell {
            width: 64px;
            text-align: center;
            vertical-align: middle;
        }
        .header-seal {
            width: 56px;
            height: 56px;
        }
        .header-text-cell {
            text-align: center;
            vertical-align: middle;
            padding: 0 8px;
        }
        .header-republic {
            font-size: 8pt;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .header-barangay-name {
            font-size: 15pt;
            font-weight: bold;
            color: #1a3a6e;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header-address {
            font-size: 8pt;
            color: #555;
            margin-top: 2px;
        }
        .header-title {
            font-size: 10pt;
            font-weight: bold;
            color: #ce1126;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 4px;
        }
        .header-subtitle {
            font-size: 7.5pt;
            color: #888;
            margin-top: 1px;
        }

        /* ── Top Card: Photo + Basic Info ── */
        .top-card {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            border: 1.5px solid #1a3a6e;
            border-radius: 4px;
        }
        .photo-cell {
            width: 96px;
            vertical-align: top;
            padding: 8px;
            border-right: 1px solid #ddd;
            background: #f5f7fa;
        }
        .photo-img {
            width: 80px;
            height: 96px;
            object-fit: cover;
            border: 1px solid #ccc;
            display: block;
        }
        .photo-placeholder {
            width: 80px;
            height: 96px;
            background: #e5e9f0;
            border: 1px solid #ccc;
            display: block;
            text-align: center;
            vertical-align: middle;
            font-size: 7.5pt;
            color: #999;
            padding-top: 38px;
        }
        .resident-number-badge {
            margin-top: 4px;
            background: #1a3a6e;
            color: #fff;
            font-size: 6.5pt;
            font-weight: bold;
            text-align: center;
            padding: 2px 4px;
            border-radius: 2px;
            word-break: break-all;
        }
        .basic-cell {
            vertical-align: top;
            padding: 8px 10px;
        }
        .resident-name {
            font-size: 13pt;
            font-weight: bold;
            color: #1a3a6e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            border-bottom: 1px solid #e0e6f0;
            padding-bottom: 4px;
        }
        .basic-grid {
            width: 100%;
            border-collapse: collapse;
        }
        .basic-grid td {
            padding: 2px 4px 2px 0;
            vertical-align: top;
        }
        .field-label {
            font-size: 7pt;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            font-weight: bold;
            white-space: nowrap;
            padding-right: 6px;
        }
        .field-value {
            font-size: 8.5pt;
            color: #1a1a1a;
            font-weight: 600;
        }
        .field-value.muted {
            color: #888;
            font-weight: normal;
            font-style: italic;
        }

        /* ── Sections ── */
        .section {
            margin-bottom: 7px;
            border: 1px solid #dde3ef;
            border-radius: 3px;
            overflow: hidden;
        }
        .section-header {
            background: #1a3a6e;
            color: #fff;
            font-size: 7.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 3px 8px;
        }
        .section-body {
            padding: 6px 8px;
            background: #fff;
        }
        .row-grid {
            width: 100%;
            border-collapse: collapse;
        }
        .row-grid td {
            padding: 2px 6px 2px 0;
            vertical-align: top;
            width: 25%;
        }
        .row-grid td:last-child {
            padding-right: 0;
        }
        .half td { width: 50%; }
        .third td { width: 33.3%; }

        /* ── Sectoral Tags ── */
        .tag {
            display: inline-block;
            background: #e8f0fe;
            color: #1a3a6e;
            border: 1px solid #c5d3f0;
            font-size: 7pt;
            font-weight: bold;
            padding: 1px 5px;
            border-radius: 2px;
            margin: 1px 2px 1px 0;
        }
        .tag-none {
            font-size: 7.5pt;
            color: #aaa;
            font-style: italic;
        }

        /* ── Profile Completion Bar ── */
        .completion-bar-bg {
            background: #e5e9f0;
            border-radius: 3px;
            height: 8px;
            width: 100%;
            margin-top: 3px;
        }
        .completion-bar-fill {
            background: #1a3a6e;
            border-radius: 3px;
            height: 8px;
        }

        /* ── Footer ── */
        .footer {
            margin-top: 10px;
            border-top: 2px solid #1a3a6e;
            padding-top: 6px;
        }
        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }
        .footer-table td {
            vertical-align: top;
            font-size: 7.5pt;
        }
        .footer-notice {
            font-size: 7pt;
            color: #999;
            font-style: italic;
            text-align: center;
            margin-top: 4px;
        }
        .signature-line {
            border-bottom: 1px solid #333;
            width: 140px;
            margin-top: 20px;
            margin-bottom: 2px;
        }
    </style>
</head>
<body>

{{-- ────────────────────────────────────────────────── --}}
{{-- HEADER                                            --}}
{{-- ────────────────────────────────────────────────── --}}
<div class="page-header">
    <table class="header-table">
        <tr>
            <td class="header-seal-cell">
                @if($barangaySeal)
                    <img src="{{ $barangaySeal }}" class="header-seal" alt="Seal">
                @else
                    <div style="width:56px;height:56px;border-radius:50%;border:2px solid #1a3a6e;background:#f0f4ff;display:table;text-align:center;">
                        <span style="display:table-cell;vertical-align:middle;font-size:7pt;color:#1a3a6e;font-weight:bold;">SEAL</span>
                    </div>
                @endif
            </td>
            <td class="header-text-cell">
                <div class="header-republic">Republic of the Philippines</div>
                <div class="header-republic">Province of {{ $barangay->province ?? 'N/A' }} — {{ $barangay->city_municipality ?? 'N/A' }}</div>
                <div class="header-barangay-name">Barangay {{ $barangay->name }}</div>
                @if($barangay->document_header_text)
                    <div class="header-address">{{ $barangay->document_header_text }}</div>
                @elseif($barangay->full_address)
                    <div class="header-address">{{ $barangay->full_address }}</div>
                @endif
                <div class="header-title">Resident Record Card</div>
                <div class="header-subtitle">Official Barangay Document — For Government Use Only</div>
            </td>
            <td class="header-seal-cell">
                {{-- Right seal placeholder --}}
                <div style="width:56px;height:56px;border-radius:50%;border:2px dashed #ccc;background:#f8f8f8;display:table;text-align:center;">
                    <span style="display:table-cell;vertical-align:middle;font-size:6pt;color:#ccc;">KAPITAN</span>
                </div>
            </td>
        </tr>
    </table>
</div>

{{-- ────────────────────────────────────────────────── --}}
{{-- TOP CARD: PHOTO + BASIC INFO                      --}}
{{-- ────────────────────────────────────────────────── --}}
<table class="top-card">
    <tr>
        <td class="photo-cell">
            @if($photoDataUri)
                <img src="{{ $photoDataUri }}" class="photo-img" alt="Resident Photo">
            @else
                <div class="photo-placeholder">No<br>Photo</div>
            @endif
            <div class="resident-number-badge">{{ $resident->resident_number ?? 'N/A' }}</div>
        </td>
        <td class="basic-cell">
            <div class="resident-name">{{ $fullName }}</div>
            <table class="basic-grid">
                <tr>
                    <td class="field-label">Date of Birth</td>
                    <td class="field-value">{{ $resident->date_of_birth ? $resident->date_of_birth->format('F d, Y') : '—' }}</td>
                    <td class="field-label">Age</td>
                    <td class="field-value">{{ $age !== null ? $age . ' years old' : '—' }}</td>
                </tr>
                <tr>
                    <td class="field-label">Sex</td>
                    <td class="field-value">{{ $resident->sex ? ucfirst(strtolower(is_string($resident->sex) ? $resident->sex : $resident->sex->value)) : '—' }}</td>
                    <td class="field-label">Civil Status</td>
                    <td class="field-value">{{ $resident->civil_status ? ucfirst(strtolower(is_string($resident->civil_status) ? $resident->civil_status : $resident->civil_status->value)) : '—' }}</td>
                </tr>
                <tr>
                    <td class="field-label">Place of Birth</td>
                    <td class="field-value" colspan="3">{{ $resident->place_of_birth ?: '—' }}</td>
                </tr>
                <tr>
                    <td class="field-label">Blood Type</td>
                    <td class="field-value">{{ $resident->blood_type ?: '—' }}</td>
                    <td class="field-label">Citizenship</td>
                    <td class="field-value">{{ $resident->citizenship ?: '—' }}</td>
                </tr>
                <tr>
                    <td class="field-label">Religion</td>
                    <td class="field-value">{{ $resident->religion ?: '—' }}</td>
                    <td class="field-label">Ethnicity</td>
                    <td class="field-value">{{ $resident->ethnicity ?: '—' }}</td>
                </tr>
                <tr>
                    <td class="field-label">Resident Type</td>
                    <td class="field-value">{{ $resident->resident_type ? ucfirst(is_string($resident->resident_type) ? $resident->resident_type : $resident->resident_type->value) : '—' }}</td>
                    <td class="field-label">Status</td>
                    <td class="field-value">{{ $resident->status ? ucfirst(is_string($resident->status) ? $resident->status : $resident->status->value) : '—' }}</td>
                </tr>
                @if($resident->barangay_position)
                <tr>
                    <td class="field-label">Barangay Role</td>
                    <td class="field-value" colspan="3">{{ $resident->barangay_position }}
                        @if($resident->barangay_role_start || $resident->barangay_role_end)
                            ({{ $resident->barangay_role_start?->format('Y') ?? '?' }}–{{ $resident->barangay_role_end?->format('Y') ?? 'present' }})
                        @endif
                    </td>
                </tr>
                @endif
                <tr>
                    <td class="field-label">Mother's Name</td>
                    <td class="field-value" colspan="3">{{ $resident->mothers_maiden_name ?: '—' }}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

{{-- ────────────────────────────────────────────────── --}}
{{-- ADDRESS                                           --}}
{{-- ────────────────────────────────────────────────── --}}
<div class="section">
    <div class="section-header">Address</div>
    <div class="section-body">
        <table class="row-grid">
            <tr>
                <td>
                    <div class="field-label">House / Block / Lot</div>
                    <div class="field-value">{{ $resident->house_block_lot ?: '—' }}</div>
                </td>
                <td>
                    <div class="field-label">Purok / Sitio</div>
                    <div class="field-value">{{ $resident->purok ?: ($resident->sitio ?: '—') }}</div>
                </td>
                <td>
                    <div class="field-label">Street / Road</div>
                    <div class="field-value">{{ $resident->street ?: '—' }}</div>
                </td>
                <td>
                    <div class="field-label">Zip Code</div>
                    <div class="field-value">{{ $resident->zip_code ?: '—' }}</div>
                </td>
            </tr>
        </table>
        <table class="row-grid" style="margin-top:4px;">
            <tr>
                <td>
                    <div class="field-label">Barangay</div>
                    <div class="field-value">{{ $barangay->name }}</div>
                </td>
                <td>
                    <div class="field-label">City / Municipality</div>
                    <div class="field-value">{{ $barangay->city_municipality ?? '—' }}</div>
                </td>
                <td>
                    <div class="field-label">Province</div>
                    <div class="field-value">{{ $barangay->province ?? '—' }}</div>
                </td>
                <td>
                    <div class="field-label">Head of Household</div>
                    <div class="field-value">{{ $resident->is_head_of_household ? 'Yes' : 'No' }}</div>
                </td>
            </tr>
        </table>
    </div>
</div>

{{-- ────────────────────────────────────────────────── --}}
{{-- CONTACT + SECTORAL                                --}}
{{-- ────────────────────────────────────────────────── --}}
<table style="width:100%;border-collapse:collapse;margin-bottom:7px;">
    <tr>
        <td style="width:50%;vertical-align:top;padding-right:4px;">
            <div class="section">
                <div class="section-header">Contact Information</div>
                <div class="section-body">
                    <table class="row-grid half">
                        <tr>
                            <td>
                                <div class="field-label">Mobile</div>
                                <div class="field-value">{{ $resident->mobile_number ?: '—' }}</div>
                            </td>
                            <td>
                                <div class="field-label">Telephone</div>
                                <div class="field-value">{{ $resident->telephone ?: '—' }}</div>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <div class="field-label">Email</div>
                                <div class="field-value">{{ $resident->email ?: '—' }}</div>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        </td>
        <td style="width:50%;vertical-align:top;padding-left:4px;">
            <div class="section">
                <div class="section-header">Sectoral Affiliations</div>
                <div class="section-body" style="min-height:38px;">
                    @if(count($sectoralTags) > 0)
                        @foreach($sectoralTags as $tag)
                            <span class="tag">{{ $tag }}</span>
                        @endforeach
                        @if($resident->sector_other)
                            <span class="tag">{{ $resident->sector_other }}</span>
                        @endif
                    @else
                        <span class="tag-none">No sectoral affiliations recorded.</span>
                    @endif
                </div>
            </div>
        </td>
    </tr>
</table>

{{-- ────────────────────────────────────────────────── --}}
{{-- VOTER INFORMATION                                 --}}
{{-- ────────────────────────────────────────────────── --}}
<div class="section">
    <div class="section-header">Voter Information</div>
    <div class="section-body">
        <table class="row-grid">
            <tr>
                <td>
                    <div class="field-label">Registered Voter</div>
                    <div class="field-value">{{ $resident->is_voter ? 'Yes' : 'No' }}</div>
                </td>
                <td>
                    <div class="field-label">Resident Voter</div>
                    <div class="field-value">{{ $resident->is_resident_voter ? 'Yes' : 'No' }}</div>
                </td>
                <td>
                    <div class="field-label">Precinct Number</div>
                    <div class="field-value">{{ $resident->voter_precinct_number ?: '—' }}</div>
                </td>
                <td>
                    <div class="field-label">Last Voted Year</div>
                    <div class="field-value">{{ $resident->last_voted_year ?: '—' }}</div>
                </td>
            </tr>
        </table>
    </div>
</div>

{{-- ────────────────────────────────────────────────── --}}
{{-- LIVELIHOOD & EMPLOYMENT                           --}}
{{-- ────────────────────────────────────────────────── --}}
<div class="section">
    <div class="section-header">Livelihood &amp; Employment</div>
    <div class="section-body">
        <table class="row-grid">
            <tr>
                <td>
                    <div class="field-label">Livelihood Type</div>
                    <div class="field-value">{{ $resident->livelihood_type ?: '—' }}</div>
                </td>
                <td>
                    <div class="field-label">Occupation</div>
                    <div class="field-value">{{ $resident->occupation ?: '—' }}</div>
                </td>
                <td>
                    <div class="field-label">Employer</div>
                    <div class="field-value">{{ $resident->employer ?: '—' }}</div>
                </td>
                <td>
                    <div class="field-label">Monthly Income</div>
                    <div class="field-value">{{ $resident->monthly_income_range ?: '—' }}</div>
                </td>
            </tr>
        </table>
        @if($resident->skills)
            <div style="margin-top:4px;">
                <div class="field-label">Skills / Specialization</div>
                <div class="field-value">{{ $resident->skills }}</div>
            </div>
        @endif
    </div>
</div>

{{-- ────────────────────────────────────────────────── --}}
{{-- EDUCATION                                         --}}
{{-- ────────────────────────────────────────────────── --}}
<div class="section">
    <div class="section-header">Educational Attainment</div>
    <div class="section-body">
        <table class="row-grid half">
            <tr>
                <td>
                    <div class="field-label">Highest Education</div>
                    <div class="field-value">{{ $resident->highest_education ?: '—' }}</div>
                </td>
                <td>
                    @if(!empty($resident->education_details) && count($resident->education_details) > 0 && !empty($resident->education_details[0]['school']))
                        <div class="field-label">Last School Attended</div>
                        <div class="field-value">{{ $resident->education_details[0]['school'] ?? '—' }}</div>
                    @endif
                </td>
            </tr>
        </table>
    </div>
</div>

{{-- ────────────────────────────────────────────────── --}}
{{-- GOVERNMENT IDs                                    --}}
{{-- ────────────────────────────────────────────────── --}}
<div class="section">
    <div class="section-header">Government ID Numbers</div>
    <div class="section-body">
        <table class="row-grid">
            <tr>
                <td>
                    <div class="field-label">PhilHealth No.</div>
                    <div class="field-value {{ !$govIds['philhealth_number'] ? 'muted' : '' }}">
                        {{ $govIds['philhealth_number'] ?: '—' }}
                    </div>
                    @if($govIds['philhealth_number'] && $resident->philhealth_expiry)
                        <div style="font-size:6.5pt;color:#888;">Exp: {{ $resident->philhealth_expiry->format('m/Y') }}</div>
                    @endif
                </td>
                <td>
                    <div class="field-label">SSS / GSIS No.</div>
                    <div class="field-value {{ !$govIds['sss_gsis_number'] ? 'muted' : '' }}">
                        {{ $govIds['sss_gsis_number'] ?: '—' }}
                    </div>
                    @if($govIds['sss_gsis_number'] && $resident->sss_gsis_expiry)
                        <div style="font-size:6.5pt;color:#888;">Exp: {{ $resident->sss_gsis_expiry->format('m/Y') }}</div>
                    @endif
                </td>
                <td>
                    <div class="field-label">Pag-IBIG No.</div>
                    <div class="field-value {{ !$govIds['pagibig_number'] ? 'muted' : '' }}">
                        {{ $govIds['pagibig_number'] ?: '—' }}
                    </div>
                    @if($govIds['pagibig_number'] && $resident->pagibig_expiry)
                        <div style="font-size:6.5pt;color:#888;">Exp: {{ $resident->pagibig_expiry->format('m/Y') }}</div>
                    @endif
                </td>
                <td>
                    <div class="field-label">TIN No.</div>
                    <div class="field-value {{ !$govIds['tin_number'] ? 'muted' : '' }}">
                        {{ $govIds['tin_number'] ?: '—' }}
                    </div>
                    @if($govIds['tin_number'] && $resident->tin_expiry)
                        <div style="font-size:6.5pt;color:#888;">Exp: {{ $resident->tin_expiry->format('m/Y') }}</div>
                    @endif
                </td>
            </tr>
        </table>
        @if($govIds['pwd_id'] || $govIds['senior_citizen_id'])
            <table class="row-grid half" style="margin-top:4px;">
                <tr>
                    <td>
                        <div class="field-label">PWD ID</div>
                        <div class="field-value {{ !$govIds['pwd_id'] ? 'muted' : '' }}">
                            {{ $govIds['pwd_id'] ?: '—' }}
                        </div>
                    </td>
                    <td>
                        <div class="field-label">Senior Citizen ID</div>
                        <div class="field-value {{ !$govIds['senior_citizen_id'] ? 'muted' : '' }}">
                            {{ $govIds['senior_citizen_id'] ?: '—' }}
                        </div>
                    </td>
                </tr>
            </table>
        @endif
    </div>
</div>

{{-- ────────────────────────────────────────────────── --}}
{{-- HEALTH                                            --}}
{{-- ────────────────────────────────────────────────── --}}
@if($resident->health_history)
<div class="section">
    <div class="section-header">Health Information</div>
    <div class="section-body">
        <table class="row-grid half">
            <tr>
                <td>
                    <div class="field-label">Health History / Conditions</div>
                    <div class="field-value">{{ $resident->health_history }}</div>
                </td>
                <td>
                    <div class="field-label">Organ Donor</div>
                    <div class="field-value">{{ $resident->is_organ_donor ? 'Yes — consented organ donor' : 'No' }}</div>
                </td>
            </tr>
        </table>
    </div>
</div>
@endif

{{-- ────────────────────────────────────────────────── --}}
{{-- EMERGENCY CONTACT                                 --}}
{{-- ────────────────────────────────────────────────── --}}
<div class="section">
    <div class="section-header">Emergency Contact</div>
    <div class="section-body">
        <table class="row-grid">
            <tr>
                <td>
                    <div class="field-label">Full Name</div>
                    <div class="field-value">{{ $resident->emergency_contact_name ?: '—' }}</div>
                </td>
                <td>
                    <div class="field-label">Relationship</div>
                    <div class="field-value">{{ $resident->emergency_contact_relationship ?: '—' }}</div>
                </td>
                <td>
                    <div class="field-label">Contact Number</div>
                    <div class="field-value">{{ $resident->emergency_contact_phone ?: '—' }}</div>
                </td>
                <td>
                    <div class="field-label">Address</div>
                    <div class="field-value">{{ $resident->emergency_contact_address ?: '—' }}</div>
                </td>
            </tr>
        </table>
    </div>
</div>

{{-- ────────────────────────────────────────────────── --}}
{{-- PROFILE COMPLETION                                --}}
{{-- ────────────────────────────────────────────────── --}}
<div class="section">
    <div class="section-header">Profile Completion</div>
    <div class="section-body">
        <table style="width:100%;border-collapse:collapse;">
            <tr>
                <td style="width:80%;vertical-align:middle;padding-right:8px;">
                    <div class="completion-bar-bg">
                        <div class="completion-bar-fill" style="width:{{ $resident->profile_completion_pct ?? 0 }}%;"></div>
                    </div>
                </td>
                <td style="width:20%;text-align:right;vertical-align:middle;">
                    <span style="font-size:10pt;font-weight:bold;color:#1a3a6e;">{{ $resident->profile_completion_pct ?? 0 }}%</span>
                </td>
            </tr>
        </table>
        @if($resident->other_remarks)
            <div style="margin-top:4px;">
                <span class="field-label">Remarks:</span>
                <span class="field-value" style="margin-left:4px;">{{ $resident->other_remarks }}</span>
            </div>
        @endif
    </div>
</div>

{{-- ────────────────────────────────────────────────── --}}
{{-- FOOTER                                            --}}
{{-- ────────────────────────────────────────────────── --}}
<div class="footer">
    <table class="footer-table">
        <tr>
            <td style="width:50%;padding-right:10px;">
                <div class="field-label" style="color:#555;">Printed by</div>
                <div style="font-size:8.5pt;font-weight:bold;color:#1a1a1a;">{{ $printedBy }}</div>
                <div style="font-size:7pt;color:#888;">{{ $printedAt }}</div>
            </td>
            <td style="width:50%;text-align:right;">
                @if($barangay->captain_name)
                    <div class="signature-line" style="margin-left:auto;"></div>
                    <div style="font-size:8pt;font-weight:bold;text-align:center;">{{ strtoupper($barangay->captain_name) }}</div>
                    <div style="font-size:7pt;color:#555;text-align:center;">Punong Barangay</div>
                    <div style="font-size:7pt;color:#555;text-align:center;">Barangay {{ $barangay->name }}</div>
                @endif
            </td>
        </tr>
    </table>
    <div class="footer-notice">
        This document is for official use only. Unauthorized reproduction or alteration of this record is punishable by law.
        Issued pursuant to Section 389(b)(4) of the Local Government Code of 1991 (RA 7160).
        @if($barangay->document_footer_text)
            {{ $barangay->document_footer_text }}
        @endif
    </div>
</div>

</body>
</html>
