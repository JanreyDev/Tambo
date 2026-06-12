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

        .watermark {
            position: fixed;
            top: 35%;
            left: 50%;
            width: 350px;
            height: 350px;
            margin-left: -50px;
            opacity: 0.06;
            z-index: 0;
        }
        .watermark img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
    </style>
</head>
<body>

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

{{-- ══════════════════════════════════════════════════════════════
     FIXED LAYERS (rendered first for DomPDF)
     ══════════════════════════════════════════════════════════════ --}}

{{-- 1. Fixed sidebar background (lower half) — table cell covers the upper half --}}
<div style="position: fixed; top: 250px; left: 0; bottom: 0; width: 36%; background-color: {{ $themeTint }}; z-index: -3;"></div>
<div style="position: fixed; top: 250px; left: 36%; bottom: 0; width: 1px; background-color: {{ $hexToRgba($themePrimary, 0.2) }}; z-index: -2;"></div>

{{-- 2. Fixed footer --}}
<div style="position: fixed; bottom: 0; left: 0; right: 0; border-top: 1px solid {{ $hexToRgba($themePrimary, 0.2) }}; background-color: {{ $themeTint }}; z-index: 10; padding: 6px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td style="font-size: 7pt; color: #888; text-transform: uppercase; letter-spacing: 1px;">{{ $document->document_number ?? '' }}</td>
            <td align="right" style="font-size: 7pt; color: #888; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">NOT VALID WITHOUT SEAL</td>
        </tr>
    </table>
</div>

{{-- 3. Sidebar Bottom Block (Fixed above footer in sidebar) --}}
<div style="position: fixed; bottom: 24px; left: 0; width: 36%; box-sizing: border-box; border-right: 1px solid {{ $hexToRgba($themePrimary, 0.2) }}; background-color: {{ $themeTint }}; z-index: 5;">
    <div style="padding: 0 12px;">
        {{-- Diamond separator --}}
        <div style="text-align: center; margin: 0 0 12px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="border-top: 1px solid {{ $hexToRgba($themePrimary, 0.27) }};"></td>
                    <td width="16" align="center" style="font-size: 8pt; color: {{ $hexToRgba($themePrimary, 0.53) }}; line-height: 1;">&#9670;</td>
                    <td style="border-top: 1px solid {{ $hexToRgba($themePrimary, 0.27) }};"></td>
                </tr>
            </table>
        </div>

        {{-- Issued / Valid Until --}}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 5px;">
            <tr>
                <td style="font-size: 6.5pt; color: #666; font-style: italic; text-transform: uppercase; letter-spacing: 2px;">ISSUED</td>
                <td align="right" style="font-size: 6.5pt; font-weight: bold; color: {{ $themePrimary }};">{{ $document->issued_date?->format('M d, Y') ?? '—' }}</td>
            </tr>
        </table>
        @if($document->valid_until)
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
            <tr>
                <td style="font-size: 6.5pt; color: #666; font-style: italic; text-transform: uppercase; letter-spacing: 2px;">VALID UNTIL</td>
                <td align="right" style="font-size: 6.5pt; font-weight: bold; color: {{ $themePrimary }};">{{ $document->valid_until->format('M d, Y') }}</td>
            </tr>
        </table>
        @endif
    </div>

    {{-- Verify Document --}}
    <div style="border-top: 2px solid {{ $themePrimary }}; padding: 12px 12px 40px 12px; text-align: center; background-color: {{ $themeTint }};">
        <div style="font-size: 6.5pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">VERIFY DOCUMENT</div>
        @if($qrDataUri)
        <div style="border: 2px solid {{ $themePrimary }}; padding: 3px; background-color: #fff; display: inline-block;">
            <img src="{{ $qrDataUri }}" width="80" height="80" alt="QR" style="display: block;">
        </div>
        @endif
    </div>
</div>

{{-- 3. Design patterns --}}
@switch($designPattern)
    @case('wave')
        @php
            $topSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 20" preserveAspectRatio="none"><path d="M0,6 Q50,18 100,8 T200,10 L200,0 L0,0 Z" fill="'.$themePrimary.'" fill-opacity="0.3"/></svg>';
            $bottomSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 20" preserveAspectRatio="none"><path d="M0,20 Q50,2 100,12 T200,10 L200,20 L0,20 Z" fill="'.$themeAccent.'" fill-opacity="0.2"/></svg>';
        @endphp
        <img src="data:image/svg+xml;base64,{{ base64_encode($topSvg) }}" style="position: fixed; top: 0; left: 0; width: 100%; height: 60px; z-index: -1;">
        <img src="data:image/svg+xml;base64,{{ base64_encode($bottomSvg) }}" style="position: fixed; bottom: 0; left: 0; width: 100%; height: 60px; z-index: -1;">
        @break
    @case('minimal')
        <div style="position: fixed; top: 30px; left: 30px; right: 30px; height: 1px; background-color: {{ $hexToRgba($themeAccent, 0.7) }}; z-index: -1;"></div>
        @break
    @case('gradient')
        @php
            $gradSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" preserveAspectRatio="none"><rect x="0%" y="0%" width="100%" height="100%" fill="'.$themePrimary.'" fill-opacity="0.25"/><rect x="20%" y="0%" width="80%" height="100%" fill="'.$themeAccent.'" fill-opacity="0.05"/><rect x="40%" y="0%" width="60%" height="100%" fill="'.$themeAccent.'" fill-opacity="0.05"/><rect x="60%" y="0%" width="40%" height="100%" fill="'.$themeAccent.'" fill-opacity="0.05"/><rect x="80%" y="0%" width="20%" height="100%" fill="'.$themeAccent.'" fill-opacity="0.05"/></svg>';
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
    @default
@endswitch

{{-- 4. Watermark --}}
@if($sealDataUri)
<div class="watermark">
    <img src="{{ $sealDataUri }}" alt="Watermark">
</div>
@endif

{{-- ══════════════════════════════════════════════════════════════
     HEADER — Two logos flanking centered text
     ══════════════════════════════════════════════════════════════ --}}
<table width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 2px double {{ $themePrimary }};">
    <tr>
        {{-- Left logo --}}
        @if(isset($municipalityLogoUrl) && $municipalityLogoUrl)
        <td width="100" align="center" valign="middle" style="padding: 12px 5px 12px 20px;">
            <img src="{{ $municipalityLogoUrl }}" width="80" height="80" alt="LGU Logo">
        </td>
        @else
        <td width="100" align="center" valign="middle" style="padding: 12px 5px 12px 20px;">
            @if($sealDataUri)
            <img src="{{ $sealDataUri }}" width="80" height="80" alt="Seal">
            @endif
        </td>
        @endif

        {{-- Center text --}}
        <td align="center" valign="middle" style="padding: 12px 5px;">
            <div style="font-size: 8pt; color: #666; letter-spacing: 2px; text-transform: uppercase;">REPUBLIC OF THE PHILIPPINES</div>
            <div style="font-size: 9pt; color: #444; margin-top: 2px;">Province of <strong>{{ $barangay->province ?? 'Metro Manila' }}</strong></div>
            <div style="font-size: 10pt; color: #333; font-weight: bold; margin-top: 1px;">{{ $barangay->city_municipality ?? 'City' }}</div>
            <div style="font-size: 18pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase; letter-spacing: 2px; margin-top: 3px; line-height: 1.15;">{{ $barangay->name ?? 'BARANGAY' }}</div>
        </td>

        {{-- Right logo --}}
        <td width="100" align="center" valign="middle" style="padding: 12px 20px 12px 5px;">
            @if($sealDataUri)
            <img src="{{ $sealDataUri }}" width="80" height="80" alt="Seal">
            @endif
        </td>
    </tr>
</table>

{{-- ══════════════════════════════════════════════════════════════
     BODY — Two-column: sidebar (36%) + content (64%)
     ══════════════════════════════════════════════════════════════ --}}
<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td width="36%" valign="top" style="padding: 0; background-color: {{ $themeTint }}; border-right: 1px solid {{ $hexToRgba($themePrimary, 0.2) }};">
            <div style="padding: 18px 12px 180px 12px;">

                {{-- Sangguniang Barangay title --}}
                <div style="text-align: center; margin-bottom: 10px;">
                    <div style="font-size: 8pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase; letter-spacing: 1.5px;">SANGGUNIANG BARANGAY</div>
                    <div style="font-size: 8pt; font-weight: bold; color: {{ $themePrimary }}; letter-spacing: 2px; margin-top: 2px;">{{ $barangay->officials_term ?? '2024 — 2026' }}</div>
                </div>

                {{-- Divider --}}
                <div style="border-top: 1px solid {{ $hexToRgba($themePrimary, 0.33) }}; margin: 8px 0 25px 0;"></div>

                {{-- Officials list --}}
                @php
                    $officialCount = count($officials);
                    $spacing = $officialCount > 0 ? min(60, max(12, floor(420 / $officialCount))) : 12;
                @endphp
                @foreach($officials as $official)
                <div style="text-align: center; margin-bottom: {{ $spacing }}px;">
                    <div style="font-size: 7pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase; letter-spacing: 0.5px;">HON. {{ strtoupper($official->name) }}</div>
                    <div style="font-size: 6.5pt; color: #555; font-style: italic; margin-top: 1px;">{{ $official->position }}</div>
                </div>
                @endforeach
            </div>
        </td>

        {{-- ── RIGHT CONTENT (64%) ── --}}
        <td width="64%" valign="top" style="padding: 30px 35px 140px 30px;">

            {{-- Certificate Title --}}
            <div style="text-align: center; margin-bottom: 5px;">
                <div style="font-size: 16pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase; letter-spacing: 3px;">{{ $template->title ?? $template->name }}</div>
            </div>

            {{-- Accent bar --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                    <td width="15%"></td>
                    <td width="70%" style="height: 5px; background-color: {{ $themeAccent }}; border-radius: 3px;"></td>
                    <td width="15%"></td>
                </tr>
            </table>

            {{-- Salutation --}}
            @if($renderedSalutation)
            <div style="font-size: 10pt; font-weight: bold; color: {{ $themePrimary }}; text-transform: uppercase; letter-spacing: 1px; margin-top: 30px; margin-bottom: 15px;">{{ $renderedSalutation }}</div>
            @endif

            {{-- Body text --}}
            <div style="font-size: 10pt; text-align: justify; line-height: 1.7; color: #333; margin-bottom: 20px;">
                {!! nl2br(e($renderedContent)) !!}
            </div>

            {{-- Requested By / Purpose --}}
            <table cellpadding="0" cellspacing="0" style="margin: 10px 0 20px 20px; font-size: 9pt;">
                <tr>
                    <td style="font-weight: bold; color: {{ $themePrimary }}; padding-right: 10px; padding-bottom: 5px; white-space: nowrap;">Requested By:</td>
                    <td style="text-transform: uppercase; color: #333; padding-bottom: 5px;">{{ $document->constituent_name }}</td>
                </tr>
                @if($document->purpose)
                <tr>
                    <td style="font-weight: bold; color: {{ $themePrimary }}; padding-right: 10px; padding-bottom: 5px; white-space: nowrap;">Purpose:</td>
                    <td style="text-transform: uppercase; color: #333; padding-bottom: 5px;">{{ strtoupper($document->purpose) }}</td>
                </tr>
                @endif
            </table>

            {{-- OR / CTC --}}
            @if(($settings['show_or'] ?? false) && $document->or_number)
            <table cellpadding="0" cellspacing="0" style="margin: 0 0 8px 20px; font-size: 9pt;">
                <tr>
                    <td style="font-weight: bold; color: {{ $themePrimary }}; padding-right: 8px;">O.R. No.:</td>
                    <td style="color: #333;">{{ $document->or_number }}</td>
                    @if($document->or_amount !== null)
                    <td style="font-weight: bold; color: {{ $themePrimary }}; padding-left: 15px; padding-right: 8px;">Amount:</td>
                    <td style="color: #333;">&#8369;{{ number_format((float)$document->or_amount, 2) }}</td>
                    @endif
                </tr>
            </table>
            @endif
            @if(($settings['show_ctc'] ?? false) && $document->ctc_number)
            <table cellpadding="0" cellspacing="0" style="margin: 0 0 8px 20px; font-size: 9pt;">
                <tr>
                    <td style="font-weight: bold; color: {{ $themePrimary }}; padding-right: 8px;">CTC No.:</td>
                    <td style="color: #333;">{{ $document->ctc_number }}</td>
                </tr>
            </table>
            @endif



            {{-- Signature Block (Fixed at bottom right) --}}
            @php
                $pbName = 'PUNONG BARANGAY';
                foreach($officials as $official) {
                    if (stripos($official->position, 'Punong Barangay') !== false || stripos($official->position, 'Captain') !== false || stripos($official->position, 'Kapitan') !== false) {
                        $pbName = 'HON. ' . strtoupper($official->name);
                        break;
                    }
                }
                
                $rightName = $document->approved_by_right ?? $approvalConfig['right']['label'] ?? null;
                if (empty($rightName) || strtolower(trim($rightName)) === 'punong barangay') {
                    $rightName = $pbName;
                }
            @endphp
            <div style="position: fixed; bottom: 80px; right: 50px; width: 350px; text-align: center;">
                <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; color: {{ $themePrimary }}; letter-spacing: 1px;">{{ $rightName }}</div>
                <div style="border-top: 1px solid {{ $hexToRgba($themePrimary, 0.5) }}; margin: 5px 0;"></div>
                <div style="font-size: 8pt; color: #666; text-transform: uppercase; letter-spacing: 2px;">{{ $approvalConfig['right']['position'] ?? 'PUNONG BARANGAY' }}</div>
            </div>

        </td>
    </tr>
</table>

</body>
</html>
