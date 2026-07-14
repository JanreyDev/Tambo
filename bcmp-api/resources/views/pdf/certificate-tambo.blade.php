<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $template->title ?? 'Clearance' }} — {{ $document->constituent_name }}</title>
    <style>
        @page { margin: 24px 32px; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; }
        body {
            font-family: {!! $fontFamily !!};
            font-size: 9.5pt;
            color: #111;
            line-height: 1.35;
        }
        table { border-collapse: collapse; width: 100%; }
        .field-line { border-bottom: 0.5px solid #666; min-height: 14px; vertical-align: bottom; padding: 0 2px 1px; }
        .thumb-box { border: 0.5px solid #666; height: 48px; text-align: center; vertical-align: bottom; font-size: 7.5pt; color: #555; padding-bottom: 2px; }
        .sig-line { border-bottom: 0.5px solid #666; height: 22px; }
        .note { font-size: 7.5pt; font-style: italic; margin-top: 6px; margin-bottom: 8px; }
        .footer-text { font-size: 8pt; text-align: center; margin-top: 12px; color: #333; }
        .header-wrapper { text-align: center; margin-bottom: 8px; }
        .header-logos img { width: 58px; height: 58px; margin: 0 7px; vertical-align: middle; border-radius: 50%; border: 1px solid {{ $themePrimary }}; }
        .header-line { width: 64px; height: 1px; background-color: {{ $themePrimary }}; margin: 7px auto 0 auto; }
        .watermark { position: fixed; top: 28%; left: 50%; width: 280px; height: 280px; margin-left: -140px; opacity: 0.07; z-index: -1000; }
        .page-shell { width: 100%; height: 100%; }
        .page-top { vertical-align: top; }
        .page-bottom { vertical-align: bottom; }
    </style>
</head>
<body>
@php
    $mv = $mergeValues ?? [];
    $val = fn(string $k, string $fallback = '') => e($mv[$k] ?? $fallback);
    $docNo = $document->document_number ?? '';
    $issuedDate = $document->issued_date?->format('F d, Y') ?? $issuedAt ?? now()->format('F d, Y');
    $expiryDays = (int) (($settings['expiry_months'] ?? 3) * 30);
    if ($expiryDays < 1) { $expiryDays = 90; }
    $captainName = collect($officials ?? [])->first(fn ($o) => stripos($o->position ?? '', 'punong') !== false || stripos($o->position ?? '', 'captain') !== false)?->name
        ?? $document->approved_by_right
        ?? ($barangay->settings['default_signatory_name'] ?? null)
        ?? ($barangay->captain_name ?? '');
    $captainName = preg_replace('/^HON\.\s+/i', '', (string) $captainName);
    $clerkName = $document->approved_by_left ?? '';
    $orNo = e($document->or_number ?? '');
    $orAmount = $document->or_amount !== null ? e(number_format((float) $document->or_amount, 2, '.', '')) : '';
    $footerContact = $barangay->settings['document_footer_text']
        ?? ($barangay->settings['contact']['mobile_number'] ?? null);
    $barangayLogo = $logoDataUri ?? $sealDataUri ?? null;
    $muni = $barangay->city_municipality ?? '';
    if (preg_match('/^city of /i', $muni) || preg_match('/^municipality of /i', $muni)) {
        $cityLine = strtoupper($muni);
    } elseif (preg_match('/\s+city$/i', $muni)) {
        $cityLine = 'CITY OF '.strtoupper(preg_replace('/\s+city$/i', '', $muni));
    } elseif (preg_match('/\s+municipality$/i', $muni)) {
        $cityLine = strtoupper($muni);
    } else {
        $cityLine = 'CITY OF '.strtoupper($muni);
    }
    $officeName = 'Office of '.preg_replace('/^(brgy\.?\s*|barangay\s*)/i', '', $barangay->name).' Barangay Council';
    $docTitle = strtoupper(preg_replace('/\s+/', ' ', trim($template->title ?? $template->name ?? 'CLEARANCE')));
@endphp

@if($sealDataUri)
    <img src="{{ $sealDataUri }}" class="watermark" alt="Watermark">
@endif

<table class="page-shell">
<tr>
<td class="page-top">
    <div class="header-wrapper">
        <div class="header-logos">
            @if($barangayLogo)
                <img src="{{ $barangayLogo }}" alt="Barangay">
            @endif
            @if(!empty($nationalLogoUrl))
                <img src="{{ $nationalLogoUrl }}" alt="National Logo">
            @endif
            @if(!empty($municipalityLogoUrl))
                <img src="{{ $municipalityLogoUrl }}" alt="LGU Logo">
            @endif
        </div>
        <div style="font-size: 7.5pt; color: #666; letter-spacing: 2px; text-transform: uppercase;">Republic of the Philippines</div>
        <div style="font-size: 10.5pt; font-weight: bold; color: #111; text-transform: uppercase; margin-top: 2px;">{{ $cityLine }}</div>
        <div style="font-size: 7.5pt; color: #666; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px;">{{ strtoupper($barangay->province ?? 'METRO MANILA') }}</div>
        <div style="font-size: 10.5pt; font-weight: 500; color: #111; margin-top: 5px;">{{ $officeName }}</div>
        <div class="header-line"></div>
    </div>

    <table style="margin: 2px 0 6px 0; margin-left: auto; width: 38%;">
        <tr>
            <td style="width: 42px; text-align: left; white-space: nowrap; padding-right: 6px; vertical-align: bottom; font-size: 8.5pt;">No.:</td>
            <td style="border-bottom: 1px solid #111; vertical-align: bottom; font-size: 8.5pt; padding-bottom: 1px;">{{ e($docNo) }}</td>
        </tr>
        <tr>
            <td style="width: 42px; text-align: left; white-space: nowrap; padding-right: 6px; vertical-align: bottom; font-size: 8.5pt; padding-top: 3px;">Date.:</td>
            <td style="border-bottom: 1px solid #111; vertical-align: bottom; font-size: 8.5pt; padding-bottom: 1px; padding-top: 3px;">{{ e($issuedDate) }}</td>
        </tr>
    </table>

    <div style="text-align: center; margin: 8px 0 12px;">
        <div style="font-size: 16pt; font-weight: bold; color: #111; letter-spacing: 6px; text-transform: uppercase;">{{ $docTitle }}</div>
    </div>

    @if(!empty($renderedSalutation))
        <div style="font-weight: bold; margin-bottom: 6px; font-size: 9.5pt;">{!! $renderedSalutation !!}</div>
    @else
        <div style="font-weight: bold; margin-bottom: 6px; font-size: 9.5pt;">TO WHOM IT MAY CONCERN:</div>
    @endif

    @if(!empty($renderedContent))
        <div style="text-align: justify; margin-bottom: 10px;">{!! $renderedContent !!}</div>
    @else
        <div style="text-align: justify; margin-bottom: 10px;">
            This is to certify that the person whose name, signature and thumbmarks appear below has requested a clearance from this barangay and the result/s is/are stated below:
        </div>
    @endif
</td>
</tr>
<tr>
<td class="page-bottom">
    <table style="width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 0;">
        <tr>
            <td style="width: 60%; vertical-align: top; padding-right: 50px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td class="thumb-box" style="width: 50%; border-right: none;">Left</td>
                        <td class="thumb-box" style="width: 50%;">Right</td>
                    </tr>
                </table>
                <div style="border: 0.5px solid #666; border-top: none; text-align: center; font-size: 7.5pt; letter-spacing: 3px; padding: 2px 0; margin-bottom: 8px; color: #111;">THUMBMARKS</div>
                <div class="sig-line"></div>
                <div style="text-align: center; font-size: 8pt; margin-top: 2px; margin-bottom: 8px;">Signature</div>

                <table style="width: 100%; font-size: 8.5pt;">
                    <tr>
                        <td style="width: 82px; white-space: nowrap; padding-right: 6px; vertical-align: bottom;">Res. Cert No.</td>
                        <td class="field-line">{{ $val('ctc_number') }}</td>
                    </tr>
                    <tr><td colspan="2" style="height: 4px;"></td></tr>
                    <tr>
                        <td style="white-space: nowrap; padding-right: 6px; vertical-align: bottom;">Issued on</td>
                        <td class="field-line">{{ $val('ctc_date') }}</td>
                    </tr>
                    <tr><td colspan="2" style="height: 4px;"></td></tr>
                    <tr>
                        <td style="white-space: nowrap; padding-right: 6px; vertical-align: bottom;">Issued at</td>
                        <td class="field-line">{{ $val('ctc_place') }}</td>
                    </tr>
                </table>

                <div class="note">
                    Note: This clearance is good only for {{ $expiryDays }} days from the date of issue. Not valid without official seal.
                </div>

                <table style="width: 100%; font-size: 8.5pt;">
                    <tr>
                        <td style="width: 62px; white-space: nowrap; padding-right: 6px; vertical-align: bottom;">OR No.</td>
                        <td class="field-line">{{ $orNo }}</td>
                    </tr>
                    <tr><td colspan="2" style="height: 4px;"></td></tr>
                    <tr>
                        <td style="white-space: nowrap; padding-right: 6px; vertical-align: bottom;">Amount P</td>
                        <td class="field-line">{{ $orAmount }}</td>
                    </tr>
                </table>
            </td>
            <td style="width: 40%; vertical-align: top;">
                <div style="font-size: 8.5pt; font-weight: normal; margin-bottom: 3px;">THIS CLEARANCE IS HEREBY ISSUED FOR PURPOSES OF:</div>
                <div class="field-line" style="min-height: 18px; margin-bottom: 14px; text-transform: uppercase; font-weight: normal; font-size: 7.5pt;">{{ $val('purpose') }}</div>

                <div style="font-size: 8.5pt; margin-bottom: 2px; font-weight: normal;">Processed by:</div>
                <div class="sig-line" style="width: 85%; font-size: 7.5pt; font-weight: normal; text-transform: uppercase;">{{ e($clerkName) }}</div>
                <div style="font-size: 8pt; font-weight: normal; margin-top: 2px; margin-bottom: 14px;">Clerk In-charge</div>

                <div style="font-size: 8.5pt; font-weight: normal;">APPROVED BY:</div>
                <div style="font-size: 9pt; font-weight: normal; text-transform: uppercase; margin-top: 18px; width: 85%;">{{ e($captainName) }}</div>
                <div class="sig-line" style="width: 85%; margin-top: 2px;"></div>
                <div style="font-size: 8.5pt; font-weight: normal; margin-top: 2px;">Barangay Captain</div>
            </td>
        </tr>
    </table>

    <div class="footer-text">
        {{ !empty($footerContact) ? $footerContact : 'Seaside Coastal : (0977) 7232933 / (0960) 2547401' }}
    </div>
</td>
</tr>
</table>
</body>
</html>
