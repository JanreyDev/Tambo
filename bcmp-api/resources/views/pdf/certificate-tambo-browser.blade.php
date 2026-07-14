<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    @php
        $paperSetting = $settings['paper_size']
            ?? ($barangay->settings['document_paper_size'] ?? 'long_bond');
        $pageWmm = match ($paperSetting) {
            'a4' => 210.0,
            'short_bond', 'letter' => 215.9,
            default => 215.9,
        };
        $pageHmm = match ($paperSetting) {
            'a4' => 297.0,
            'short_bond', 'letter' => 279.4,
            default => 330.2,
        };

        $mv = $mergeValues ?? [];
        $val = fn (string $k, string $fallback = '') => e($mv[$k] ?? $fallback);
        $docNo = e($document->document_number ?? '');
        $issuedDate = e($document->issued_date?->format('F d, Y') ?? ($issuedAt ?? now()->format('F d, Y')));
        $expiryDays = (int) (($settings['expiry_months'] ?? 3) * 30);
        if ($expiryDays < 1) { $expiryDays = 90; }
        $captainName = collect($officials ?? [])->first(fn ($o) => stripos($o->position ?? '', 'punong') !== false || stripos($o->position ?? '', 'captain') !== false)?->name
            ?? $document->approved_by_right
            ?? ($barangay->settings['default_signatory_name'] ?? null)
            ?? ($barangay->captain_name ?? '');
        $captainName = preg_replace('/^HON\.\s+/i', '', (string) $captainName);
        $clerkName = e($document->approved_by_left ?? '');
        $orNo = e($document->or_number ?? '');
        $orAmount = $document->or_amount !== null ? e(number_format((float) $document->or_amount, 2, '.', '')) : '';
        $purpose = $val('purpose');
        $footerContact = $barangay->settings['document_footer_text']
            ?? 'Seaside Coastal : (0977) 7232933 / (0960) 2547401';
        $barangayLogo = $logoDataUri ?? $sealDataUri ?? null;
        $muni = $barangay->city_municipality ?? '';
        if (preg_match('/^city of /i', $muni) || preg_match('/^municipality of /i', $muni)) {
            $cityLine = strtoupper($muni);
        } elseif (preg_match('/\s+city$/i', $muni)) {
            $cityLine = 'CITY OF '.strtoupper(preg_replace('/\s+city$/i', '', $muni));
        } else {
            $cityLine = 'CITY OF '.strtoupper($muni);
        }
        $officeName = 'Office of '.preg_replace('/^(brgy\.?\s*|barangay\s*)/i', '', $barangay->name).' Barangay Council';
        $docTitle = strtoupper(preg_replace('/\s+/', ' ', trim($template->title ?? $template->name ?? 'CLEARANCE')));
        $primary = $themePrimary ?? '#111';
    @endphp
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
            width: {{ $pageWmm }}mm;
            height: {{ $pageHmm }}mm;
            overflow: hidden;
            background: #fff;
            font-family: {!! $fontFamily !!};
            color: #111;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .page {
            width: {{ $pageWmm }}mm;
            height: {{ $pageHmm }}mm;
            padding: 14mm 16mm 12mm;
            display: flex;
            flex-direction: column;
            position: relative;
            background: #fff;
        }
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 90mm;
            height: 90mm;
            transform: translate(-50%, -50%);
            opacity: 0.07;
            object-fit: contain;
            pointer-events: none;
            z-index: 0;
        }
        .header {
            text-align: center;
            position: relative;
            z-index: 1;
            flex-shrink: 0;
        }
        .logos {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4mm;
            margin-bottom: 2mm;
        }
        .logos img {
            width: 18mm;
            height: 18mm;
            border-radius: 50%;
            object-fit: contain;
            border: 0.3mm solid {{ $primary }};
            background: #fff;
        }
        .rep { font-size: 8pt; letter-spacing: 0.22em; color: #6b7280; text-transform: uppercase; }
        .city { font-size: 12pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 1mm; }
        .prov { font-size: 8pt; letter-spacing: 0.15em; color: #6b7280; text-transform: uppercase; margin-top: 0.5mm; }
        .office { font-size: 11pt; font-weight: 500; margin-top: 2mm; }
        .hline { width: 18mm; height: 0.35mm; background: {{ $primary }}; margin: 2.5mm auto 0; }

        .meta {
            display: flex;
            justify-content: flex-end;
            margin: 3mm 0 2mm;
            position: relative;
            z-index: 1;
            flex-shrink: 0;
        }
        .meta table { border-collapse: collapse; font-size: 9.5pt; line-height: 1.45; }
        .meta td { vertical-align: bottom; padding-bottom: 0.4mm; }
        .meta .lbl { padding-right: 2mm; white-space: nowrap; text-align: left; }
        .meta .val { border-bottom: 0.3mm solid #111; min-width: 42mm; padding-left: 1mm; }

        .title {
            text-align: center;
            font-size: 16pt;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            margin: 3mm 0 5mm;
            position: relative;
            z-index: 1;
            flex-shrink: 0;
        }

        .body-wrap {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            min-height: 0;
            position: relative;
            z-index: 1;
            width: 100%;
        }
        .salutation { font-size: 10.5pt; font-weight: 700; margin-bottom: 2.5mm; flex-shrink: 0; }
        .content {
            font-size: 10.5pt;
            text-align: justify;
            line-height: 1.5;
            margin-bottom: 4mm;
            flex-shrink: 0;
            width: 100%;
        }

        .footer-row {
            margin-top: auto;
            display: grid;
            grid-template-columns: 3fr 2fr;
            column-gap: 50px;
            align-items: start;
            padding-top: 4mm;
            flex-shrink: 0;
            width: 100%;
        }
        .col-left { min-width: 0; }
        .col-right { min-width: 0; }

        .thumbs { display: flex; border: 0.15mm solid #666; }
        .thumb {
            flex: 1;
            height: 16mm;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 1mm;
            font-size: 8pt;
            color: #6b7280;
        }
        .thumb + .thumb { border-left: 0.15mm solid #666; }
        .thumb-label {
            border: 0.15mm solid #666;
            border-top: none;
            text-align: center;
            font-size: 8pt;
            letter-spacing: 0.28em;
            padding: 0.8mm 0;
            margin-bottom: 2.5mm;
        }
        .sig-line { border-bottom: 0.15mm solid #666; height: 6mm; }
        .sig-caption { text-align: center; font-size: 9pt; margin: 0.8mm 0 2.5mm; }

        .field-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 2mm; }
        .field-table td { vertical-align: bottom; padding-bottom: 0.6mm; }
        .field-table .fl { white-space: nowrap; padding-right: 2mm; width: 26mm; }
        .field-table .fv { border-bottom: 0.15mm solid #666; }

        .note { font-size: 8pt; font-style: italic; line-height: 1.35; margin: 2mm 0 2.5mm; }

        .purpose-label { font-size: 9.5pt; font-weight: 400; margin-bottom: 1mm; }
        .purpose-line {
            border-bottom: 0.15mm solid #666;
            min-height: 5mm;
            font-size: 8.5pt;
            text-transform: uppercase;
            margin-bottom: 5mm;
            padding-bottom: 0.5mm;
            font-weight: 400;
        }
        .proc-label { font-size: 9.5pt; margin-bottom: 1mm; font-weight: 400; }
        .clerk-name {
            border-bottom: 0.15mm solid #666;
            width: 90%;
            min-height: 6mm;
            font-size: 8.5pt;
            font-weight: 400;
            text-transform: uppercase;
            padding-bottom: 0.5mm;
        }
        .clerk-title { font-size: 9.5pt; font-weight: 400; margin: 0.8mm 0 5mm; }

        .approved { font-size: 9.5pt; font-weight: 400; margin-top: 1mm; }
        .captain-name {
            font-size: 10.5pt;
            font-weight: 400;
            text-transform: uppercase;
            margin-top: 5mm;
            letter-spacing: 0;
            width: 85%;
        }
        .captain-line {
            border-bottom: 0.15mm solid #666;
            width: 85%;
            margin-top: 0.8mm;
            height: 0;
        }
        .captain-title { font-size: 9.5pt; font-weight: 400; margin-top: 0.8mm; }

        .contact {
            text-align: center;
            font-size: 8.5pt;
            letter-spacing: 0.04em;
            color: #374151;
            margin-top: 5mm;
            flex-shrink: 0;
            position: relative;
            z-index: 1;
            width: 100%;
        }
    </style>
</head>
<body>
<div class="page">
    @if($sealDataUri)
        <img src="{{ $sealDataUri }}" class="watermark" alt="">
    @endif

    <div class="header">
        <div class="logos">
            @if($barangayLogo)<img src="{{ $barangayLogo }}" alt="">@endif
            @if(!empty($nationalLogoUrl))<img src="{{ $nationalLogoUrl }}" alt="">@endif
            @if(!empty($municipalityLogoUrl))<img src="{{ $municipalityLogoUrl }}" alt="">@endif
        </div>
        <div class="rep">Republic of the Philippines</div>
        <div class="city">{{ $cityLine }}</div>
        <div class="prov">{{ strtoupper($barangay->province ?? 'METRO MANILA') }}</div>
        <div class="office">{{ $officeName }}</div>
        <div class="hline"></div>
    </div>

    <div class="meta">
        <table>
            <tr>
                <td class="lbl">No.:</td>
                <td class="val">{{ $docNo }}</td>
            </tr>
            <tr>
                <td class="lbl" style="padding-top:1.2mm;">Date.:</td>
                <td class="val" style="padding-top:1.2mm;">{{ $issuedDate }}</td>
            </tr>
        </table>
    </div>

    <div class="title">{{ $docTitle }}</div>

    <div class="body-wrap">
        <div class="salutation">
            @if(!empty($renderedSalutation))
                {!! $renderedSalutation !!}
            @else
                TO WHOM IT MAY CONCERN:
            @endif
        </div>

        <div class="content">
            @if(!empty($renderedContent))
                {!! $renderedContent !!}
            @else
                This is to certify that the person whose name, signature and thumbmarks appear below has requested a clearance from this barangay and the result/s is/are stated below:
            @endif
        </div>

        <div class="footer-row">
            <div class="col-left">
                <div class="thumbs">
                    <div class="thumb">Left</div>
                    <div class="thumb">Right</div>
                </div>
                <div class="thumb-label">THUMBMARKS</div>
                <div class="sig-line"></div>
                <div class="sig-caption">Signature</div>

                <table class="field-table">
                    <tr>
                        <td class="fl">Res. Cert No.</td>
                        <td class="fv">{{ $val('ctc_number') }}</td>
                    </tr>
                    <tr><td colspan="2" style="height:1.5mm;"></td></tr>
                    <tr>
                        <td class="fl">Issued on</td>
                        <td class="fv">{{ $val('ctc_date') }}</td>
                    </tr>
                    <tr><td colspan="2" style="height:1.5mm;"></td></tr>
                    <tr>
                        <td class="fl">Issued at</td>
                        <td class="fv">{{ $val('ctc_place') }}</td>
                    </tr>
                </table>

                <div class="note">
                    Note: This clearance is good only for {{ $expiryDays }} days from the date of issue. Not valid without official seal.
                </div>

                <table class="field-table">
                    <tr>
                        <td class="fl" style="width:20mm;">OR No.</td>
                        <td class="fv">{{ $orNo }}</td>
                    </tr>
                    <tr><td colspan="2" style="height:1.5mm;"></td></tr>
                    <tr>
                        <td class="fl" style="width:20mm;">Amount P</td>
                        <td class="fv">{{ $orAmount }}</td>
                    </tr>
                </table>
            </div>

            <div class="col-right">
                <div class="purpose-label">THIS CLEARANCE IS HEREBY ISSUED FOR PURPOSES OF:</div>
                <div class="purpose-line">{{ $purpose }}</div>

                <div class="proc-label">Processed by:</div>
                <div class="clerk-name">{{ $clerkName }}</div>
                <div class="clerk-title">Clerk In-charge</div>

                <div class="approved">APPROVED BY:</div>
                <div class="captain-name">{{ e($captainName) }}</div>
                <div class="captain-line"></div>
                <div class="captain-title">Barangay Captain</div>
            </div>
        </div>

        <div class="contact">{{ e($footerContact) }}</div>
    </div>
</div>
</body>
</html>
