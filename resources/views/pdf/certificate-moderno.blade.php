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
            margin: 40px 40px 180px 40px; /* Instead of absolute positioning, just use margins on body/container to leave space for the fixed header/footer */
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
            width: 80px; height: 80px;
            margin: 0 5px;
            vertical-align: middle;
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
            padding: 0 30px;
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
            text-align: center;
            margin-top: 60px;
            margin-bottom: 30px;
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
        <img src="data:image/svg+xml;base64,{{ base64_encode($topSvg) }}" style="position: fixed; top: 0; left: 0; width: 100%; height: 35px; z-index: -1;">
        <img src="data:image/svg+xml;base64,{{ base64_encode($bottomSvg) }}" style="position: fixed; bottom: 0; left: 0; width: 100%; height: 35px; z-index: -1;">
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
            @if(isset($municipalityLogoUrl) && $municipalityLogoUrl)
                <img src="{{ $municipalityLogoUrl }}" alt="LGU Logo">
            @endif
            @if($sealDataUri)
                <img src="{{ $sealDataUri }}" alt="Seal">
            @endif
        </div>
        <div class="republic-text">Republic of the Philippines</div>
        <div class="province-text">{{ $barangay->province ?? 'Metro Manila' }} - {{ $barangay->city_municipality ?? 'City' }}</div>
        <div class="barangay-name">{{ $barangay->name ?? 'BARANGAY' }}</div>
        <div class="header-line"></div>
    </div>

    {{-- ── MAIN CONTENT ── --}}
    <div class="main-content">

        {{-- Title --}}
        <div class="title-section">
            <div class="title-text">{{ $template->title ?? $template->name }}</div>
            <div class="title-underline"></div>
        </div>

        {{-- Salutation --}}
        @if($renderedSalutation)
        <div class="salutation">{{ $renderedSalutation }}</div>
        @endif

        {{-- Body --}}
        <div class="body-text">
            {!! nl2br(e($renderedContent)) !!}
        </div>

        @php
            $pbName = '';
            foreach($officials as $off) {
                if (strtolower($off->position) === 'punong barangay') {
                    $pbName = $off->name;
                    break;
                }
            }
            $defaultSigName = $pbName ? 'HON. ' . strtoupper($pbName) : 'HON. ____________________';
            
            $rightSigName = $defaultSigName;
            $rightSigPos = 'Punong Barangay';

            if (!empty($approvalConfig['right'])) {
                $configPos = $approvalConfig['right']['position'] ?? '';
                $configLabel = $approvalConfig['right']['label'] ?? '';

                if (strtolower($configPos) !== 'punong barangay' && strtolower($configLabel) !== 'punong barangay') {
                    $rightSigName = $document->approved_by_right ?? $configLabel;
                    $rightSigPos = $configPos;
                }
            }
        @endphp

        {{-- Signatures (Centered) --}}
        <div class="signature-block">
            <div class="signature-name">{{ $rightSigName }}</div>
            <div class="signature-line"></div>
            <div class="signature-title">{{ $rightSigPos }}</div>
        </div>

    </div>

    {{-- ── OFFICIALS GRID & FOOTER (Bottom) ── --}}
    <div class="officials-section">
        <table class="officials-table" cellpadding="0" cellspacing="0">
            <tr>
                <td class="officials-left">
                    <div class="officials-title">SANGGUNIANG BARANGAY</div>
                    <table class="officials-grid" cellpadding="0" cellspacing="0">
                        @php
                            $chunks = $officials->chunk(3);
                        @endphp
                        @foreach($chunks as $row)
                        <tr>
                            @foreach($row as $official)
                            <td class="official-cell" width="33.3%">
                                <div class="official-name">HON. {{ strtoupper($official->name) }}</div>
                                <div class="official-pos">{{ $official->position }}</div>
                            </td>
                            @endforeach
                            {{-- Fill empty cells --}}
                            @for($i = $row->count(); $i < 3; $i++)
                            <td width="33.3%"></td>
                            @endfor
                        </tr>
                        @endforeach
                    </table>
                </td>
                <td class="footer-qr">
                    <table style="width: 100%;" cellpadding="0" cellspacing="0">
                        <tr>
                            <td align="right" valign="middle" style="padding-right: 10px;">
                                @if($qrDataUri)
                                <img src="{{ $qrDataUri }}" width="45" height="45" style="border: 2px solid {{ $themePrimary }}; padding: 2px; display: inline-block;">
                                @endif
                            </td>
                            <td align="left" valign="middle">
                                <div style="font-size: 8pt; font-weight: bold; color: {{ $themePrimary }}; letter-spacing: 1px;">CONTROL NO.</div>
                                <div style="font-size: 7.5pt; color: #555;">{{ $document->document_number }}</div>
                                <div style="font-size: 6.5pt; color: #888; margin-top: 2px;">Issued: {{ $document->issued_date?->format('M d, Y') ?? '—' }}</div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

</div>

</body>
</html>
