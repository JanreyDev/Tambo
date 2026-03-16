<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $template->title ?? 'Certificate' }} — {{ $document->constituent_name }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @page {
            margin: 0 0 24mm 0;
        }

        body {
            font-family: sans-serif;
            font-size: 11pt;
            color: #1e293b;
            background: #fff;
            line-height: 1.65;
        }

        /* ── Dark header band ── */
        .header-band {
            background: #0f172a;
            padding: 16px 18mm;
            color: #fff;
        }

        .header-band-table {
            width: 100%;
            border-collapse: collapse;
        }

        .header-seal-cell {
            width: 56px;
            vertical-align: middle;
        }

        .header-seal-img {
            width: 48px;
            height: 48px;
            border: 2px solid #fff;
            border-radius: 50%;
        }

        .header-text-cell {
            vertical-align: middle;
            padding-left: 12px;
        }

        .header-republic {
            font-size: 7.5pt;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .header-municipality {
            font-size: 9pt;
            color: #cbd5e1;
        }

        .header-barangay {
            font-size: 15pt;
            font-weight: bold;
            color: #fff;
            margin-top: 2px;
        }

        .header-doc-number-cell {
            vertical-align: middle;
            text-align: right;
        }

        .header-doc-number {
            font-size: 8pt;
            color: #94a3b8;
            font-family: monospace;
        }

        /* ── Content area ── */
        .content-wrap {
            padding: 16px 18mm 0 18mm;
        }

        /* ── Title area ── */
        .title-area {
            margin-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }

        .doc-title {
            font-size: 16pt;
            font-weight: bold;
            color: #3b82f6;
            text-align: left;
        }

        .doc-hash {
            font-size: 8pt;
            font-family: monospace;
            color: #94a3b8;
            margin-top: 3px;
        }

        /* ── Salutation ── */
        .salutation {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 14px;
        }

        /* ── Body Content ── */
        .body-content {
            font-size: 11pt;
            line-height: 1.75;
            margin-bottom: 20px;
        }

        /* ── Photo + Thumbmark ── */
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
            border: 1px solid #cbd5e1;
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
            color: #94a3b8;
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
            border: 1px solid #cbd5e1;
            margin-left: auto;
        }

        .thumbmark-label {
            font-size: 7pt;
            color: #94a3b8;
            text-align: right;
            margin-top: 2px;
        }

        /* ── Details Block ── */
        .details-block {
            margin: 18px 0;
            font-size: 9pt;
            color: #475569;
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
        }

        /* ── Signature Block ── */
        .signature-block {
            margin-top: 48px;
            text-align: right;
        }

        .sig-wrap {
            display: inline-block;
            text-align: center;
        }

        /* Signature table: right-only or two-col */
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
            color: #0f172a;
            display: inline-block;
            min-width: 200px;
            text-align: center;
        }

        .sig-line {
            border-top: 1px solid #1e293b;
            margin-bottom: 3px;
        }

        .sig-position {
            font-size: 9pt;
            color: #64748b;
            text-align: center;
        }

        /* ── Validity ── */
        .validity-text {
            font-size: 8pt;
            color: #94a3b8;
            margin-top: 12px;
        }

        .not-valid {
            font-size: 8pt;
            font-weight: bold;
            color: #dc2626;
            margin-top: 4px;
        }

        /* ── Footer band ── */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 6px 18mm;
            font-size: 7pt;
            color: #94a3b8;
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
            font-family: monospace;
        }

        .footer-right {
            text-align: right;
            vertical-align: middle;
        }

        .qr-img {
            width: 55px;
            height: 55px;
        }
    </style>
</head>
<body>

    {{-- ── DARK HEADER BAND ── --}}
    <div class="header-band">
        <table class="header-band-table">
            <tr>
                @if($sealDataUri)
                <td class="header-seal-cell">
                    <img src="{{ $sealDataUri }}" class="header-seal-img" alt="Barangay Seal">
                </td>
                @endif
                <td class="header-text-cell">
                    <div class="header-republic">Republic of the Philippines &nbsp;&bull;&nbsp; {{ $barangay->province ?? '' }}</div>
                    <div class="header-municipality">{{ $barangay->city_municipality ?? '' }}</div>
                    <div class="header-barangay">Barangay {{ $barangay->name ?? '' }}</div>
                </td>
                @if($settings['show_doc_no'] ?? false)
                <td class="header-doc-number-cell">
                    <div class="header-doc-number">No. {{ $document->document_number }}</div>
                </td>
                @endif
            </tr>
        </table>
    </div>

    <div class="content-wrap">

        {{-- ── TITLE AREA ── --}}
        <div class="title-area">
            <div class="doc-title">{{ $template->title ?? $template->name }}</div>
            @if($document->blockchain_hash)
            <div class="doc-hash">SHA: {{ substr($document->blockchain_hash, 0, 16) }}...</div>
            @endif
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
                        <div class="sig-line"></div>
                        <div class="sig-position">{{ $approvalConfig['left']['position'] ?? '' }}</div>
                    </td>
                    @endif
                    @if(!empty($approvalConfig['right']))
                    <td class="sig-cell sig-right">
                        <div class="sig-name">{{ $document->approved_by_right ?? $approvalConfig['right']['label'] ?? '' }}</div>
                        <div class="sig-line"></div>
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

    {{-- ── FOOTER BAND ── --}}
    <div class="footer">
        <table class="footer-table">
            <tr>
                <td class="footer-left">
                    Prepared by: {{ $issuedByName }}<br>
                    Date: {{ $issuedAt }}
                </td>
                <td class="footer-center">
                    @if($document->blockchain_hash)
                    <span style="font-family: monospace; font-size: 6pt;">{{ substr($document->blockchain_hash, 0, 32) }}</span>
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
