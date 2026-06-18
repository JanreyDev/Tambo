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
            background-color: {{ $themeTint }};
        }

        /* ── Container and Borders ── */
        .page-container {
            position: absolute;
            top: 15px; left: 15px; right: 15px; bottom: 15px;
            border: 3px solid {{ $themePrimary }};
            background-color: transparent;
        }

        .inner-container {
            margin: 8px;
            border: 2px dashed {{ $themeAccent }};
            background-color: #ffffff;
            height: 98%;
            position: relative;
        }

        /* ── Watermark ── */
        .watermark {
            position: absolute;
            top: 25%;
            left: 50%;
            width: 450px;
            height: 450px;
            margin-left: -225px; /* Center horizontally */
            opacity: 0.08;
            z-index: -1000;
        }

        /* ── Header ── */
        .header-wrapper {
            border-bottom: 1px solid {{ $themePrimary }};
            padding: 15px 20px 20px 20px;
            text-align: center;
        }

        .header-table {
            margin: 0 auto;
        }

        /* ── Main Content ── */
        .main-content {
            padding: 30px 50px;
        }

        .title-section {
            text-align: center;
            margin-bottom: 25px;
        }

        .title-text {
            font-size: 20pt;
            font-weight: bold;
            color: {{ $themePrimary }};
            letter-spacing: 3px;
            text-transform: uppercase;
        }

        .control-no {
            font-size: 8pt;
            color: #666;
            margin-top: 10px;
            background-color: #f5f5f5;
            display: inline-block;
            padding: 3px 10px;
        }

        .salutation {
            font-weight: bold;
            color: {{ $themePrimary }};
            font-size: 11pt;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: center;
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
            display: inline-block;
            padding: 0 20px 5px 20px;
            border-bottom: 2px solid {{ $themePrimary }};
            margin-bottom: 5px;
        }
        .signature-title {
            font-size: 9pt;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* ── Officials Grid (Bottom) ── */
        .officials-section {
            position: absolute;
            bottom: 80px; /* Matches footer height */
            left: 0;
            right: 0;
            border-top: 1px solid {{ $themePrimary }}33;
            background-color: {{ $themeTint }};
            padding: 15px 20px;
        }

        .officials-title {
            text-align: center;
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
            text-align: center;
            padding: 8px 6px 12px 6px;
            vertical-align: top;
        }
        .official-name {
            font-size: 7pt;
            font-weight: bold;
            color: #333;
            line-height: 1.1;
            margin-bottom: 2px;
        }
        .official-pos {
            font-size: 6pt;
            color: #666;
            font-style: italic;
            line-height: 1.1;
            margin-bottom: 5px;
        }

        /* ── Footer ── */
        .footer-section {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 80px;
            border-top: 1px solid {{ $themePrimary }}55;
            padding: 10px 20px 0 20px;
        }
        .footer-table {
            width: 100%;
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
            $gradSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" preserveAspectRatio="none">
                <rect x="0%" y="0%" width="100%" height="100%" fill="'.$themePrimary.'" fill-opacity="0.25"/>
                <rect x="20%" y="0%" width="80%" height="100%" fill="'.$themeAccent.'" fill-opacity="0.05"/>
                <rect x="40%" y="0%" width="60%" height="100%" fill="'.$themeAccent.'" fill-opacity="0.05"/>
                <rect x="60%" y="0%" width="40%" height="100%" fill="'.$themeAccent.'" fill-opacity="0.05"/>
                <rect x="80%" y="0%" width="20%" height="100%" fill="'.$themeAccent.'" fill-opacity="0.05"/>
            </svg>';
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
@endswitch

<div class="page-container">
    <div class="inner-container">

        @if($sealDataUri)
        <img src="{{ $sealDataUri }}" class="watermark" alt="Watermark">
        @endif

        {{-- ── HEADER ── --}}
        <div class="header-wrapper">
            <table class="header-table" cellpadding="0" cellspacing="0">
                <tr>
                    @if(isset($municipalityLogoUrl) && $municipalityLogoUrl)
                    <td align="right" valign="middle">
                        <img src="{{ $municipalityLogoUrl }}" width="100" height="100" alt="LGU Logo">
                    </td>
                    @else
                    <td align="right" valign="middle">
                        @if($sealDataUri)
                        <img src="{{ $sealDataUri }}" width="100" height="100" alt="Seal">
                        @endif
                    </td>
                    @endif

                    <td align="center" valign="middle" style="padding: 0 35px;">
                        <div style="font-size: 8pt; color: #666; letter-spacing: 2px; text-transform: uppercase;">REPUBLIC OF THE PHILIPPINES</div>
                        <div style="font-size: 9pt; color: #333; margin-top: 3px;">Province of <strong>{{ $barangay->province ?? 'Metro Manila' }}</strong></div>
                        <div style="font-size: 10pt; color: #1a1a1a; font-weight: bold; margin-top: 2px;">{{ $barangay->city_municipality ?? 'City' }}</div>
                        <div style="font-size: 16pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">{{ $barangay->name ?? 'BARANGAY' }}</div>
                    </td>

                    <td align="left" valign="middle">
                        @if($sealDataUri)
                        <img src="{{ $sealDataUri }}" width="100" height="100" alt="Seal">
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        {{-- ── MAIN CONTENT ── --}}
        <div class="main-content">

            {{-- Title --}}
            <table cellpadding="0" cellspacing="0" style="margin: 0 auto; margin-bottom: 25px;">
                <tr>
                    <td valign="middle"><div style="width: 70px; height: 1px; background-color: {{ $themePrimary }};"></div></td>
                    <td valign="middle" style="padding: 0 15px;">
                        <div class="title-text">{{ $template->title ?? $template->name }}</div>
                    </td>
                    <td valign="middle"><div style="width: 70px; height: 1px; background-color: {{ $themePrimary }};"></div></td>
                </tr>
            </table>

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
                        $pbName = 'HON. ' . strtoupper($off->name);
                        break;
                    }
                }
                $fallbackSigName = $barangay->settings['default_signatory_name'] ?? 'HON. ____________________';
                $defaultSigName = $pbName ?: strtoupper($fallbackSigName);
            @endphp

            {{-- Signatures (Centered) --}}
            <div class="signature-block">
                @php
                    $sigName = $document->approved_by_right ?? $defaultSigName;
                    $sigPos = $barangay->settings['default_signatory_title'] ?? 'Punong Barangay';

                    if (!empty($approvalConfig['right'])) {
                        $configPos = $approvalConfig['right']['position'] ?? '';
                        $configLabel = $approvalConfig['right']['label'] ?? '';

                        // If the template configured a custom signer that is NOT the Kapitan, use it
                        if (strtolower($configPos) !== 'punong barangay' && strtolower($configLabel) !== 'punong barangay') {
                            $sigName = $document->approved_by_right ?? $configLabel;
                            $sigPos = $configPos;
                        }
                    }
                @endphp
                <div style="font-size: 12pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase;">{{ $sigName }}</div>
                <div style="height: 1px; background-color: {{ $themePrimary }}; opacity: 0.6; width: 250px; margin: 4px auto;"></div>
                <div style="font-size: 9pt; color: #555; text-transform: uppercase; letter-spacing: 1px;">{{ $sigPos }}</div>
            </div>

        </div>

        {{-- ── OFFICIALS GRID (Bottom) ── --}}
        <div class="officials-section">
            <div class="officials-title">SANGGUNIANG BARANGAY {{ $barangay->name ?? '' }}</div>
            <table class="officials-grid" cellpadding="0" cellspacing="0">
                @php
                    $chunks = $officials->chunk(4);
                @endphp
                @foreach($chunks as $row)
                <tr>
                    @foreach($row as $official)
                    <td class="official-cell" width="25%">
                        <div class="official-name">HON. {{ strtoupper($official->name) }}</div>
                        <div class="official-pos">{{ $official->position }}</div>
                    </td>
                    @endforeach
                    {{-- Fill empty cells --}}
                    @for($i = $row->count(); $i < 4; $i++)
                    <td width="25%"></td>
                    @endfor
                </tr>
                @endforeach
            </table>
        </div>

        {{-- ── FOOTER ── --}}
        <div class="footer-section">
            <table class="footer-table" cellpadding="0" cellspacing="0">
                <tr>
                    <td width="80" valign="middle">
                        @if($qrDataUri)
                        <div style="border: 2px solid {{ $themePrimary }}; padding: 3px; display: inline-block;">
                            <img src="{{ $qrDataUri }}" width="45" height="45" style="display: block;">
                        </div>
                        @endif
                    </td>
                    <td valign="middle">
                        <div style="font-size: 8pt; font-weight: bold; color: {{ $themePrimary }}; letter-spacing: 1px; margin-bottom: 3px;">CONTROL NO.</div>
                        <div style="font-size: 7pt; color: #555;">{{ $document->document_number }}</div>
                        <div style="font-size: 6pt; color: #888; margin-top: 2px;">Issued: {{ $document->issued_date?->format('M d, Y') ?? '—' }}</div>
                    </td>
                    <td align="right" valign="bottom" style="font-size: 7pt; color: #666; text-transform: uppercase; letter-spacing: 1px; line-height: 1.5;">
                        Republic of the Philippines<br>
                        <span style="font-weight: bold; color: {{ $themePrimary }};">NOT VALID WITHOUT SEAL</span>
                    </td>
                </tr>
            </table>
        </div>

    </div>
</div>

</body>
</html>
