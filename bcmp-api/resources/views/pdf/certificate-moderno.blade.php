<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $template->title ?? 'Certificate' }} — {{ $document->constituent_name }}</title>
    <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: {!! $fontFamily !!};
            font-size: 11pt;
            color: #1a1a1a;
            line-height: 1.6;
            background-color: #ffffff;
        }


        .page-container {
            position: relative;
            min-height: 90vh;
            margin: 40px 40px 40px 40px;
            padding-bottom: 120px;
        }

        /* ── Watermark ── */
        .watermark {
            position: fixed;
            top: 30%;
            left: 50%;
            width: 450px;
            height: 450px;
            margin-left: -225px; /* Center horizontally */
            opacity: 0.08;
            z-index: -1000;
        }

        /* ── Header ── */
        .header-wrapper {
            padding-top: 15px;
            text-align: center;
            margin-bottom: 30px;
        }
        .header-logos {
            margin-bottom: 10px;
        }
        .header-logos img {
            width: 120px; height: 120px;
            margin: 0 8px;
            vertical-align: middle;
            border-radius: 50%;
        }

        .republic-text {
            font-size: 9pt;
            color: #666;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        .province-text {
            font-size: 10pt;
            color: #444;
            margin-top: 2px;
        }

        .barangay-name {
            font-size: 16pt;
            font-weight: bold;
            color: {{ $themePrimary }};
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 5px;
        }

        .header-line {
            width: 80px;
            height: 1px;
            background-color: {{ $themePrimary }};
            margin: 10px auto 0 auto;
        }

        /* ── Main Content ── */
        .main-content {
            padding: 0 15px;
        }

        .title-section {
            text-align: center;
            margin-bottom: 25px;
        }

        .title-text {
            font-size: 18pt;
            font-weight: bold;
            color: {{ $themePrimary }};
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        .title-underline {
            width: 60px;
            height: 2px;
            background-color: {{ $themeAccent }};
            margin: 8px auto 15px auto;
        }

        .salutation {
            font-weight: bold;
            color: {{ $themePrimary }};
            font-size: 11pt;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .body-text {
            text-align: justify;
            margin-bottom: 40px;
        }
        .body-text p {
            margin-bottom: 15px;
        }

        .signature-block {
            position: absolute;
            bottom: 60px;
            left: 0;
            right: 0;
            text-align: center;
        }
        .signature-name {
            font-size: 12pt;
            font-weight: bold;
            color: {{ $themePrimary }};
            text-transform: uppercase;
        }
        .signature-line {
            width: 250px;
            height: 1px;
            background-color: {{ $themePrimary }};
            margin: 4px auto;
        }
        .signature-title {
            font-size: 9pt;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* ── Officials Grid (Bottom) ── */
        .officials-section {
            position: fixed;
            bottom: 40px; /* Starts EXACTLY above the 40px bottom pattern */
            left: 40px;
            right: 40px;
            height: 130px; /* Fixed height so it stays bounded */
            border-top: 1px solid {{ $themePrimary }}33;
            padding-top: 10px;
            background-color: #ffffff;
        }

        .officials-table {
            width: 100%;
        }

        .officials-left {
            width: 75%;
            vertical-align: top;
        }

        .officials-title {
            font-size: 8pt;
            font-weight: bold;
            color: {{ $themePrimary }};
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }

        .officials-grid {
            width: 100%;
            table-layout: fixed;
        }
        .official-cell {
            padding: 0 10px 10px 0;
            vertical-align: top;
        }
        .official-name {
            font-size: 7pt;
            font-weight: bold;
            color: #333;
            line-height: 1.1;
        }
        .official-pos {
            font-size: 6pt;
            color: #666;
            line-height: 1.1;
        }

        .footer-qr {
            width: 25%;
            vertical-align: bottom;
            text-align: right;
        }
    </style>
</head>
<body>

<!-- ── Dynamic Design Patterns (DomPDF Safe) ── -->
@php
    $hexToRgba = function($hex, $opacity) {
        $hex = ltrim($hex, '#');
        if (strlen($hex) == 3) {
            $hex = $hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2];
        }
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
        return "rgba($r, $g, $b, $opacity)";
    };
@endphp

@switch($designPattern)
    @case('wave')
        @php
            $topSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 20" preserveAspectRatio="none"><path d="M0,6 Q50,18 100,8 T200,10 L200,0 L0,0 Z" fill="'.$themePrimary.'" fill-opacity="0.3"/></svg>';
            $bottomSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 20" preserveAspectRatio="none"><path d="M0,20 Q50,2 100,12 T200,10 L200,20 L0,20 Z" fill="'.$themeAccent.'" fill-opacity="0.2"/></svg>';
        @endphp
        <img src="data:image/svg+xml;base64,{{ base64_encode($topSvg) }}" style="position: fixed; top: 0; left: 0; width: 100%; height: 120px; z-index: -1;">
        <img src="data:image/svg+xml;base64,{{ base64_encode($bottomSvg) }}" style="position: fixed; bottom: 0; left: 0; width: 100%; height: 120px; z-index: -1;">
        @break

    @case('minimal')
        <div style="position: fixed; top: 30px; left: 30px; right: 30px; height: 1px; background-color: {{ $hexToRgba($themeAccent, 0.7) }}; z-index: -1;"></div>
        @break

    @case('gradient')
        @php
            // php-svg-lib fails on <linearGradient> and renders it solid black!
            // We simulate a gradient by drawing multiple overlapping rectangles
            $gradSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                <rect x="0%" y="0%" width="100%" height="100%" fill="'.$themePrimary.'" fill-opacity="0.25"/>
                <rect x="20%" y="0%" width="80%" height="100%" fill="'.$themeAccent.'" fill-opacity="0.05"/>
                <rect x="40%" y="0%" width="60%" height="100%" fill="'.$themeAccent.'" fill-opacity="0.05"/>
                <rect x="60%" y="0%" width="40%" height="100%" fill="'.$themeAccent.'" fill-opacity="0.05"/>
                <rect x="80%" y="0%" width="20%" height="100%" fill="'.$themeAccent.'" fill-opacity="0.05"/>
            </svg>';
            // Minify it to prevent whitespace issues in base64
            $gradSvg = str_replace(["\n", "\r", "  "], "", $gradSvg);
        @endphp
        <img src="data:image/svg+xml;base64,{{ base64_encode($gradSvg) }}" style="position: fixed; top: 0; left: 0; width: 100%; height: 40px; z-index: -1;">
        @break

    @case('bold')
    @case('bold-stripe')
        <div style="position: fixed; top: 0; left: 0; right: 0; height: 40px; background-color: {{ $hexToRgba($themePrimary, 0.25) }}; z-index: -1;"></div>
        @break

    @case('geometric')
        @php
            $geo1 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,0 100,50 50,100 0,50" fill="'.$themePrimary.'" fill-opacity="0.15"/></svg>';
            $geo2 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,0 100,50 50,100 0,50" fill="'.$themeAccent.'" fill-opacity="0.15"/></svg>';
        @endphp
        <img src="data:image/svg+xml;base64,{{ base64_encode($geo1) }}" style="position: fixed; top: -30px; left: -30px; width: 120px; height: 120px; z-index: -1;">
        <img src="data:image/svg+xml;base64,{{ base64_encode($geo2) }}" style="position: fixed; bottom: -30px; right: -30px; width: 120px; height: 120px; z-index: -1;">
        @break

    @case('tech')
        <div style="position: fixed; top: 20px; left: 20px; right: 20px; border-top: 2px dashed {{ $hexToRgba($themePrimary, 0.4) }}; z-index: -1;"></div>
        <div style="position: fixed; bottom: 20px; left: 20px; right: 20px; border-bottom: 2px dashed {{ $hexToRgba($themePrimary, 0.4) }}; z-index: -1;"></div>
        @break

    @default
        <!-- Fallback if none provided -->
@endswitch

<div class="page-container">

    @if($sealDataUri)
    <img src="{{ $sealDataUri }}" class="watermark" alt="Watermark">
    @endif

    {{-- ── HEADER ── --}}
    <div class="header-wrapper">
        <div class="header-logos">
            @if($sealDataUri)
                <img src="{{ $sealDataUri }}" alt="Seal">
            @endif
            @if(isset($nationalLogoUrl) && $nationalLogoUrl)
                <img src="{{ $nationalLogoUrl }}" alt="National Logo">
            @endif
            @if(isset($municipalityLogoUrl) && $municipalityLogoUrl)
                <img src="{{ $municipalityLogoUrl }}" alt="LGU Logo">
            @endif
        </div>
        <div class="republic-text" style="font-size: 8pt; color: #666; letter-spacing: 2px; text-transform: uppercase;">Republic of the Philippines</div>
        <div class="province-text" style="font-size: 11pt; font-weight: bold; color: #111; text-transform: uppercase; margin-top: 3px;">
            @if(str_starts_with(strtoupper($barangay->city_municipality), 'CITY') || str_starts_with(strtoupper($barangay->city_municipality), 'MUNICIPALITY'))
                {{ strtoupper($barangay->city_municipality) }}
            @else
                CITY OF {{ strtoupper($barangay->city_municipality) }}
            @endif
        </div>
        <div class="republic-text" style="font-size: 8pt; color: #666; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px;">{{ $barangay->province ?? 'METRO MANILA' }}</div>
        <div class="barangay-name" style="font-size: 13pt; font-weight: 500; color: #111; text-transform: none; letter-spacing: normal; margin-top: 6px;">
            Office of {{ preg_replace('/^(brgy\.?\s*|barangay\s*)/i', '', $barangay->name) }} Barangay Council
        </div>
        <div class="header-line"></div>
    </div>

    {{-- ── MAIN CONTENT ── --}}
    <div class="main-content">

        {{-- Title --}}
        <div class="title-section">
            <div class="title-text">{{ $template->title ?? $template->name }}</div>
            <div class="title-underline"></div>
        </div>



        {{-- Body --}}
        <div class="body-text">
            {!! nl2br(e($renderedContent)) !!}
        </div>

        @if(isset($resident))
        <div style="margin: 15px auto; max-width: 90%;">
            <table width="100%" style="border-collapse: collapse; font-size: 8.5pt; font-family: sans-serif; border: 1px solid #ddd; line-height: 1.4;">
                <tr>
                    <td width="35%" style="padding: 4px 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; color: {{ $themePrimary ?? '#111' }};">Resident Name:</td>
                    <td width="65%" style="padding: 4px 8px; border: 1px solid #ddd; font-weight: bold; color: #111;">{{ $resident->full_name }}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; color: {{ $themePrimary ?? '#111' }};">Resident Alias/es:</td>
                    <td style="padding: 4px 8px; border: 1px solid #ddd;">{{ $resident->alias ?? 'None' }}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; color: {{ $themePrimary ?? '#111' }};">Birthdate:</td>
                    <td style="padding: 4px 8px; border: 1px solid #ddd;">{{ $resident->date_of_birth?->format('F d, Y') ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; color: {{ $themePrimary ?? '#111' }};">Age:</td>
                    <td style="padding: 4px 8px; border: 1px solid #ddd;">{{ $resident->date_of_birth?->age ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; color: {{ $themePrimary ?? '#111' }};">Birthplace:</td>
                    <td style="padding: 4px 8px; border: 1px solid #ddd;">{{ $resident->place_of_birth ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; color: {{ $themePrimary ?? '#111' }};">Civil Status:</td>
                    <td style="padding: 4px 8px; border: 1px solid #ddd;">{{ ucfirst(str_replace('_', '-', $resident->civil_status?->value ?? '')) }}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; color: {{ $themePrimary ?? '#111' }};">Gender:</td>
                    <td style="padding: 4px 8px; border: 1px solid #ddd;">{{ ucfirst($resident->sex ?? '') }}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; color: {{ $themePrimary ?? '#111' }};">Citizenship:</td>
                    <td style="padding: 4px 8px; border: 1px solid #ddd;">{{ $resident->citizenship ?? 'Filipino' }}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; color: {{ $themePrimary ?? '#111' }};">Address:</td>
                    <td style="padding: 4px 8px; border: 1px solid #ddd;">{{ $values['address'] ?? '' }}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; color: {{ $themePrimary ?? '#111' }};">Remarks:</td>
                    <td style="padding: 4px 8px; border: 1px solid #ddd;">{{ $resident->other_remarks ?? 'None' }}</td>
                </tr>
            </table>
        </div>
        @endif

        @php
            $pbName = '';
            foreach($officials as $off) {
                if (strtolower($off->position) === 'punong barangay') {
                    $pbName = 'HON. ' . strtoupper($off->name);
                    break;
                }
            }
            $fallbackSigName = $barangay->settings['default_signatory_name'] ?? 'HON. ____________________';
            $defaultSigName = $pbName ?: strtoupper($fallbackSigName);
            
            $rightSigName = $document->approved_by_right ?? $defaultSigName;
            $rightSigPos = $barangay->settings['default_signatory_title'] ?? 'Punong Barangay';

            if (!empty($approvalConfig['right'])) {
                $configPos = $approvalConfig['right']['position'] ?? '';
                $configLabel = $approvalConfig['right']['label'] ?? '';

                if (strtolower($configPos) !== 'punong barangay' && strtolower($configLabel) !== 'punong barangay') {
                    $rightSigName = $document->approved_by_right ?? $configLabel;
                    $rightSigPos = $configPos;
                }
            }
        @endphp

        {{-- ── FOOTER SECTION (Metadata & Signature) ── --}}
        <div class="footer-section" style="position: absolute; bottom: 40px; left: 0; right: 0; padding: 0 15px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <!-- Bottom Left: Metadata Block -->
                    <td width="50%" valign="bottom" style="text-align: left; font-size: 9pt; line-height: 1.6; color: #444;">
                        @php
                            $isClearance = str_contains(strtolower($template->title ?? $template->name), 'clearance');
                        @endphp
                        <div>
                            <strong style="color: {{ $themePrimary }}; font-family: sans-serif;">{{ $isClearance ? 'Series No:' : 'CTC No:' }}</strong> 
                            <span style="font-family: monospace; color: #111;">{{ !empty($document->ctc_number) ? $document->ctc_number : $document->document_number }}</span>
                        </div>
                        @if($document->or_number)
                        <div>
                            <strong style="color: {{ $themePrimary }}; font-family: sans-serif;">Or No:</strong> 
                            <span style="font-family: monospace; color: #111;">
                                {{ $document->or_number }}
                                @if($document->or_amount !== null)
                                - <span style="font-family: DejaVu Sans;">&#8369;</span>{{ number_format((float)$document->or_amount, 2) }}
                                @endif
                            </span>
                        </div>
                        @endif
                        @php
                            $isClearance = str_contains(strtolower($template->title ?? $template->name), 'clearance');
                            $showTambo = $settings['show_tambo_resident'] ?? false;
                            $showVillage = $settings['show_village_condo'] ?? false;
                        @endphp
                        @if(($showTambo || $showVillage) && isset($resident))
                        <div style="margin-top: 4px; font-size: 8.5pt; font-family: sans-serif; line-height: 1.4; color: #333;">
                            @if($showTambo)
                                <span style="font-family: DejaVu Sans; font-size: 9.5pt; color: {{ $themePrimary }};">{!! $resident->is_village_condo ? '&#9744;' : '&#9745;' !!}</span> Official Tambo Resident &nbsp;&nbsp;
                            @endif
                            @if($showVillage)
                                <span style="font-family: DejaVu Sans; font-size: 9.5pt; color: {{ $themePrimary }};">{!! $resident->is_village_condo ? '&#9745;' : '&#9744;' !!}</span> Village/Condo Resident
                            @endif
                        </div>
                        @endif
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
                            <div style="font-style: italic; color: {{ $themeAccent }}; margin-top: 4px; font-weight: bold; font-family: sans-serif; font-size: 7.5pt; line-height: 1.3;">
                                Note: This clearance is valid only for {{ $validityDaysText }} days from the date of issue. Not valid without the official seal.
                            </div>
                        @else
                            <div style="font-style: italic; color: {{ $themeAccent }}; margin-top: 4px; font-weight: bold; font-family: sans-serif;">
                                Not Valid Without Official Seal
                            </div>
                        @endif
                    </td>
                    
                    <!-- Bottom Right: Signature -->
                    <td width="50%" valign="bottom" align="right" style="text-align: right;">
                        <div style="width: 280px; display: inline-block; text-align: center;">
                            <div class="signature-name" style="font-size: 12pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase; white-space: nowrap;">
                                {{ $rightSigName }}
                            </div>
                            <div class="signature-line" style="width: 100%; height: 1px; background-color: {{ $themePrimary }}; margin: 4px auto;"></div>
                            <div class="signature-title" style="font-size: 9pt; color: #555; text-transform: uppercase; letter-spacing: 1px;">
                                {{ $rightSigPos }}
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

    </div>



</div>

</body>
</html>
