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
                        $pbName = $off->name;
                        break;
                    }
                }
                $defaultSigName = $pbName ? 'HON. ' . strtoupper($pbName) : 'HON. ____________________';
            @endphp

            {{-- Signatures (Centered) --}}
            <div class="signature-block">
                @php
                    $sigName = $defaultSigName;
                    $sigPos = 'Punong Barangay';

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
