<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $documentTitle }} — {{ $document->constituent_number }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @page { margin: 20mm 18mm 20mm 18mm; }
        body { font-family: sans-serif; font-size: 11pt; color: #1a1a1a; background: #fff; line-height: 1.6; }

        /* ── Header ── */
        .header { text-align: center; padding-bottom: 8px; margin-bottom: 16px; border-bottom: 3px double #1a3a6e; }
        .header-table { width: 100%; border-collapse: collapse; }
        .seal-cell { width: 80px; text-align: center; vertical-align: middle; }
        .seal-img { width: 70px; height: 70px; }
        .header-text { text-align: center; vertical-align: middle; }
        .republic-text { font-size: 9pt; color: #444; letter-spacing: 1px; text-transform: uppercase; }
        .province-text { font-size: 9pt; color: #555; }
        .municipality-text { font-size: 10pt; color: #333; font-weight: 600; }
        .barangay-name { font-size: 16pt; font-weight: bold; color: #1a3a6e; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
        .office-text { font-size: 9pt; color: #666; font-style: italic; }

        /* ── Confidential watermark ── */
        .confidential-banner {
            background: #7f1d1d; color: #fff; text-align: center;
            font-size: 8pt; font-weight: bold; letter-spacing: 3px;
            padding: 3px 0; margin-bottom: 10px; text-transform: uppercase;
        }

        /* ── Document title ── */
        .doc-title { text-align: center; font-size: 15pt; font-weight: bold; color: #1a3a6e; text-transform: uppercase; letter-spacing: 2px; margin: 16px 0 4px; }
        .doc-ref   { text-align: center; font-size: 9pt; color: #666; margin-bottom: 20px; }

        /* ── Section labels ── */
        .section-label { font-size: 8pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #1a3a6e; border-bottom: 1px solid #1a3a6e; margin: 16px 0 8px; padding-bottom: 2px; }

        /* ── Field rows ── */
        .field-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .field-table td { padding: 3px 4px; font-size: 10pt; vertical-align: top; }
        .field-label { font-weight: bold; width: 160px; white-space: nowrap; color: #333; }
        .field-value { color: #111; }

        /* ── Narrative box ── */
        .narrative-box { border: 1px solid #ccc; padding: 10px 12px; font-size: 10pt; line-height: 1.7; margin-bottom: 10px; min-height: 60px; background: #fafafa; }

        /* ── Badge ── */
        .badge { display: inline-block; padding: 2px 8px; font-size: 8pt; font-weight: bold; border: 1px solid; border-radius: 2px; }
        .badge-green { color: #065f46; border-color: #6ee7b7; background: #ecfdf5; }
        .badge-red   { color: #991b1b; border-color: #fca5a5; background: #fef2f2; }
        .badge-amber { color: #92400e; border-color: #fcd34d; background: #fffbeb; }
        .badge-blue  { color: #1e40af; border-color: #93c5fd; background: #eff6ff; }

        /* ── Signature block ── */
        .signature-block { margin-top: 50px; }
        .sig-table { width: 100%; border-collapse: collapse; }
        .sig-cell { width: 50%; vertical-align: bottom; padding: 0 20px; }
        .sig-left { text-align: left; }
        .sig-right { text-align: right; }
        .sig-attested { font-size: 9pt; color: #666; margin-bottom: 4px; }
        .sig-name { font-size: 11pt; font-weight: bold; text-transform: uppercase; border-top: 1px solid #333; padding-top: 4px; display: inline-block; min-width: 200px; text-align: center; }
        .sig-position { font-size: 9pt; color: #555; text-align: center; }

        /* ── Footer ── */
        .footer { position: fixed; bottom: 0; left: 0; right: 0; border-top: 1px solid #ddd; padding-top: 8px; font-size: 7pt; color: #999; }
        .footer-table { width: 100%; border-collapse: collapse; }
        .footer-left { text-align: left; vertical-align: middle; }
        .footer-center { text-align: center; vertical-align: middle; }
        .footer-right { text-align: right; vertical-align: middle; }
        .qr-img { width: 60px; height: 60px; }
    </style>
</head>
<body>

    {{-- ── HEADER ── --}}
    <div class="header">
        <table class="header-table">
            <tr>
                @if($sealDataUri)
                <td class="seal-cell"><img src="{{ $sealDataUri }}" class="seal-img" alt="Barangay Seal"></td>
                @endif
                <td class="header-text">
                    <div class="republic-text">Republic of the Philippines</div>
                    <div class="province-text">Province of {{ $barangay->province ?? '________________' }}</div>
                    <div class="municipality-text">{{ $barangay->city_municipality ?? '________________' }}</div>
                    <div class="barangay-name">Barangay {{ $barangay->name ?? '________________' }}</div>
                    <div class="office-text">Office of the Punong Barangay</div>
                </td>
                @if($sealDataUri)
                <td class="seal-cell"><img src="{{ $sealDataUri }}" class="seal-img" alt="Barangay Seal"></td>
                @endif
            </tr>
        </table>
    </div>

    {{-- ── CONFIDENTIAL BANNER (VAWC only) ── --}}
    @if($isConfidential)
    <div class="confidential-banner">CONFIDENTIAL &mdash; RA 9262 &amp; RA 10173 &mdash; Authorized Personnel Only</div>
    @endif

    {{-- ── DOCUMENT TITLE ── --}}
    <div class="doc-title">{{ $documentTitle }}</div>
    <div class="doc-ref">
        Document No.: {{ $document->document_number }} &nbsp;&bull;&nbsp;
        Date: {{ $document->issued_date?->format('F d, Y') ?? now()->format('F d, Y') }}
        @if($document->constituent_number)
        &nbsp;&bull;&nbsp; Ref.: {{ $document->constituent_number }}
        @endif
    </div>

    {{-- ══════════════════════════════ KP CASE ══════════════════════════════ --}}
    @if($caseType === 'kp_case')

    <div class="section-label">Case Information</div>
    <table class="field-table">
        <tr><td class="field-label">Case Number:</td><td class="field-value">{{ $fields['case_number'] ?? '&mdash;' }}</td>
            <td class="field-label">Filing Date:</td><td class="field-value">{{ $fields['filing_date'] ?? '&mdash;' }}</td></tr>
        <tr><td class="field-label">Case Level:</td><td class="field-value">{{ ucfirst(str_replace('_', ' ', $fields['case_level'] ?? '&mdash;')) }}</td>
            <td class="field-label">Status:</td><td class="field-value">{{ ucfirst(str_replace('_', ' ', $fields['status'] ?? '&mdash;')) }}</td></tr>
        <tr><td class="field-label">Nature of Dispute:</td><td class="field-value" colspan="3">{{ $fields['nature'] ?? $fields['nature_of_complaint'] ?? '&mdash;' }}</td></tr>
    </table>

    <div class="section-label">Parties</div>
    <table class="field-table">
        <tr><td class="field-label">Complainant(s):</td><td class="field-value" colspan="3">{{ $fields['complainants'] ?? '&mdash;' }}</td></tr>
        <tr><td class="field-label">Respondent(s):</td><td class="field-value" colspan="3">{{ $fields['respondents'] ?? '&mdash;' }}</td></tr>
    </table>

    @if(!empty($fields['settlement_text']))
    <div class="section-label">Settlement Agreement</div>
    <div class="narrative-box">{{ $fields['settlement_text'] }}</div>
    @endif

    @if(!empty($fields['cfa_reason']))
    <div class="section-label">Certification to File Action &mdash; Reason</div>
    <div class="narrative-box">{{ $fields['cfa_reason'] }}</div>
    @endif

    @if(($fields['document_type'] ?? '') === 'certification_to_file_action')
    <p style="margin: 16px 0; font-size: 11pt; text-align: justify; line-height: 1.8;">
        This is to certify that the above-captioned case was filed with this Barangay on
        <strong>{{ $fields['filing_date'] ?? '_______________' }}</strong> and that the parties failed to reach
        an amicable settlement after due mediation/conciliation proceedings.
        This certification is issued to allow the filing of the appropriate action before the courts.
    </p>
    @endif

    @if(($fields['document_type'] ?? '') === 'summons')
    <p style="margin: 16px 0; font-size: 11pt; text-align: justify; line-height: 1.8;">
        You are hereby summoned to appear before the Lupong Tagapamayapa of Barangay
        {{ $barangay->name }} on <strong>________________________________</strong> at <strong>________</strong>
        for mediation proceedings in the above-captioned case.
        Failure to appear without justifiable cause may subject you to legal sanctions.
    </p>
    @endif

    {{-- ══════════════════════════════ VAWC CASE ══════════════════════════════ --}}
    @elseif($caseType === 'vawc_case')

    <div class="section-label">Case Information</div>
    <table class="field-table">
        <tr><td class="field-label">Case Number:</td><td class="field-value">{{ $fields['case_number'] ?? '&mdash;' }}</td>
            <td class="field-label">Filing Date:</td><td class="field-value">{{ $fields['filing_date'] ?? '&mdash;' }}</td></tr>
        <tr><td class="field-label">Type of Violence:</td><td class="field-value">{{ $fields['incident_type'] ?? '&mdash;' }}</td>
            <td class="field-label">Incident Date:</td><td class="field-value">{{ $fields['incident_date'] ?? '&mdash;' }}</td></tr>
        <tr><td class="field-label">Place of Incident:</td><td class="field-value" colspan="3">{{ $fields['incident_place'] ?? '&mdash;' }}</td></tr>
        <tr><td class="field-label">Case Status:</td><td class="field-value" colspan="3">{{ ucfirst(str_replace('_', ' ', $fields['status'] ?? '&mdash;')) }}</td></tr>
    </table>

    <div class="section-label">Victim-Survivor</div>
    <table class="field-table">
        <tr><td class="field-label">Name:</td><td class="field-value" colspan="3">{{ $fields['victim_name'] ?? '&mdash;' }}</td></tr>
        <tr><td class="field-label">Date of Birth:</td><td class="field-value">{{ $fields['victim_dob'] ?? '&mdash;' }}</td>
            <td class="field-label">Civil Status:</td><td class="field-value">{{ $fields['victim_civil_status'] ?? '&mdash;' }}</td></tr>
        <tr><td class="field-label">Address:</td><td class="field-value" colspan="3">{{ $fields['victim_address'] ?? '&mdash;' }}</td></tr>
        <tr><td class="field-label">Contact No.:</td><td class="field-value">{{ $fields['victim_phone'] ?? '&mdash;' }}</td>
            <td class="field-label">Occupation:</td><td class="field-value">{{ $fields['victim_occupation'] ?? '&mdash;' }}</td></tr>
        @if(!empty($fields['victim_income_range']))
        <tr><td class="field-label">Monthly Income:</td><td class="field-value" colspan="3">{{ $fields['victim_income_range'] }}</td></tr>
        @endif
    </table>

    <div class="section-label">Respondent</div>
    <table class="field-table">
        <tr><td class="field-label">Name:</td><td class="field-value" colspan="3">{{ $fields['respondent_name'] ?? '&mdash;' }}</td></tr>
        <tr><td class="field-label">Relationship:</td><td class="field-value">{{ $fields['respondent_relationship'] ?? '&mdash;' }}</td>
            <td class="field-label">Civil Status:</td><td class="field-value">{{ $fields['respondent_civil_status'] ?? '&mdash;' }}</td></tr>
        <tr><td class="field-label">Address:</td><td class="field-value" colspan="3">{{ $fields['respondent_address'] ?? '&mdash;' }}</td></tr>
        <tr><td class="field-label">Contact No.:</td><td class="field-value" colspan="3">{{ $fields['respondent_phone'] ?? '&mdash;' }}</td></tr>
    </table>

    @if(!empty($fields['narrative']))
    <div class="section-label">Incident Narrative</div>
    <div class="narrative-box">{{ $fields['narrative'] }}</div>
    @endif

    @if(!empty($fields['children_info']))
    <div class="section-label">Children Information</div>
    <div class="narrative-box">{{ $fields['children_info'] }}</div>
    @endif

    <div class="section-label">Protection Orders &amp; Referrals</div>
    <table class="field-table">
        <tr>
            <td class="field-label">BPO Issued:</td>
            <td class="field-value">
                @if(($fields['bpo_issued'] ?? '') === 'Yes')
                <span class="badge badge-green">YES</span> {{ $fields['bpo_issued_date'] ?? '' }}
                @if(!empty($fields['bpo_expiry_date'])) &mdash; Expires: {{ $fields['bpo_expiry_date'] }} @endif
                @else
                <span class="badge badge-red">NO</span>
                @endif
            </td>
            <td class="field-label">PNP Referred:</td>
            <td class="field-value">
                @if(($fields['referred_to_pnp'] ?? '') === 'Yes')
                <span class="badge badge-blue">YES</span> {{ $fields['pnp_referral_time'] ?? '' }}
                @else
                <span class="badge badge-red">NO</span>
                @endif
            </td>
        </tr>
        <tr>
            <td class="field-label">MSWDO Referred:</td>
            <td class="field-value" colspan="3">
                @if(($fields['referred_to_dswd'] ?? '') === 'Yes')
                <span class="badge badge-blue">YES</span> {{ $fields['dswd_referral_time'] ?? '' }}
                @else
                <span class="badge badge-red">NO</span>
                @endif
            </td>
        </tr>
    </table>

    {{-- ══════════════════════════════ BLOTTER ══════════════════════════════ --}}
    @elseif($caseType === 'blotter')

    <div class="section-label">Blotter Information</div>
    <table class="field-table">
        <tr><td class="field-label">Blotter No.:</td><td class="field-value">{{ $fields['blotter_number'] ?? '&mdash;' }}</td>
            <td class="field-label">Filing Date:</td><td class="field-value">{{ $fields['filing_date'] ?? '&mdash;' }}</td></tr>
        <tr><td class="field-label">Incident Type:</td><td class="field-value">{{ $fields['incident_type'] ?? '&mdash;' }}</td>
            <td class="field-label">Incident Date:</td><td class="field-value">{{ $fields['incident_date'] ?? '&mdash;' }}</td></tr>
        <tr><td class="field-label">Incident Time:</td><td class="field-value">{{ $fields['incident_time'] ?? '&mdash;' }}</td>
            <td class="field-label">Place:</td><td class="field-value">{{ $fields['incident_place'] ?? '&mdash;' }}</td></tr>
        <tr><td class="field-label">Status:</td><td class="field-value" colspan="3">{{ ucfirst(str_replace('_', ' ', $fields['status'] ?? '&mdash;')) }}</td></tr>
    </table>

    <div class="section-label">Parties</div>
    <table class="field-table">
        <tr><td class="field-label">Complainant:</td><td class="field-value">{{ $fields['complainant_name'] ?? '&mdash;' }}</td>
            <td class="field-label">Address:</td><td class="field-value">{{ $fields['complainant_address'] ?? '&mdash;' }}</td></tr>
        <tr><td class="field-label">Respondent:</td><td class="field-value">{{ $fields['respondent_name'] ?? '&mdash;' }}</td>
            <td class="field-label">Address:</td><td class="field-value">{{ $fields['respondent_address'] ?? '&mdash;' }}</td></tr>
    </table>

    <div class="section-label">Incident Narrative</div>
    <div class="narrative-box">{{ $fields['narrative'] ?? '&mdash;' }}</div>

    @if(!empty($fields['resolution']))
    <div class="section-label">Resolution / Action Taken</div>
    <div class="narrative-box">{{ $fields['resolution'] }}</div>
    @endif

    <p style="margin: 16px 0; font-size: 11pt; text-align: justify; line-height: 1.8;">
        This is to certify that the above-described incident was duly recorded in the Barangay Blotter
        of Barangay {{ $barangay->name }}, {{ $barangay->city_municipality }}, {{ $barangay->province }}
        on <strong>{{ $fields['filing_date'] ?? '_______________' }}</strong>.
        This certification is issued upon request for whatever legal purpose it may serve.
    </p>

    @endif

    {{-- ── ISSUED DATE ── --}}
    <div style="margin: 24px 0; font-size: 11pt;">
        <strong>Issued this {{ $document->issued_date?->format('jS') ?? now()->format('jS') }} day of
        {{ $document->issued_date?->format('F, Y') ?? now()->format('F, Y') }}</strong>
        at Barangay {{ $barangay->name }}, {{ $barangay->city_municipality }}, {{ $barangay->province }}.
    </div>

    {{-- ── SIGNATURE BLOCK ── --}}
    <div class="signature-block">
        <table class="sig-table">
            <tr>
                <td class="sig-cell sig-left">
                    <div class="sig-attested">Prepared by:</div>
                    <div class="sig-name">{{ $issuedByName !== 'System' ? $issuedByName : '______________________________' }}</div>
                    <div class="sig-position">
                        @if($caseType === 'vawc_case') VAW Desk Officer @else Barangay Secretary @endif
                    </div>
                </td>
                <td class="sig-cell sig-right">
                    <div class="sig-attested">Processed by:</div>
                    <div class="sig-name">______________________________</div>
                    <div class="sig-position">Punong Barangay</div>
                </td>
            </tr>
        </table>
    </div>

    {{-- ── FOOTER ── --}}
    <div class="footer">
        <table class="footer-table">
            <tr>
                <td class="footer-left">
                    Generated by: {{ $issuedByName }}<br>
                    Date: {{ $issuedAt }}
                </td>
                <td class="footer-center">
                    @if($document->blockchain_hash)
                    <span style="font-size: 6pt;">Hash: {{ substr($document->blockchain_hash, 0, 16) }}...</span>
                    @endif
                </td>
                <td class="footer-right">
                    @if($qrDataUri)
                    <img src="{{ $qrDataUri }}" class="qr-img" alt="Verification QR">
                    <br><span style="font-size: 6pt;">Scan to verify</span>
                    @endif
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
