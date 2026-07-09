<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $template->title ?? 'Barangay ID' }}</title>
    <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; }
        body {
            font-family: sans-serif;
            font-size: 6pt;
            color: #1e293b;
            background: #fff;
            width: 242.64pt;
            height: 153.07pt;
        }

        .card {
            width: 242.64pt;
            height: 153.07pt;
            border-collapse: collapse;
            table-layout: fixed;
            background: #fff;
        }
        .card td { padding: 0; border: none; }

        .hdr td { background: #1a3a6e; color: #fff; vertical-align: middle; }
        .hdr img { width: 22pt; height: 22pt; }

        .band td {
            background: #f59e0b;
            text-align: center;
            font-size: 5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.8pt;
            color: #1a1a1a;
            line-height: 1;
        }

        .body-row > td { vertical-align: top; background: #fff; }

        .ftr td { background: #f8fafc; border-top: 0.5pt solid #e2e8f0; vertical-align: middle; }

        .fl { font-size: 4pt; color: #888; text-transform: uppercase; letter-spacing: 0.2pt; line-height: 1; }
        .fv { font-size: 5.5pt; font-weight: 600; border-bottom: 0.5pt solid #e5e7eb; padding-bottom: 1pt; line-height: 1.2; }

        /* Tambo Custom styles */
        .tambo-card {
            position: relative;
            width: 239.64pt;
            height: 150.07pt;
            border: 1.5pt solid #1a3a8c;
            background: #ffffff;
            overflow: hidden;
        }
    </style>
</head>
<body>
@php
    $templateCategory = strtolower((string) ($template->category ?? 'barangay_id'));
    $idTheme = match ($templateCategory) {
        'family_id' => ['titleBg' => '#14532d', 'title' => 'FAMILY I.D.'],
        'staff_id' => ['titleBg' => '#b45309', 'title' => 'OFFICIAL I.D.'],
        default => ['titleBg' => '#0a1d56', 'title' => 'BARANGAY I.D.'],
    };
    $backIssuedLong = $document->issued_date
        ? strtoupper(\Carbon\Carbon::parse($document->issued_date)->format('F d, Y'))
        : '—';
    $backValidMonths = (int) ($settings['expiry_months'] ?? 12);
    $backPbOfficial = collect($officials ?? [])->first(fn ($o) => strtolower($o->position ?? '') === 'punong barangay')
        ?? collect($officials ?? [])->first();
    $backCaptainName = ($backPbOfficial->name ?? null) ?: ($barangay->captain_name ?: '—');
    $backSignatoryLabel = ($backPbOfficial->position ?? null) ?: ($approvalConfig['right']['label'] ?? 'Punong Barangay');
@endphp
@if(strtolower($barangay->name) === 'tambo')
<div class="tambo-card">

    {{-- HEADER background wave ribbons --}}
    <div style="position: absolute; top: 0; left: 0; width: 239.64pt; height: 50.5pt; overflow: hidden; z-index: 1;">
        <svg style="width: 100%; height: 100%;" viewBox="0 0 400 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-10,45 C60,25 130,65 200,40 C270,15 340,55 410,35" stroke="#5ba3d9" stroke-width="20" fill="none" opacity="0.4" stroke-linecap="round"/>
            <path d="M-10,60 C70,40 140,75 210,52 C280,30 350,65 410,48" stroke="#3b8fd0" stroke-width="14" fill="none" opacity="0.5" stroke-linecap="round"/>
            <path d="M-10,72 C80,55 150,85 220,65 C290,45 360,75 410,60" stroke="#2b7cc4" stroke-width="10" fill="none" opacity="0.6" stroke-linecap="round"/>
        </svg>
    </div>

    {{-- MAIN LAYOUT TABLE --}}
    <table style="width: 239.64pt; height: 150.07pt; border-collapse: collapse; table-layout: fixed; position: absolute; top: 0; left: 0; z-index: 2;" cellpadding="0" cellspacing="0">
        
        {{-- HEADER Row --}}
        <tr style="height: 33pt;">
            <td style="vertical-align: middle; padding: 0;">
                <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="width: 32pt; text-align: center; vertical-align: middle; padding-left: 5pt;">
                            @if($sealDataUri)
                                <img src="{{ $sealDataUri }}" style="width: 22pt; height: 22pt; border-radius: 50%; border: 1pt solid rgba(255,255,255,0.85); box-shadow: 0 0.5pt 2pt rgba(0,0,0,0.25);">
                            @endif
                        </td>
                        <td style="text-align: center; vertical-align: middle; line-height: 1.1; padding: 2pt 0 1pt 0;">
                            <div style="font-size: 5.5pt; font-weight: 600; color: #1a3a6e; text-transform: uppercase; letter-spacing: 0.1pt; font-style: italic;">Republic of the Philippines</div>
                            <div style="font-size: 6pt; font-weight: 900; color: #0a1e5e; text-transform: uppercase; letter-spacing: 0.2pt; margin: 0.5pt 0 0;">NATIONAL CAPITAL REGION</div>
                            <div style="font-size: 5.5pt; font-weight: 500; color: #1a3a6e; text-transform: uppercase; letter-spacing: 0.1pt; margin: 0.5pt 0 0;">City/Municipality of PARAÑAQUE</div>
                            <div style="font-size: 9.5pt; font-weight: 900; color: #0a1050; letter-spacing: 0.3pt; margin: 1pt 0 0;">BARANGAY TAMBO</div>
                        </td>
                        <td style="width: 32pt; text-align: center; vertical-align: middle; padding-right: 5pt;">
                            @if($municipalityLogoUrl)
                                <img src="{{ $municipalityLogoUrl }}" style="width: 22pt; height: 22pt; border-radius: 50%; border: 1pt solid rgba(255,255,255,0.85); box-shadow: 0 0.5pt 2pt rgba(0,0,0,0.25);">
                            @elseif($sealDataUri)
                                <img src="{{ $sealDataUri }}" style="width: 22pt; height: 22pt; border-radius: 50%; border: 1pt solid rgba(255,255,255,0.85); box-shadow: 0 0.5pt 2pt rgba(0,0,0,0.25);">
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        {{-- PILL Row --}}
        <tr style="height: 15pt;">
            <td style="vertical-align: top; padding: 0 12pt;">
                <div style="background: {{ $idTheme['titleBg'] }}; border-radius: 9999px; color: #ffffff; font-weight: 900; font-size: 8.5pt; letter-spacing: 2.5pt; text-align: center; line-height: 12pt; height: 12pt; box-shadow: 0 1.5pt 3pt rgba(0,0,0,0.25); margin-top: 1pt;">
                    {{ $idTheme['title'] }}
                </div>
            </td>
        </tr>
        {{-- BODY Row --}}
        <tr style="height: 102pt;">
            <td style="vertical-align: top; padding: 0;">
                <table style="width: 100%; border-collapse: collapse; table-layout: fixed;" cellpadding="0" cellspacing="0">
                    <tr>
                        <!-- Left Column: Photo & Signature -->
                        <td style="width: 78pt; vertical-align: top; padding-left: 6pt; padding-right: 4pt; padding-top: 2pt;">
                            <!-- Photo Container -->
                            <div style="width: 68pt; height: 68pt; border: 1.5pt solid #1a3a8c; background: #ffffff; overflow: hidden; border-radius: 3pt;">
                                @if($photoDataUri && ($settings['show_photo'] ?? false))
                                    <img src="{{ $photoDataUri }}" style="width: 100%; height: 100%; object-fit: cover;">
                                @else
                                    <div style="font-size: 7pt; color: #ccc; padding-top: 22pt; font-weight: bold; text-align: center; line-height: 1.2;">2x2<br>PHOTO</div>
                                @endif
                            </div>
                            <!-- Signature Container -->
                            <div style="width: 68pt; text-align: center; margin-top: 8pt;">
                                <div style="width: 58pt; border-bottom: 0.75pt solid #000; margin: 0 auto; height: 1pt;"></div>
                                <div style="font-size: 4.5pt; color: #000; font-weight: 500; text-align: center; letter-spacing: 0.1pt; line-height: 1.2; margin-top: 1pt;">Bearers Signature</div>
                            </div>
                        </td>

                        <!-- Right Column: Details Box -->
                        <td style="width: 161.64pt; vertical-align: top; padding-left: 2pt; padding-right: 5.64pt; padding-top: 2pt;">
                            <!-- ID NO Container -->
                            <div style="margin-bottom: 3pt; line-height: 12pt; height: 12pt; padding-left: 2pt;">
                                <span style="background: #1a3a8c; color: #ffffff; font-size: 7pt; font-weight: 900; padding: 1.5pt 4.5pt; border-radius: 2pt; letter-spacing: 0.5pt; display: inline-block; line-height: 1; vertical-align: middle;">I.D. NO.</span>
                                <span style="font-size: 9.5pt; font-weight: 900; color: #000000; letter-spacing: 0.8pt; margin-left: 3pt; display: inline-block; line-height: 1; vertical-align: middle;">{{ $document->document_number }}</span>
                            </div>
                            
                            <!-- Details Box -->
                            <div style="width: 154pt; height: 74pt; border: 1.5pt solid #1a3a8c; border-radius: 6pt; background: #ffffff; overflow: hidden; padding-top: 2pt;">
                                
                                {{-- Decoupled table rows to replicate React flexbox shrink/grow widths --}}
                                
                                {{-- NAME ROW --}}
                                <table style="width: 100%; border-collapse: collapse; margin-bottom: 3pt;" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="width: 30pt; font-size: 6.5pt; font-weight: 900; color: #000; vertical-align: bottom; padding-left: 5pt; white-space: nowrap;">NAME:</td>
                                        <td style="border-bottom: 0.75pt solid #000; font-size: 6.5pt; font-weight: 700; color: #000; font-style: italic; vertical-align: bottom; padding-bottom: 0.5pt; padding-left: 2pt; padding-right: 5pt; white-space: nowrap;">
                                            @if($resident)
                                                {{ $resident->first_name }}{{ $resident->middle_name ? ' '.substr($resident->middle_name, 0, 1).'.' : '' }} {{ $resident->last_name }}{{ $resident->extension_name ? ' '.$resident->extension_name : '' }}
                                            @else
                                                {{ $document->constituent_name }}
                                            @endif
                                        </td>
                                    </tr>
                                </table>

                                {{-- ADDRESS ROW 1 --}}
                                <table style="width: 100%; border-collapse: collapse; margin-bottom: 3pt;" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="width: 30pt; font-size: 6.5pt; font-weight: 900; color: #000; vertical-align: bottom; padding-left: 5pt; white-space: nowrap;">ADDRESS:</td>
                                        <td style="border-bottom: 0.75pt solid #000; font-size: 6.0pt; font-weight: 700; color: #000; font-style: italic; vertical-align: bottom; padding-bottom: 0.5pt; padding-left: 2pt; padding-right: 5pt; white-space: nowrap;">
                                            @if($resident)
                                                {{ implode(' ', array_filter([$resident->house_block_lot ?? null, $resident->purok ?? null, $resident->street ?? null])) ?: '—' }}
                                            @else
                                                {{ $mergeValues['address'] ?? '—' }}
                                            @endif
                                        </td>
                                    </tr>
                                </table>

                                {{-- ADDRESS ROW 2 --}}
                                <table style="width: 100%; border-collapse: collapse; margin-bottom: 3pt;" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="width: 30pt; padding-left: 5pt;"></td>
                                        <td style="border-bottom: 0.75pt solid #000; font-size: 5.5pt; font-weight: 700; color: #000; font-style: italic; vertical-align: bottom; padding-bottom: 0.5pt; text-align: center; padding-right: 5pt; white-space: nowrap;">
                                            TAMBO, PARA&Ntilde;QUE CITY
                                        </td>
                                    </tr>
                                </table>

                                {{-- PLACE OF BIRTH ROW --}}
                                <table style="width: 100%; border-collapse: collapse; margin-bottom: 3pt;" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="width: 68pt; font-size: 6.5pt; font-weight: 900; color: #000; vertical-align: bottom; padding-left: 5pt; white-space: nowrap;">PLACE OF BIRTH:</td>
                                        <td style="border-bottom: 0.75pt solid #000; font-size: 6.0pt; font-weight: 700; color: #000; font-style: italic; vertical-align: bottom; padding-bottom: 0.5pt; padding-left: 2pt; padding-right: 5pt; white-space: nowrap;">
                                            {{ $mergeValues['place_of_birth'] ?? ($resident->place_of_birth ?? '—') }}
                                        </td>
                                    </tr>
                                </table>

                                {{-- DATE OF BIRTH ROW --}}
                                <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="width: 65pt; font-size: 6.5pt; font-weight: 900; color: #000; vertical-align: bottom; padding-left: 5pt; white-space: nowrap;">DATE OF BIRTH:</td>
                                        <td style="border-bottom: 0.75pt solid #000; font-size: 6.0pt; font-weight: 700; color: #000; font-style: italic; vertical-align: bottom; padding-bottom: 0.5pt; padding-left: 2pt; padding-right: 5pt; white-space: nowrap;">
                                            @if($resident && $resident->date_of_birth)
                                                {{ strtoupper($resident->date_of_birth->format('F j, Y')) }}
                                            @else
                                                @php
                                                    $dobRaw = $mergeValues['date_of_birth'] ?? '—';
                                                    if ($dobRaw !== '—') {
                                                        try {
                                                            $dobFormatted = strtoupper(\Carbon\Carbon::parse($dobRaw)->format('F j, Y'));
                                                        } catch (\Throwable $e) {
                                                            $dobFormatted = strtoupper($dobRaw);
                                                        }
                                                    } else {
                                                        $dobFormatted = '—';
                                                    }
                                                @endphp
                                                {{ $dobFormatted }}
                                            @endif
                                        </td>
                                    </tr>
                                </table>

                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

    </table>

</div>
@else
<table class="card" cellpadding="0" cellspacing="0">

    {{-- ROW 1: HEADER (38pt) --}}
    <tr class="hdr" style="height: 38pt;">
        <td style="width: 30pt; text-align: center;">
            @if($sealDataUri)<img src="{{ $sealDataUri }}" alt="">@endif
        </td>
        <td style="text-align: center; line-height: 1.2; padding-top: 4pt; padding-bottom: 7pt;" colspan="2">
            <div style="font-size: 4.5pt; text-transform: uppercase; letter-spacing: 0.5pt; opacity: 0.85;">Republic of the Philippines</div>
            <div style="font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3pt;">Barangay {{ $barangay->name }}</div>
            <div style="font-size: 4.5pt; opacity: 0.85;">{{ $barangay->city_municipality }}{{ $barangay->province ? ', '.$barangay->province : '' }}</div>
        </td>
        <td style="width: 30pt; text-align: center;">
            @if($municipalityLogoUrl)<img src="{{ $municipalityLogoUrl }}" alt="">@elseif($sealDataUri)<img src="{{ $sealDataUri }}" alt="">@endif
        </td>
    </tr>

    {{-- ROW 2: BAND (7pt) --}}
    <tr class="band" style="height: 7pt;">
        <td colspan="4" style="background: {{ $idTheme['titleBg'] }}; color: #ffffff;">{{ $idTheme['title'] }}</td>
    </tr>

    {{-- ROW 3: BODY (84pt) --}}
    <tr class="body-row" style="height: 84pt;">
        {{-- Photo column --}}
        <td style="width: 56pt; vertical-align: top; text-align: center; padding: 4pt 2pt 3pt 4pt; border-right: 0.5pt solid #e2e8f0;">
            @if($photoDataUri && ($settings['show_photo'] ?? false))
                <img src="{{ $photoDataUri }}" alt="" style="width: 46pt; height: 52pt; border: 0.75pt solid #1a3a6e;">
            @else
                <div style="width: 46pt; height: 52pt; border: 0.75pt solid #1a3a6e; background: #f0f4ff; margin: 0 auto;">
                    <div style="font-size: 5pt; color: #aaa; padding-top: 18pt; text-align: center; line-height: 1.2;">2x2<br>PHOTO</div>
                </div>
            @endif
            @if($settings['show_thumbmark'] ?? false)
                <div style="font-size: 4pt; color: #888; text-transform: uppercase; margin-top: 2pt;">Thumbmark</div>
                <div style="width: 26pt; height: 14pt; border: 0.5pt solid #bbb; margin: 1pt auto 0;"></div>
            @endif
        </td>

        {{-- Details column --}}
        <td style="vertical-align: top; padding: 4pt 4pt 25pt 5pt;" colspan="3">
            {{-- Name --}}
            <div style="border-bottom: 0.75pt solid #1a3a6e; padding-bottom: 2pt; margin-bottom: 3pt;">
                <div class="fl">Name</div>
                <div style="font-size: 9pt; font-weight: bold; color: #1a3a6e; text-transform: uppercase; line-height: 1.1;">{{ $document->constituent_name }}</div>
            </div>

            {{-- DOB / Sex / Blood --}}
            <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="width: 45%; padding-right: 3pt; vertical-align: top;">
                        <div class="fl">Date of Birth</div>
                        <div class="fv">{{ $mergeValues['date_of_birth'] ?? '—' }}</div>
                    </td>
                    <td style="width: 25%; padding-right: 3pt; vertical-align: top;">
                        <div class="fl">Sex</div>
                        <div class="fv">{{ $mergeValues['sex'] ?? '—' }}</div>
                    </td>
                    <td style="width: 30%; vertical-align: top;">
                        <div class="fl">Blood Type</div>
                        <div class="fv">{{ $mergeValues['blood_type'] ?? '—' }}</div>
                    </td>
                </tr>
            </table>

            {{-- Address --}}
            <div style="margin-top: 3pt;">
                <div class="fl">Address</div>
                <div class="fv" style="font-size: 4.5pt; font-weight: 500; line-height: 1.15;">{{ $mergeValues['address'] ?? '—' }}</div>
            </div>

            {{-- Emergency --}}
            <table style="width: 100%; border-collapse: collapse; margin-top: 3pt;" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="width: 55%; padding-right: 3pt; vertical-align: top;">
                        <div class="fl">Emergency Contact</div>
                        <div class="fv">{{ $mergeValues['emergency_contact'] ?? '—' }}</div>
                    </td>
                    <td style="width: 45%; vertical-align: top;">
                        <div class="fl">Contact No.</div>
                        <div class="fv">{{ $mergeValues['emergency_number'] ?? $mergeValues['contact_number'] ?? '—' }}</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    {{-- ROW 4: FOOTER (24pt) --}}
    <tr class="ftr" style="height: 24pt;">
        <td colspan="2" style="padding-left: 5pt;">
            <div style="font-size: 4pt; color: #888; text-transform: uppercase;">Valid From / Until</div>
            <div style="font-size: 5pt; font-weight: 600; color: #0f172a;">
                {{ \Carbon\Carbon::parse($document->issued_date)->format('M d, Y') }}
                &nbsp;–&nbsp;
                {{ $document->valid_until ? \Carbon\Carbon::parse($document->valid_until)->format('M d, Y') : 'N/A' }}
            </div>
            <div style="font-size: 3.5pt; color: #aaa;">No. {{ $document->document_number }}</div>
        </td>
        <td style="text-align: center; vertical-align: bottom; padding-bottom: 3pt;">
            <div style="width: 70pt; border-top: 0.75pt solid #1a3a6e; margin: 0 auto 1pt;"></div>
            <div style="font-size: 4.5pt; font-weight: bold; color: #1a3a6e; text-transform: uppercase;">{{ $barangay->captain_name ?: '—' }}</div>
            <div style="font-size: 3.5pt; color: #555; text-transform: uppercase; letter-spacing: 0.2pt;">{{ $approvalConfig['right']['label'] ?? 'Punong Barangay' }}</div>
        </td>
        <td style="width: 26pt; text-align: center; vertical-align: middle;">
            @if(($settings['show_qr'] ?? false) && $qrDataUri)
                <img src="{{ $qrDataUri }}" style="width: 18pt; height: 18pt;">
            @endif
        </td>
    </tr>

</table>
@endif

{{-- ══════════════════ BACK SIDE (certification) ══════════════════ --}}
<div style="page-break-before: always;"></div>
<div style="position: relative; width: 239.64pt; height: 150.07pt; border: 1.5pt solid #1a3a8c; background: #ffffff; overflow: hidden;">

    {{-- Wave ribbons (lower area) --}}
    <div style="position: absolute; left: 0; bottom: 0; width: 239.64pt; height: 90pt; overflow: hidden; z-index: 1;">
        <svg style="width: 100%; height: 100%;" viewBox="0 0 400 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-10,45 C60,25 130,65 200,40 C270,15 340,55 410,35" stroke="#5ba3d9" stroke-width="20" fill="none" opacity="0.3" stroke-linecap="round"/>
            <path d="M-10,60 C70,40 140,75 210,52 C280,30 350,65 410,48" stroke="#3b8fd0" stroke-width="14" fill="none" opacity="0.4" stroke-linecap="round"/>
            <path d="M-10,72 C80,55 150,85 220,65 C290,45 360,75 410,60" stroke="#2b7cc4" stroke-width="10" fill="none" opacity="0.5" stroke-linecap="round"/>
        </svg>
    </div>

    {{-- Title --}}
    <div style="position: absolute; top: 12pt; left: 0; width: 239.64pt; text-align: center; font-size: 9pt; font-weight: bold; letter-spacing: 1pt; color: #111; z-index: 2;">TO WHOM IT MAY CONCERN:</div>

    {{-- Certification paragraph --}}
    <div style="position: absolute; top: 28pt; left: 16pt; width: 207pt; text-align: justify; font-size: 7pt; line-height: 1.55; color: #111; z-index: 2;">
        This is to certify that the bearer whose name, address and photo appears on this card is a bonafide resident of this Barangay. Bearer has no derogatory records as of the issuance of any courtesy and assistance extended to him/her is highly appreciated.
    </div>

    {{-- Signatory (right) --}}
    <div style="position: absolute; right: 14pt; bottom: 32pt; width: 150pt; text-align: center; z-index: 2;">
        <div style="font-size: 8pt; font-weight: bold; color: #111; text-transform: uppercase; border-top: 0.75pt solid #333; padding-top: 1pt;">{{ $backCaptainName }}</div>
        <div style="font-size: 6pt; color: #333; text-transform: uppercase; letter-spacing: 0.3pt;">{{ $backSignatoryLabel }}</div>
    </div>

    {{-- Photo bottom-left (only when a photo is available) --}}
    @if($photoDataUri && ($settings['show_photo'] ?? false))
    <div style="position: absolute; left: 16pt; bottom: 26pt; width: 48pt; height: 56pt; border: 1pt solid #1a3a8c; background: #ffffff; overflow: hidden; z-index: 2;">
        <img src="{{ $photoDataUri }}" style="width: 100%; height: 100%; object-fit: cover;">
    </div>
    @endif

    {{-- Bottom bars --}}
    <div style="position: absolute; left: 12pt; bottom: 6pt; background: #0a1d56; color: #ffffff; font-size: 5pt; font-weight: bold; letter-spacing: 0.3pt; padding: 2pt 5pt; text-transform: uppercase; z-index: 2;">DATE ISSUED: {{ $backIssuedLong }}</div>
    <div style="position: absolute; right: 12pt; bottom: 6pt; background: #0a1d56; color: #ffffff; font-size: 5pt; font-weight: bold; letter-spacing: 0.3pt; padding: 2pt 5pt; text-transform: uppercase; z-index: 2;">I.D. VALID FOR {{ $backValidMonths }} MONTHS FROM ISSUANCE</div>

</div>
</body>
</html>
