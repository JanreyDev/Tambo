<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $template->title ?? 'Certificate' }} — {{ $document->constituent_name }}</title>
    <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; }
        body {
            font-family: {!! $fontFamily !!};
            font-size: 11pt;
            color: #1a1a1a;
            line-height: 1.6;
        }

        /* Watermark styling for DomPDF */
        .watermark {
            position: fixed;
            top: 35%;
            left: 45%;
            width: 400px;
            height: 400px;
            margin-left: -100px; /* shift to center in the right column */
            opacity: 0.07;
            z-index: -1000;
            text-align: center;
        }
        .watermark img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
    </style>
</head>
<body>

@if($sealDataUri)
<div class="watermark">
    <img src="{{ $sealDataUri }}" alt="Watermark">
</div>
@endif

{{-- ═══════════════════════════════════════════════════════
     ROW 1: FULL-WIDTH HEADER
     ═══════════════════════════════════════════════════════ --}}
<table width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 2px double {{ $themePrimary }}; background-color: #fff; padding-top: 20px;">
    <tr>
        @if(isset($municipalityLogoUrl) && $municipalityLogoUrl)
        <td width="100" align="center" valign="middle" style="padding: 15px 10px 15px 30px;">
            <img src="{{ $municipalityLogoUrl }}" width="70" height="70" alt="LGU Logo">
        </td>
        @else
        <td width="100" align="center" valign="middle" style="padding: 15px 10px 15px 30px;">
            @if($sealDataUri)
                <img src="{{ $sealDataUri }}" width="70" height="70" alt="Seal">
            @endif
        </td>
        @endif

        <td align="center" valign="middle" style="padding: 15px 10px;">
            <div style="font-size: 8pt; color: #666; letter-spacing: 3px; text-transform: uppercase;">REPUBLIC OF THE PHILIPPINES</div>
            <div style="font-size: 9pt; color: #333; margin-top: 3px;">Province of <strong>{{ $barangay->province ?? 'Metro Manila' }}</strong></div>
            <div style="font-size: 10pt; color: #1a1a1a; font-weight: bold; margin-top: 2px;">{{ $barangay->city_municipality ?? 'City' }}</div>
            <div style="font-size: 20pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">{{ $barangay->name ?? 'BARANGAY' }}</div>
        </td>

        <td width="100" align="center" valign="middle" style="padding: 15px 30px 15px 10px;">
            @if($sealDataUri)
            <img src="{{ $sealDataUri }}" width="70" height="70" alt="Seal">
            @endif
        </td>
    </tr>
</table>

{{-- ═══════════════════════════════════════════════════════
     ROW 2: TWO-COLUMN BODY
     ═══════════════════════════════════════════════════════ --}}
<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        {{-- ── LEFT SIDEBAR ── --}}
        <td width="32%" valign="top" style="background-color: {{ $themeTint }}; border-right: 1px solid {{ $themePrimary }}33;">

            <div style="padding: 20px 15px;">
                {{-- Sangguniang Barangay title --}}
                <div style="text-align: center; margin-bottom: 12px;">
                    <div style="font-size: 9pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase; letter-spacing: 1px;">SANGGUNIANG BARANGAY</div>
                    <div style="font-size: 8pt; font-weight: bold; color: {{ $themePrimary }}; letter-spacing: 2px; margin-top: 3px;">{{ $barangay->officials_term ?? '2024 — 2026' }}</div>
                </div>

                {{-- Divider --}}
                <div style="height: 1px; background-color: {{ $themePrimary }}; opacity: 0.5; margin: 15px 10px;"></div>

                {{-- Officials list --}}
                @foreach($officials as $official)
                <div style="text-align: center; margin-bottom: 12px;">
                    <div style="font-size: 8pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase;">HON. {{ strtoupper($official->name) }}</div>
                    <div style="font-size: 7pt; color: #444; font-style: italic; margin-top: 2px;">{{ $official->position }}</div>
                </div>
                @endforeach

                {{-- Diamond separator --}}
                <div style="text-align: center; margin: 25px 0 15px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="height: 1px; background-color: {{ $themePrimary }}44;"></td>
                            <td width="20" align="center" style="font-size: 10pt; color: {{ $themePrimary }}88;">&#9670;</td>
                            <td style="height: 1px; background-color: {{ $themePrimary }}44;"></td>
                        </tr>
                    </table>
                </div>

                {{-- Issued / Valid Until --}}
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                    <tr>
                        <td style="font-size: 7pt; color: #555; font-style: italic; text-transform: uppercase; letter-spacing: 1px;">ISSUED</td>
                        <td align="right" style="font-size: 7pt; font-weight: bold; color: {{ $themePrimary }};">{{ $document->issued_date?->format('M d, Y') ?? '—' }}</td>
                    </tr>
                </table>
                @if($document->valid_until)
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="font-size: 7pt; color: #555; font-style: italic; text-transform: uppercase; letter-spacing: 1px;">VALID UNTIL</td>
                        <td align="right" style="font-size: 7pt; font-weight: bold; color: {{ $themePrimary }};">{{ $document->valid_until->format('M d, Y') }}</td>
                    </tr>
                </table>
                @endif
            </div>

            {{-- Verify Document block --}}
            <div style="border-top: 1px solid {{ $themePrimary }}55; padding: 15px 10px; text-align: center;">
                <div style="font-size: 7pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">VERIFY DOCUMENT</div>
                @if($qrDataUri)
                <div style="border: 2px solid {{ $themePrimary }}; padding: 4px; background-color: #fff; display: inline-block;">
                    <img src="{{ $qrDataUri }}" width="65" height="65" alt="QR" style="display: block;">
                </div>
                @endif
            </div>
        </td>

        {{-- ── RIGHT CONTENT ── --}}
        <td width="68%" valign="top" style="padding: 30px 40px;">

            {{-- Certificate Title --}}
            <div style="text-align: center; margin-bottom: 8px;">
                <div style="font-size: 18pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase; letter-spacing: 4px;">{{ $template->title ?? $template->name }}</div>
            </div>

            {{-- Accent bar under title --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                    <td width="20%"></td>
                    <td width="60%" style="height: 6px; background-color: {{ $themeAccent }}; border-radius: 4px;"></td>
                    <td width="20%"></td>
                </tr>
            </table>

            {{-- Control Number --}}
            @if($settings['show_doc_no'] ?? false)
            <div style="text-align: center; font-size: 9pt; color: {{ $themeAccent }}; margin-bottom: 25px;">Control No.: {{ $document->document_number }}</div>
            @endif

            {{-- Salutation --}}
            @if($renderedSalutation)
            <div style="font-size: 11pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">{{ $renderedSalutation }}</div>
            @endif

            {{-- Body text --}}
            <div style="font-size: 11pt; text-align: justify; line-height: 1.8; color: #222; margin-bottom: 30px;">
                {!! $renderedContent !!}
            </div>


            {{-- Requested By / Purpose --}}
            <table cellpadding="0" cellspacing="0" style="margin: 20px 0 30px 30px; font-size: 9pt;">
                <tr>
                    <td style="font-weight: bold; color: {{ $themePrimary }}; padding-right: 15px; padding-bottom: 8px; white-space: nowrap;">Requested By:</td>
                    <td style="text-transform: uppercase; color: #222; padding-bottom: 8px;">{{ $document->constituent_name }}</td>
                </tr>
                @if($document->purpose)
                <tr>
                    <td style="font-weight: bold; color: {{ $themePrimary }}; padding-right: 15px; padding-bottom: 8px; white-space: nowrap;">Purpose:</td>
                    <td style="text-transform: uppercase; color: #222; padding-bottom: 8px;">{{ strtoupper($document->purpose) }}</td>
                </tr>
                @endif
            </table>

            {{-- OR / CTC Details --}}
            @if(($settings['show_or'] ?? false) && $document->or_number)
            <table cellpadding="0" cellspacing="0" style="margin: 0 0 10px 30px; font-size: 9pt;">
                <tr>
                    <td style="font-weight: bold; color: {{ $themePrimary }}; padding-right: 10px;">O.R. No.:</td>
                    <td style="color: #222;">{{ $document->or_number }}</td>
                    @if($document->or_amount !== null)
                    <td style="font-weight: bold; color: {{ $themePrimary }}; padding-left: 20px; padding-right: 10px;">Amount:</td>
                    <td style="color: #222;">&#8369;{{ number_format((float)$document->or_amount, 2) }}</td>
                    @endif
                </tr>
            </table>
            @endif

            @if(($settings['show_ctc'] ?? false) && $document->ctc_number)
            <table cellpadding="0" cellspacing="0" style="margin: 0 0 10px 30px; font-size: 9pt;">
                <tr>
                    <td style="font-weight: bold; color: {{ $themePrimary }}; padding-right: 10px;">CTC No.:</td>
                    <td style="color: #222;">{{ $document->ctc_number }}</td>
                </tr>
            </table>
            @endif

            {{-- Photo & Thumbmark --}}
            @if(($settings['show_photo'] ?? false) || ($settings['show_thumbmark'] ?? false))
            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                    @if($settings['show_photo'] ?? false)
                    <td width="120" valign="top">
                        <div style="width: 100px; height: 100px; border: 1px solid {{ $themeAccent }}; overflow: hidden;">
                            @if($photoDataUri)
                            <img src="{{ $photoDataUri }}" width="100" height="100" alt="Photo" style="object-fit: cover;">
                            @endif
                        </div>
                        <div style="font-size: 7pt; color: #888; text-align: center; margin-top: 4px; width: 100px;">Photo</div>
                    </td>
                    @endif
                    <td></td>
                    @if($settings['show_thumbmark'] ?? false)
                    <td width="100" valign="top" align="right">
                        <div style="width: 80px; height: 80px; border: 1px solid {{ $themeAccent }};"></div>
                        <div style="font-size: 7pt; color: #888; text-align: right; margin-top: 4px; width: 80px;">Right Thumbmark</div>
                    </td>
                    @endif
                </tr>
            </table>
            @endif

            {{-- Signature Block (right-aligned) --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 60px;">
                <tr>
                    <td></td>
                    <td width="250" align="center">
                        @if(!empty($approvalConfig['right']))
                            <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase; color: {{ $themePrimary }}; letter-spacing: 1px;">{{ $document->approved_by_right ?? $approvalConfig['right']['label'] ?? '' }}</div>
                            <div style="height: 1px; background-color: {{ $themePrimary }}; opacity: 0.5; margin: 6px 0;"></div>
                            <div style="font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 2px;">{{ $approvalConfig['right']['position'] ?? '' }}</div>
                        @else
                            <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase; color: {{ $themePrimary }}; letter-spacing: 1px;">{{ $document->approved_by_right ?? 'PUNONG BARANGAY' }}</div>
                            <div style="height: 1px; background-color: {{ $themePrimary }}; opacity: 0.5; margin: 6px 0;"></div>
                            <div style="font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 2px;">Punong Barangay</div>
                        @endif
                    </td>
                </tr>
            </table>

        </td>
    </tr>
</table>

{{-- ═══════════════════════════════════════════════════════
     ROW 3: FULL-WIDTH FOOTER
     ═══════════════════════════════════════════════════════ --}}
<table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid {{ $themePrimary }}33; background-color: {{ $themeTint }}; position: absolute; bottom: 0; left: 0; right: 0;">
    <tr>
        @php
            $isClearance = str_contains(strtolower($template->title ?? $template->name), 'clearance');
            $showTambo = $settings['show_tambo_resident'] ?? $isClearance;
            $showVillage = $settings['show_village_condo'] ?? $isClearance;
        @endphp
        @if($showTambo || $showVillage)
            <td style="padding: 8px 15mm; font-size: 7.5pt; color: #555; white-space: nowrap;">
                @if(isset($resident))
                    @php $isVillageCondo = $resident->is_village_condo; @endphp
                    @if($isVillageCondo && $showVillage)
                        <span style="font-family: DejaVu Sans; font-size: 8.5pt; color: {{ $themePrimary }}; vertical-align: middle;">&#9745;</span> <span style="vertical-align: middle;">Village/Condo Resident</span>
                    @elseif(!$isVillageCondo && $showTambo)
                        <span style="font-family: DejaVu Sans; font-size: 8.5pt; color: {{ $themePrimary }}; vertical-align: middle;">&#9745;</span> <span style="vertical-align: middle;">Official Tambo Resident</span>
                    @endif
                @endif
            </td>
        @else
            <td style="padding: 8px 15mm; font-size: 7pt; color: #888; text-transform: uppercase; letter-spacing: 1px;">{{ $document->document_number ?? '' }}</td>
        @endif
        <td align="right" style="padding: 8px 15mm;">
            @if($isClearance)
                @php
                    $daysToWordsMap = [
                        30 => 'thirty (30)',
                        60 => 'sixty (60)',
                        90 => 'ninety (90)',
                        120 => 'one hundred twenty (120)',
                        150 => 'one hundred fifty (150)',
                        180 => 'one hundred eighty (180)',
                        360 => 'three hundred sixty (360)',
                    ];
                    $expiryMonths = $settings['expiry_months'] ?? 3;
                    $expiryDays = $expiryMonths * 30;
                    $validityDaysText = $daysToWordsMap[$expiryDays] ?? "$expiryDays";
                @endphp
                <span style="font-size: 7.5pt; color: {{ $themeAccent }}; font-style: italic; font-weight: bold; line-height: 1.3;">
                    Note: This clearance is valid only for {{ $validityDaysText }} days from the date of issue. Not valid without the official seal.
                </span>
            @else
                <span style="font-size: 8pt; color: #888; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">NOT VALID WITHOUT SEAL</span>
            @endif
        </td>
    </tr>
</table>

</body>
</html>
