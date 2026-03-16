<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $template->title ?? 'Certificate' }} — {{ $document->constituent_name }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @page {
            margin: 0 0 20mm 0;
        }

        body {
            font-family: sans-serif;
            font-size: 11pt;
            color: #1a1a1a;
            background: #fff;
            line-height: 1.6;
        }

        /* ── Blue top accent bar ── */
        .top-bar {
            background: #1a56db;
            height: 6px;
            width: 100%;
        }

        /* ── Content wrapper — apply page side margins here ── */
        .content-wrap {
            padding: 14mm 18mm 0 18mm;
        }

        /* ── Header ── */
        .header {
            margin-bottom: 18px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .seal-cell {
            width: 70px;
            vertical-align: middle;
        }

        .seal-img {
            width: 60px;
            height: 60px;
        }

        .header-text {
            text-align: left;
            vertical-align: middle;
            padding-left: 12px;
        }

        .republic-text {
            font-size: 8pt;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .province-text {
            font-size: 8pt;
            color: #6b7280;
        }

        .municipality-text {
            font-size: 9pt;
            color: #374151;
            font-weight: 600;
        }

        .barangay-name {
            font-size: 14pt;
            font-weight: bold;
            color: #111827;
            margin-top: 1px;
        }

        .office-text {
            font-size: 8pt;
            color: #9ca3af;
        }

        /* ── Document Title Row ── */
        .title-row {
            margin: 18px 0 6px 0;
        }

        .title-row-table {
            width: 100%;
            border-collapse: collapse;
        }

        .doc-title {
            font-size: 14pt;
            font-weight: bold;
            color: #111827;
            border-bottom: 2px solid #1a56db;
            padding-bottom: 4px;
            display: inline-block;
        }

        .doc-number-right {
            text-align: right;
            vertical-align: bottom;
            font-size: 8pt;
            color: #6b7280;
        }

        /* ── Salutation ── */
        .salutation {
            font-size: 11pt;
            font-weight: bold;
            margin: 18px 0 12px 0;
        }

        /* ── Body Content ── */
        .body-content {
            font-size: 11pt;
            line-height: 1.75;
            margin-bottom: 20px;
        }

        /* ── Photo + Thumbmark Row ── */
        .id-row {
            margin: 18px 0;
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
            border: 1px solid #d1d5db;
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
            color: #9ca3af;
            text-align: center;
            margin-top: 2px;
        }

        .thumbmark-cell {
            width: 120px;
            vertical-align: top;
            text-align: right;
        }

        .thumbmark-box {
            width: 80px;
            height: 80px;
            border: 1px solid #d1d5db;
            margin-left: auto;
        }

        .thumbmark-label {
            font-size: 7pt;
            color: #9ca3af;
            text-align: right;
            margin-top: 2px;
        }

        /* ── Details Block ── */
        .details-block {
            margin: 20px 0;
            font-size: 9pt;
            color: #4b5563;
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
            margin: 18px 0;
            font-size: 11pt;
            color: #374151;
        }

        /* ── Signature Block ── */
        .signature-block {
            margin-top: 48px;
        }

        .sig-table {
            width: 100%;
            border-collapse: collapse;
        }

        .sig-cell {
            width: 50%;
            vertical-align: bottom;
            padding: 0 20px;
        }

        .sig-left {
            text-align: left;
        }

        .sig-right {
            text-align: right;
        }

        .sig-name {
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #374151;
            padding-bottom: 3px;
            display: inline-block;
            min-width: 200px;
            text-align: center;
        }

        .sig-position {
            font-size: 9pt;
            color: #6b7280;
            text-align: center;
            margin-top: 3px;
        }

        /* ── Validity ── */
        .validity-text {
            font-size: 8pt;
            color: #9ca3af;
            margin-top: 12px;
        }

        .not-valid {
            font-size: 8pt;
            font-weight: bold;
            color: #dc2626;
            margin-top: 4px;
        }

        /* ── Footer ── */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #e5e7eb;
            padding: 6px 18mm 0 18mm;
            font-size: 7pt;
            color: #9ca3af;
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

    {{-- ── BLUE TOP BAR ── --}}
    <div class="top-bar"></div>

    <div class="content-wrap">

        {{-- ── HEADER ── --}}
        <div class="header">
            <table class="header-table">
                <tr>
                    @if($sealDataUri)
                    <td class="seal-cell">
                        <img src="{{ $sealDataUri }}" class="seal-img" alt="Barangay Seal">
                    </td>
                    @endif
                    <td class="header-text">
                        <div class="republic-text">Republic of the Philippines</div>
                        <div class="province-text">Province of {{ $barangay->province ?? '________________' }}</div>
                        <div class="municipality-text">{{ $barangay->city_municipality ?? '________________' }}</div>
                        <div class="barangay-name">Barangay {{ $barangay->name ?? '________________' }}</div>
                        <div class="office-text">Office of the Punong Barangay</div>
                    </td>
                </tr>
            </table>
        </div>

        {{-- ── TITLE ROW ── --}}
        <div class="title-row">
            <table class="title-row-table">
                <tr>
                    <td>
                        <span class="doc-title">{{ $template->title ?? $template->name }}</span>
                    </td>
                    @if($settings['show_doc_no'] ?? false)
                    <td class="doc-number-right">
                        Control No.: {{ $document->document_number }}
                    </td>
                    @endif
                </tr>
            </table>
        </div>

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
                    <td class="sig-cell sig-left">
                        <div class="sig-name">{{ $document->approved_by_left ?? $approvalConfig['left']['label'] ?? '' }}</div>
                        <div class="sig-position">{{ $approvalConfig['left']['position'] ?? '' }}</div>
                    </td>
                    @endif
                    @if(!empty($approvalConfig['right']))
                    <td class="sig-cell sig-right">
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

    </div>{{-- end content-wrap --}}

    {{-- ── FOOTER ── --}}
    <div class="footer">
        <table class="footer-table">
            <tr>
                <td class="footer-left">
                    Prepared by: {{ $issuedByName }}<br>
                    Date: {{ $issuedAt }}
                </td>
                <td class="footer-center">
                    @if($document->blockchain_hash)
                    <span style="font-size: 6pt;">Hash: {{ substr($document->blockchain_hash, 0, 16) }}...</span>
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
