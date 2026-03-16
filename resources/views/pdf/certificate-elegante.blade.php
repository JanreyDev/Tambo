<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $template->title ?? 'Certificate' }} — {{ $document->constituent_name }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @page {
            margin: 16mm 14mm 16mm 14mm;
        }

        body {
            font-family: serif;
            font-size: 11pt;
            color: #1a1a1a;
            background: #fff;
            line-height: 1.8;
        }

        /* ── Outer decorative border ── */
        .outer-border {
            border: 2px solid #1a3a6e;
            padding: 6px;
        }

        .inner-border {
            border: 1px solid #8b9dc3;
            padding: 16px 20px 16px 20px;
        }

        /* ── Header ── */
        .header {
            text-align: center;
            padding-bottom: 12px;
            margin-bottom: 14px;
            border-bottom: 1px solid #8b9dc3;
        }

        .seal-img {
            width: 72px;
            height: 72px;
            margin: 0 auto 6px auto;
            display: block;
        }

        .republic-text {
            font-size: 8.5pt;
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
            color: #333;
            font-weight: bold;
        }

        /* ── Decorative flanking rule for barangay name ── */
        .barangay-name-wrap {
            margin-top: 4px;
        }

        .barangay-rule {
            display: inline-block;
            width: 60px;
            border-top: 1px solid #8b9dc3;
            vertical-align: middle;
            margin: 0 6px;
        }

        .barangay-name {
            font-size: 16pt;
            font-weight: bold;
            color: #1a3a6e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .office-text {
            font-size: 9pt;
            color: #666;
            font-style: italic;
            margin-top: 2px;
        }

        /* ── Document Title ── */
        .doc-title-wrap {
            text-align: center;
            margin: 20px 0 4px 0;
        }

        .doc-title {
            font-size: 15pt;
            font-weight: bold;
            color: #1a3a6e;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .doc-title-deco {
            font-size: 12pt;
            color: #8b9dc3;
            letter-spacing: 4px;
        }

        /* ── Document Number ── */
        .doc-number {
            text-align: center;
            font-size: 9pt;
            color: #777;
            font-style: italic;
            margin-bottom: 22px;
        }

        /* ── Salutation ── */
        .salutation {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 16px;
        }

        /* ── Body Content ── */
        .body-content {
            font-size: 11pt;
            text-align: justify;
            line-height: 1.9;
            margin-bottom: 20px;
            text-indent: 32px;
        }

        /* ── Photo + Thumbmark ── */
        .id-row {
            margin: 20px 0;
        }

        .id-table {
            width: 100%;
            border-collapse: collapse;
        }

        .photo-cell {
            width: 120px;
            vertical-align: top;
        }

        .photo-box {
            width: 100px;
            height: 100px;
            border: 1px solid #8b9dc3;
            text-align: center;
            overflow: hidden;
        }

        .photo-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .photo-label {
            font-size: 7pt;
            color: #888;
            text-align: center;
            margin-top: 2px;
            font-style: italic;
        }

        .thumbmark-cell {
            width: 120px;
            vertical-align: top;
            text-align: right;
        }

        .thumbmark-box {
            width: 80px;
            height: 80px;
            border: 1px solid #8b9dc3;
            margin-left: auto;
        }

        .thumbmark-label {
            font-size: 7pt;
            color: #888;
            text-align: right;
            margin-top: 2px;
            font-style: italic;
        }

        /* ── Details Block ── */
        .details-block {
            margin: 22px 0;
            font-size: 9pt;
            color: #444;
        }

        .details-block table {
            border-collapse: collapse;
        }

        .details-block td {
            padding: 2px 8px 2px 0;
            vertical-align: top;
        }

        .details-label {
            font-weight: bold;
            white-space: nowrap;
        }

        /* ── Issued Date ── */
        .issued-date {
            margin: 20px 0;
            font-size: 11pt;
        }

        /* ── Signature Block ── */
        .signature-block {
            margin-top: 52px;
        }

        .sig-table {
            width: 100%;
            border-collapse: collapse;
        }

        .sig-cell-left {
            width: 50%;
            vertical-align: bottom;
            text-align: left;
            padding-right: 20px;
        }

        .sig-cell-right {
            width: 50%;
            vertical-align: bottom;
            text-align: right;
            padding-left: 20px;
        }

        .sig-attested {
            font-size: 9pt;
            color: #666;
            font-style: italic;
            margin-bottom: 4px;
        }

        .sig-name {
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            border-top: 1px solid #1a3a6e;
            padding-top: 4px;
            display: inline-block;
            min-width: 220px;
            text-align: center;
        }

        .sig-position {
            font-size: 9pt;
            color: #555;
            text-align: center;
            font-style: italic;
        }

        /* ── Validity ── */
        .validity-text {
            font-size: 8pt;
            color: #888;
            text-align: center;
            margin-top: 12px;
            font-style: italic;
        }

        .not-valid {
            font-size: 8pt;
            font-weight: bold;
            color: #c00;
            text-align: center;
            margin-top: 4px;
        }

        /* ── Footer ── */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #8b9dc3;
            padding-top: 6px;
            font-size: 7pt;
            color: #999;
            text-align: center;
            font-style: italic;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }

        .footer-left {
            text-align: left;
            vertical-align: middle;
        }

        .footer-center {
            text-align: center;
            vertical-align: middle;
        }

        .footer-right {
            text-align: right;
            vertical-align: middle;
        }

        .qr-img {
            width: 60px;
            height: 60px;
        }
    </style>
</head>
<body>

    <div class="outer-border">
    <div class="inner-border">

        {{-- ── HEADER ── --}}
        <div class="header">
            @if($sealDataUri)
            <img src="{{ $sealDataUri }}" class="seal-img" alt="Barangay Seal">
            @endif
            <div class="republic-text">Republic of the Philippines</div>
            <div class="province-text">Province of {{ $barangay->province ?? '________________' }}</div>
            <div class="municipality-text">{{ $barangay->city_municipality ?? '________________' }}</div>
            <div class="barangay-name-wrap">
                <hr class="barangay-rule">
                <span class="barangay-name">Barangay {{ $barangay->name ?? '________________' }}</span>
                <hr class="barangay-rule">
            </div>
            <div class="office-text">Office of the Punong Barangay</div>
        </div>

        {{-- ── DOCUMENT TITLE ── --}}
        <div class="doc-title-wrap">
            <span class="doc-title-deco">&mdash;</span>
            <span class="doc-title">{{ $template->title ?? $template->name }}</span>
            <span class="doc-title-deco">&mdash;</span>
        </div>

        {{-- ── DOCUMENT NUMBER ── --}}
        @if($settings['show_doc_no'] ?? false)
        <div class="doc-number">Control No.: {{ $document->document_number }}</div>
        @endif

        {{-- ── SALUTATION ── --}}
        @if($renderedSalutation)
        <div class="salutation">{{ $renderedSalutation }}</div>
        @endif

        {{-- ── BODY CONTENT ── --}}
        <div class="body-content">
            {!! nl2br(e($renderedContent)) !!}
        </div>

        {{-- ── PHOTO + THUMBMARK ── --}}
        @if(($settings['show_photo'] ?? false) || ($settings['show_thumbmark'] ?? false))
        <div class="id-row">
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
        </div>
        @endif

        {{-- ── CTC / OR DETAILS ── --}}
        @if(($settings['show_ctc'] ?? false) || ($settings['show_or'] ?? false))
        <div class="details-block">
            <table>
                @if($settings['show_or'] ?? false)
                    @if($document->or_number)
                    <tr>
                        <td class="details-label">O.R. No.:</td>
                        <td>{{ $document->or_number }}</td>
                        <td class="details-label" style="padding-left: 20px;">Amount:</td>
                        <td>&#8369;{{ number_format((float)($document->or_amount ?? 0), 2) }}</td>
                    </tr>
                    @endif
                @endif
                @if($settings['show_ctc'] ?? false)
                    @if($document->ctc_number)
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
                @endif
            </table>
        </div>
        @endif

        {{-- ── ISSUED DATE ── --}}
        <div class="issued-date">
            <strong>Issued this {{ $document->issued_date?->format('jS') ?? '____' }} day of {{ $document->issued_date?->format('F, Y') ?? '__________, ____' }}</strong>
            at Barangay {{ $barangay->name }}, {{ $barangay->city_municipality }}, {{ $barangay->province }}.
        </div>

        {{-- ── SIGNATURE BLOCK ── --}}
        <div class="signature-block">
            <table class="sig-table">
                <tr>
                    @if(!empty($approvalConfig['left']))
                    <td class="sig-cell-left">
                        <div class="sig-attested">Attested by:</div>
                        <div class="sig-name">{{ $document->approved_by_left ?? $approvalConfig['left']['label'] ?? '' }}</div>
                        <div class="sig-position">{{ $approvalConfig['left']['position'] ?? '' }}</div>
                    </td>
                    @endif
                    @if(!empty($approvalConfig['right']))
                    <td class="sig-cell-right">
                        <div class="sig-attested">Approved by:</div>
                        <div class="sig-name">{{ $document->approved_by_right ?? $approvalConfig['right']['label'] ?? '' }}</div>
                        <div class="sig-position">{{ $approvalConfig['right']['position'] ?? '' }}</div>
                    </td>
                    @endif
                </tr>
            </table>
        </div>

        {{-- ── VALIDITY ── --}}
        @if(($settings['show_expiry'] ?? false) && $document->valid_until)
        <div class="validity-text">
            Valid until: {{ $document->valid_until->format('F d, Y') }}
        </div>
        <div class="not-valid">NOT VALID WITHOUT OFFICIAL DRY SEAL</div>
        @endif

    </div>{{-- inner-border --}}
    </div>{{-- outer-border --}}

    {{-- ── FOOTER ── --}}
    <div class="footer">
        <table class="footer-table">
            <tr>
                <td class="footer-left">
                    <em>Prepared by: {{ $issuedByName }} &nbsp;|&nbsp; Date: {{ $issuedAt }}</em>
                </td>
                <td class="footer-center">
                    @if($document->blockchain_hash)
                    <span style="font-size: 6pt; font-style: italic;">Hash: {{ substr($document->blockchain_hash, 0, 16) }}...</span>
                    @endif
                </td>
                <td class="footer-right">
                    @if($qrDataUri)
                    <img src="{{ $qrDataUri }}" class="qr-img" alt="Verification QR">
                    <br><span style="font-size: 6pt;">Scan to verify</span>
                    @endif
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
