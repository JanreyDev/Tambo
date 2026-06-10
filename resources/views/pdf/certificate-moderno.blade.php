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

        /* ── Design Pattern Header/Footer ── */
        .pattern-top {
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 40px;
            background-color: {{ $themePrimary }}22;
        }
        .pattern-bottom {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            height: 40px;
            background-color: {{ $themePrimary }}22;
        }

        /* ── Container ── */
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

<!-- Very simple background design patterns for "Moderno" -->
<div class="pattern-top"></div>
<div class="pattern-bottom"></div>

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
