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
            padding: 8px;
        }

        .inner-container {
            border: 2px dashed {{ $themeAccent }};
            background-color: #ffffff;
            height: 100%;
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
            opacity: 0.05;
            z-index: -1000;
        }

        /* ── Header ── */
        .header-table {
            width: 100%;
            border-bottom: 2px double {{ $themePrimary }};
            padding: 15px 20px;
        }

        /* ── Main Content ── */
        .main-content {
            padding: 30px 50px;
        }

        /* ── Title ── */
        .title-table {
            width: 100%;
            margin-bottom: 20px;
        }
        .title-text {
            font-size: 18pt;
            font-weight: bold;
            color: {{ $themePrimary }};
            text-transform: uppercase;
            letter-spacing: 3px;
            text-align: center;
            padding: 0 15px;
        }
        .title-line {
            height: 1px;
            background-color: {{ $themePrimary }};
            width: auto;
        }

        .salutation {
            text-align: center;
            font-size: 11pt;
            font-weight: bold;
            color: {{ $themePrimary }};
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 25px;
        }

        .body-text {
            text-align: justify;
            line-height: 1.8;
            margin-bottom: 40px;
        }

        /* ── Signatures ── */
        .signature-block {
            text-align: center;
            margin-top: 50px;
            margin-bottom: 30px;
        }

        /* ── Officials Grid (Bottom) ── */
        .officials-section {
            position: absolute;
            bottom: 70px; /* Leave room for footer */
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
            padding: 2px;
            vertical-align: top;
        }
        .official-name {
            font-size: 8pt;
            font-weight: bold;
            color: #333;
            white-space: nowrap;
            overflow: hidden;
        }
        .official-pos {
            font-size: 7pt;
            color: #666;
            font-style: italic;
        }

        /* ── Footer ── */
        .footer-section {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 70px;
            border-top: 1px solid {{ $themePrimary }}55;
            padding: 15px 20px;
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
        <table class="header-table" cellpadding="0" cellspacing="0">
            <tr>
                @if(isset($municipalityLogoUrl) && $municipalityLogoUrl)
                <td width="90" align="left" valign="middle">
                    <img src="{{ $municipalityLogoUrl }}" width="70" height="70" alt="LGU Logo">
                </td>
                @else
                <td width="90" align="left" valign="middle">
                    @if($sealDataUri)
                    <img src="{{ $sealDataUri }}" width="70" height="70" alt="Seal">
                    @endif
                </td>
                @endif

                <td align="center" valign="middle">
                    <div style="font-size: 8pt; color: #666; letter-spacing: 2px; text-transform: uppercase;">REPUBLIC OF THE PHILIPPINES</div>
                    <div style="font-size: 9pt; color: #333; margin-top: 3px;">Province of <strong>{{ $barangay->province ?? 'Metro Manila' }}</strong></div>
                    <div style="font-size: 10pt; color: #1a1a1a; font-weight: bold; margin-top: 2px;">{{ $barangay->city_municipality ?? 'City' }}</div>
                    <div style="font-size: 16pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">{{ $barangay->name ?? 'BARANGAY' }}</div>
                </td>

                <td width="90" align="right" valign="middle">
                    @if($sealDataUri)
                    <img src="{{ $sealDataUri }}" width="70" height="70" alt="Seal">
                    @endif
                </td>
            </tr>
        </table>

        {{-- ── MAIN CONTENT ── --}}
        <div class="main-content">

            {{-- Title with Side Lines --}}
            <table class="title-table" cellpadding="0" cellspacing="0">
                <tr>
                    <td class="title-line" width="20%"></td>
                    <td class="title-text">{{ $template->title ?? $template->name }}</td>
                    <td class="title-line" width="20%"></td>
                </tr>
            </table>

            {{-- Control No --}}
            @if($settings['show_doc_no'] ?? false)
            <div style="text-align: center; font-size: 8pt; color: {{ $themeAccent }}; margin-bottom: 25px;">Control No.: {{ $document->document_number }}</div>
            @endif

            {{-- Salutation --}}
            @if($renderedSalutation)
            <div class="salutation">{{ $renderedSalutation }}</div>
            @endif

            {{-- Body --}}
            <div class="body-text">
                {!! nl2br(e($renderedContent)) !!}
            </div>

            {{-- Requested By / Purpose --}}
            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 30px auto; font-size: 10pt;">
                <tr>
                    <td style="font-weight: bold; color: {{ $themePrimary }}; padding-right: 15px; padding-bottom: 8px;">Requested By:</td>
                    <td style="text-transform: uppercase; color: #222; padding-bottom: 8px;">{{ $document->constituent_name }}</td>
                </tr>
                @if($document->purpose)
                <tr>
                    <td style="font-weight: bold; color: {{ $themePrimary }}; padding-right: 15px; padding-bottom: 8px;">Purpose:</td>
                    <td style="text-transform: uppercase; color: #222; padding-bottom: 8px;">{{ strtoupper($document->purpose) }}</td>
                </tr>
                @endif
            </table>

            {{-- Signatures (Centered) --}}
            <div class="signature-block">
                @if(!empty($approvalConfig['right']))
                    <div style="font-size: 12pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase;">{{ $document->approved_by_right ?? $approvalConfig['right']['label'] ?? '' }}</div>
                    <div style="height: 1px; background-color: {{ $themePrimary }}; opacity: 0.6; width: 250px; margin: 4px auto;"></div>
                    <div style="font-size: 9pt; color: #555; text-transform: uppercase; letter-spacing: 1px;">{{ $approvalConfig['right']['position'] ?? '' }}</div>
                @else
                    <div style="font-size: 12pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase;">{{ $document->approved_by_right ?? 'PUNONG BARANGAY' }}</div>
                    <div style="height: 1px; background-color: {{ $themePrimary }}; opacity: 0.6; width: 250px; margin: 4px auto;"></div>
                    <div style="font-size: 9pt; color: #555; text-transform: uppercase; letter-spacing: 1px;">Punong Barangay</div>
                @endif
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
