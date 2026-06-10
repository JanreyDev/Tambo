<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $template->title ?? 'Certificate' }} — {{ $document->constituent_name }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @page {
            margin: 15mm;
        }

        body {
            font-family: {!! $fontFamily !!};
            font-size: 11pt;
            color: #1a1a1a;
            background: #fff;
            line-height: 1.6;
        }

        .border-frame {
            border: 4px double {{ $themePrimary }};
            padding: 10mm;
            min-height: 100%;
        }

        /* ── Header ── */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .seal-cell {
            width: 90px;
            text-align: center;
            vertical-align: middle;
        }

        .seal-img {
            width: 80px;
            height: 80px;
        }

        .header-text {
            text-align: center;
            vertical-align: middle;
        }

        .republic-text {
            font-size: 9pt;
            color: #444;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }

        .province-text {
            font-size: 9pt;
            color: #555;
        }

        .municipality-text {
            font-size: 10pt;
            color: {{ $themePrimary }};
            font-weight: bold;
            text-transform: uppercase;
        }

        .barangay-name {
            font-size: 14pt;
            font-weight: bold;
            color: {{ $themePrimary }};
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 2px;
        }

        /* ── Document Title ── */
        .title-wrapper {
            border-top: 1px solid {{ $themeAccent }}66;
            border-bottom: 1px solid {{ $themeAccent }}66;
            margin: 20px 0;
            padding: 10px 0;
            text-align: center;
        }

        .doc-title {
            font-size: 18pt;
            font-weight: bold;
            color: {{ $themePrimary }};
            text-transform: uppercase;
            letter-spacing: 3px;
        }

        .doc-number {
            font-size: 9pt;
            color: {{ $themeAccent }};
            margin-top: 4px;
        }

        /* ── Officials Block (Placed Below Main Header if configured, or omitted) ── */
        /* For Formal Government, usually the roster isn't on the side. We can list a few at the bottom or ignore. */
        /* Wait, the user preview for Formal Government just centers everything. The body takes the whole width. */

        /* ── Salutation ── */
        .salutation {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 15px;
            margin-top: 30px;
        }

        /* ── Body Content ── */
        .body-text {
            font-size: 11pt;
            text-align: justify;
            line-height: 1.8;
            margin-bottom: 25px;
        }

        /* ── Photo + Thumbmark Row ── */
        .id-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }

        .photo-cell { width: 120px; vertical-align: top; }
        .thumbmark-cell { width: 120px; vertical-align: top; text-align: right; }

        .photo-box {
            width: 100px; height: 100px;
            border: 1px solid {{ $themeAccent }};
            text-align: center; overflow: hidden;
        }
        .photo-box img { width: 100%; height: 100%; object-fit: cover; }
        .photo-label { font-size: 8pt; color: #666; text-align: center; margin-top: 2px; }

        .thumbmark-box {
            width: 80px; height: 80px;
            border: 1px solid {{ $themeAccent }};
            margin-left: auto;
        }
        .thumbmark-label { font-size: 8pt; color: #666; text-align: right; margin-top: 2px; }

        /* ── Details Block (CTC, OR) ── */
        .details-table {
            border-collapse: collapse;
            font-size: 9pt;
            color: #444;
            margin-bottom: 25px;
        }
        .details-table td { padding: 2px 10px 2px 0; vertical-align: top; }
        .details-label { font-weight: bold; }

        /* ── Issued Date ── */
        .issued-date {
            margin: 20px 0;
            font-size: 11pt;
        }

        /* ── Signature Block ── */
        .signature-block {
            margin-top: 60px;
        }

        .sig-table {
            width: 100%;
            border-collapse: collapse;
        }

        .sig-cell {
            width: 50%;
            vertical-align: bottom;
            padding: 0 10px;
        }

        .sig-left { text-align: left; }
        .sig-right { text-align: right; }

        .sig-attested { font-size: 9pt; color: #666; margin-bottom: 30px; }
        .sig-name {
            font-size: 11pt; font-weight: bold; text-transform: uppercase;
            border-top: 1px solid {{ $themePrimary }}; padding-top: 4px; display: inline-block; min-width: 200px; text-align: center;
        }
        .sig-position { font-size: 9pt; color: #555; text-align: center; }

        /* ── Footer ── */
        .footer-table {
            width: 100%;
            margin-top: 50px;
            border-top: 1px solid {{ $themeAccent }}44;
            padding-top: 10px;
            font-size: 8pt;
            color: #777;
        }

        .footer-left { text-align: left; vertical-align: middle; }
        .footer-center { text-align: center; vertical-align: middle; }
        .footer-right { text-align: right; vertical-align: middle; }

        .qr-img { width: 60px; height: 60px; }
        .not-valid { font-weight: bold; color: #c00; margin-top: 4px; }

    </style>
</head>
<body>

<div class="border-frame">

    {{-- HEADER --}}
    <table class="header-table">
        <tr>
            <td class="seal-cell">
                @if($sealDataUri)
                <img src="{{ $sealDataUri }}" class="seal-img" alt="Barangay Seal">
                @endif
            </td>
            <td class="header-text">
                <div class="republic-text">Republic of the Philippines</div>
                <div class="province-text">Province of {{ $barangay->province ?? '________________' }}</div>
                <div class="municipality-text">{{ $barangay->city_municipality ?? '________________' }}</div>
                <div class="barangay-name">BARANGAY {{ $barangay->name ?? '________________' }}</div>
            </td>
            <td class="seal-cell">
                <!-- City Logo -->
            </td>
        </tr>
    </table>

    {{-- TITLE & NUMBER --}}
    <div class="title-wrapper">
        <div class="doc-title">{{ $template->title ?? $template->name }}</div>
        @if($settings['show_doc_no'] ?? false)
        <div class="doc-number">Control No.: {{ $document->document_number }}</div>
        @endif
    </div>

    {{-- SALUTATION --}}
    @if($renderedSalutation)
    <div class="salutation">{{ $renderedSalutation }}</div>
    @endif

    {{-- BODY --}}
    <div class="body-text">
        {!! nl2br(e($renderedContent)) !!}
    </div>

    {{-- PHOTO & THUMBMARK --}}
    @if(($settings['show_photo'] ?? false) || ($settings['show_thumbmark'] ?? false))
    <table class="id-table">
        <tr>
            @if($settings['show_photo'] ?? false)
            <td class="photo-cell">
                <div class="photo-box">
                    @if($photoDataUri)
                    <img src="{{ $photoDataUri }}" alt="Photo">
                    @endif
                </div>
                <div class="photo-label">Photo</div>
            </td>
            @endif
            <td></td>
            @if($settings['show_thumbmark'] ?? false)
            <td class="thumbmark-cell">
                <div class="thumbmark-box"></div>
                <div class="thumbmark-label">Right Thumbmark</div>
            </td>
            @endif
        </tr>
    </table>
    @endif

    {{-- OR & CTC --}}
    @if(($settings['show_ctc'] ?? false) || ($settings['show_or'] ?? false))
    <table class="details-table">
        @if($settings['show_or'] ?? false && $document->or_number)
        <tr>
            <td class="details-label">O.R. No.:</td>
            <td>{{ $document->or_number }}</td>
            <td class="details-label" style="padding-left: 20px;">Amount:</td>
            <td>&#8369;{{ number_format((float)($document->or_amount ?? 0), 2) }}</td>
        </tr>
        @endif
        @if($settings['show_ctc'] ?? false && $document->ctc_number)
        <tr>
            <td class="details-label">CTC No.:</td>
            <td>{{ $document->ctc_number }}</td>
            <td class="details-label" style="padding-left: 20px;">Issued at:</td>
            <td>{{ $document->ctc_place ?? '' }}</td>
        </tr>
        <tr>
            <td class="details-label">Date Issued:</td>
            <td colspan="3">{{ $document->ctc_date?->format('F d, Y') ?? '' }}</td>
        </tr>
        @endif
    </table>
    @endif

    {{-- ISSUED DATE --}}
    <div class="issued-date">
        This CLEARANCE is being issued upon the request of the above-named person for whatever legal purposes it may serve.<br><br>
        <strong>Issued this {{ $document->issued_date?->format('jS') ?? '____' }} day of {{ $document->issued_date?->format('F, Y') ?? '__________, ____' }}</strong>
        at Barangay {{ $barangay->name }}, {{ $barangay->city_municipality }}, {{ $barangay->province }}.
    </div>

    {{-- SIGNATURES --}}
    <div class="signature-block">
        <table class="sig-table">
            <tr>
                @if(!empty($approvalConfig['left']))
                <td class="sig-cell sig-left">
                    <div class="sig-attested">Attested by:</div>
                    <div class="sig-name">{{ $document->approved_by_left ?? $approvalConfig['left']['label'] ?? '' }}</div>
                    <div class="sig-position">{{ $approvalConfig['left']['position'] ?? '' }}</div>
                </td>
                @endif
                @if(!empty($approvalConfig['right']))
                <td class="sig-cell sig-right">
                    <div class="sig-attested">Approved by:</div>
                    <div class="sig-name">{{ $document->approved_by_right ?? $approvalConfig['right']['label'] ?? '' }}</div>
                    <div class="sig-position">{{ $approvalConfig['right']['position'] ?? '' }}</div>
                </td>
                @endif
            </tr>
        </table>
    </div>

    {{-- FOOTER --}}
    <table class="footer-table">
        <tr>
            <td class="footer-left">
                Prepared by: {{ $issuedByName }}<br>
                Date: {{ $issuedAt }}
                @if(($settings['show_expiry'] ?? false) && $document->valid_until)
                <br><br>Valid until: {{ $document->valid_until->format('F d, Y') }}
                <div class="not-valid">NOT VALID WITHOUT OFFICIAL DRY SEAL</div>
                @endif
            </td>
            <td class="footer-center">
                @if($document->blockchain_hash)
                <span style="font-size: 7pt; color: #aaa;">Hash: {{ substr($document->blockchain_hash, 0, 16) }}...</span>
                @endif
            </td>
            <td class="footer-right">
                @if($qrDataUri)
                <img src="{{ $qrDataUri }}" class="qr-img" alt="Verification QR"><br>
                <span style="font-size: 6pt;">Scan to verify</span>
                @endif
            </td>
        </tr>
    </table>

</div>

</body>
</html>
