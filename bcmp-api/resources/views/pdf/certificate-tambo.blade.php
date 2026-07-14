<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $template->title ?? 'Clearance' }} — {{ $document->constituent_name }}</title>
    <style>
        @page { margin: 28px 36px; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: {!! $fontFamily !!};
            font-size: 10pt;
            color: #111;
            line-height: 1.35;
        }
        table { border-collapse: collapse; width: 100%; }
        .field-label { font-weight: bold; white-space: nowrap; padding-right: 6px; vertical-align: bottom; }
        .field-line { border-bottom: 1px solid #111; min-height: 16px; vertical-align: bottom; padding: 0 2px 1px; }
        .thumb-box { border: 1px solid #111; height: 52px; text-align: center; vertical-align: middle; font-size: 8pt; color: #555; }
        .sig-line { border-bottom: 1px solid #111; height: 28px; }
        .note { font-size: 8pt; font-style: italic; margin-top: 6px; }
        .footer-text { font-size: 8.5pt; text-align: center; margin-top: 14px; color: #333; }
        .header-wrapper { padding-top: 10px; text-align: center; margin-bottom: 12px; }
        .header-logos img { width: 72px; height: 72px; margin: 0 6px; vertical-align: middle; border-radius: 50%; }
        .header-line { width: 70px; height: 1px; background-color: {{ $themePrimary }}; margin: 8px auto 0 auto; }
        .title-text { font-size: 16pt; font-weight: bold; color: {{ $themePrimary }}; letter-spacing: 2px; text-transform: uppercase; }
        .title-underline { width: 50px; height: 2px; background-color: {{ $themeAccent }}; margin: 6px auto 0 auto; }
        .watermark { position: fixed; top: 28%; left: 50%; width: 320px; height: 320px; margin-left: -160px; opacity: 0.07; z-index: -1000; }
        .meta-row { text-align: right; font-size: 9pt; margin-bottom: 10px; }
    </style>
</head>
<body>
@php
    $mv = $mergeValues ?? [];
    $val = fn(string $k, string $fallback = '') => e($mv[$k] ?? $fallback);
    $docNo = $document->document_number ?? '';
    $issuedDate = $document->issued_date?->format('M d, Y') ?? $issuedAt ?? now()->format('M d, Y');
    $expiryDays = (int) (($settings['expiry_months'] ?? 3) * 30);
    if ($expiryDays < 1) { $expiryDays = 90; }
    $captainName = $document->approved_by_right
        ?? collect($officials ?? [])->first(fn ($o) => stripos($o->position ?? '', 'punong') !== false || stripos($o->position ?? '', 'captain') !== false)?->name
        ?? ($barangay->settings['default_signatory_name'] ?? '');
    $captainName = preg_replace('/^HON\.\s+/i', '', (string) $captainName);
    $clerkName = $document->approved_by_left ?? '';
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
    <div style="font-size: 8pt; color: #666; letter-spacing: 2px; text-transform: uppercase;">Republic of the Philippines</div>
    <div style="font-size: 11pt; font-weight: bold; color: #111; text-transform: uppercase; margin-top: 3px;">{{ $cityLine }}</div>
    <div style="font-size: 8pt; color: #666; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px;">{{ strtoupper($barangay->province ?? 'METRO MANILA') }}</div>
    <div style="font-size: 11pt; font-weight: 500; color: #111; margin-top: 6px;">{{ $officeName }}</div>
    <div class="header-line"></div>
    <div style="margin-top: 14px;">
        <div class="title-text">{{ $docTitle }}</div>
        <div class="title-underline"></div>
    </div>
</div>

<div class="meta-row">
    No.: <span style="border-bottom: 1px solid #111; display: inline-block; min-width: 90px;">{{ e($docNo) }}</span>
    &nbsp;&nbsp;
    Date.: <span style="border-bottom: 1px solid #111; display: inline-block; min-width: 90px;">{{ e($issuedDate) }}</span>
</div>

@if(!empty($renderedSalutation))
    <div style="font-weight: bold; margin-bottom: 8px;">{!! $renderedSalutation !!}</div>
@else
    <div style="font-weight: bold; margin-bottom: 8px;">TO WHOM IT MAY CONCERN:</div>
@endif

@if(!empty($renderedContent))
    <div style="text-align: justify; margin-bottom: 12px;">{!! $renderedContent !!}</div>
@else
    <div style="text-align: justify; margin-bottom: 12px;">
        This is to certify that the person whose name, signature and thumbmarks appear below has requested a clearance from this barangay and the result/s is/are stated below:
    </div>
@endif

<table style="margin-bottom: 6px;">
    <tr>
        <td class="field-label" style="width: 12%;">NAME:</td>
        <td class="field-line" colspan="3">{{ $val('full_name', $document->constituent_name ?? '') }}</td>
        <td class="field-label" style="width: 10%; padding-left: 8px;">ALIAS/ES:</td>
        <td class="field-line" style="width: 18%;">{{ $val('alias') }}</td>
    </tr>
</table>
<table style="margin-bottom: 6px;">
    <tr>
        <td class="field-label">BIRTHDATE:</td>
        <td class="field-line" style="width: 22%;">{{ $val('date_of_birth', $val('birthdate')) }}</td>
        <td class="field-label" style="padding-left: 6px;">AGE:</td>
        <td class="field-line" style="width: 8%;">{{ $val('age') }}</td>
        <td class="field-label" style="padding-left: 6px;">BIRTHPLACE:</td>
        <td class="field-line">{{ $val('place_of_birth', $val('birthplace')) }}</td>
    </tr>
</table>
<table style="margin-bottom: 6px;">
    <tr>
        <td class="field-label">CIVIL STATUS:</td>
        <td class="field-line" style="width: 20%;">{{ $val('civil_status') }}</td>
        <td class="field-label" style="padding-left: 6px;">GENDER:</td>
        <td class="field-line" style="width: 14%;">{{ $val('sex', $val('gender')) }}</td>
        <td class="field-label" style="padding-left: 6px;">CITIZENSHIP:</td>
        <td class="field-line">{{ $val('citizenship', 'Filipino') }}</td>
    </tr>
</table>
<table style="margin-bottom: 6px;">
    <tr>
        <td class="field-label" style="width: 12%;">ADDRESS:</td>
        <td class="field-line">{{ $val('address') }}</td>
    </tr>
</table>
<table style="margin-bottom: 14px;">
    <tr>
        <td class="field-label" style="width: 12%;">REMARKS:</td>
        <td class="field-line">{{ $val('remarks') }}</td>
    </tr>
</table>

<table>
    <tr>
        <td style="width: 48%; vertical-align: top; padding-right: 10px;">
            <table style="width: 100%; margin-bottom: 8px;">
                <tr>
                    <td class="thumb-box" style="width: 50%;">Left</td>
                    <td class="thumb-box" style="width: 50%;">Right</td>
                </tr>
            </table>
            <div style="text-align: center; font-size: 8pt; letter-spacing: 3px; margin-bottom: 10px;">T H U M B M A R K S</div>
            <div class="sig-line"></div>
            <div style="text-align: center; font-size: 8.5pt; margin-top: 2px;">Signature</div>

            <table style="margin-top: 12px; font-size: 9pt;">
                <tr>
                    <td style="width: 34%;">Res. Cert No.</td>
                    <td class="field-line">{{ $val('ctc_number') }}</td>
                </tr>
                <tr><td colspan="2" style="height: 4px;"></td></tr>
                <tr>
                    <td>Issued on</td>
                    <td class="field-line">{{ $val('ctc_date') }}</td>
                </tr>
                <tr><td colspan="2" style="height: 4px;"></td></tr>
                <tr>
                    <td>Issued at</td>
                    <td class="field-line">{{ $val('ctc_place') }}</td>
                </tr>
            </table>

            <div class="note">
                Note: This clearance is good only for {{ $expiryDays }} days from the date of issue. Not valid without official seal.
            </div>

            <table style="margin-top: 8px; font-size: 9pt;">
                <tr>
                    <td style="width: 18%;">OR No.</td>
                    <td class="field-line" style="width: 42%;">{{ e($document->or_number ?? '') }}</td>
                    <td style="width: 16%; padding-left: 6px;">Amount P</td>
                    <td class="field-line">{{ e($document->or_amount ?? '') }}</td>
                </tr>
            </table>
        </td>
        <td style="width: 52%; vertical-align: top; padding-left: 10px;">
            <div style="font-size: 9pt; font-weight: bold; margin-bottom: 4px;">THIS CLEARANCE IS HEREBY ISSUED FOR PURPOSES OF:</div>
            <div class="field-line" style="min-height: 22px; margin-bottom: 18px;">{{ $val('purpose') }}</div>

            <div style="font-size: 9pt; margin-bottom: 2px;">Processed by:</div>
            <div class="sig-line" style="width: 75%;"></div>
            <div style="font-size: 8.5pt; font-weight: bold; margin-top: 2px;">{{ $clerkName !== '' ? e($clerkName) : 'Clerk In-charge' }}</div>

            <div style="margin-top: 22px; font-size: 9pt; font-weight: bold;">APPROVED BY:</div>
            <div class="sig-line" style="width: 75%; margin-top: 28px;"></div>
            <div style="font-size: 10pt; font-weight: bold; margin-top: 4px; text-transform: uppercase;">{{ e($captainName) }}</div>
            <div style="font-size: 9pt;">Barangay Captain</div>
        </td>
    </tr>
</table>

@if(!empty($footerContact))
    <div class="footer-text">{{ $footerContact }}</div>
@endif
</body>
</html>
