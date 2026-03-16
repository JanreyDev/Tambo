<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $template->title ?? 'Barangay ID' }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @page {
            margin: 0;
        }

        body {
            font-family: sans-serif;
            font-size: 7pt;
            color: #1a1a1a;
            background: #fff;
            width: 242.64pt;
            height: 153.07pt;
            overflow: hidden;
        }

        .card {
            width: 242.64pt;
            height: 153.07pt;
            position: relative;
            background: #fff;
            border: 1.5pt solid #1a3a6e;
        }

        /* ── Top header band ── */
        .header-band {
            background: #1a3a6e;
            color: #fff;
            padding: 3pt 5pt;
            display: flex;
            align-items: center;
            gap: 4pt;
            height: 28pt;
        }

        .seal-wrap {
            width: 20pt;
            height: 20pt;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .seal-img {
            width: 20pt;
            height: 20pt;
            border-radius: 50%;
            background: rgba(255,255,255,0.15);
        }

        .header-text {
            flex: 1;
            text-align: center;
            line-height: 1.2;
        }

        .republic-label {
            font-size: 5pt;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            opacity: 0.85;
        }

        .barangay-name {
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3pt;
        }

        .location-text {
            font-size: 5pt;
            opacity: 0.85;
        }

        .id-type-label {
            font-size: 5.5pt;
            font-weight: bold;
            text-align: center;
            background: #f59e0b;
            color: #1a1a1a;
            padding: 1.5pt 4pt;
            letter-spacing: 0.5pt;
            text-transform: uppercase;
        }

        /* ── Body ── */
        .body {
            display: flex;
            padding: 4pt 5pt;
            gap: 5pt;
            height: 100pt;
        }

        /* Left: photo + thumbmark */
        .photo-col {
            width: 44pt;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3pt;
        }

        .photo-frame {
            width: 40pt;
            height: 44pt;
            border: 1pt solid #1a3a6e;
            background: #f0f4ff;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .photo-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .photo-placeholder {
            font-size: 5pt;
            color: #999;
            text-align: center;
            padding: 2pt;
        }

        .thumb-label {
            font-size: 5pt;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.3pt;
        }

        .thumb-box {
            width: 30pt;
            height: 20pt;
            border: 0.75pt solid #aaa;
            background: #fafafa;
        }

        /* Right: details */
        .details-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2.5pt;
        }

        .name-row {
            border-bottom: 0.75pt solid #1a3a6e;
            padding-bottom: 2pt;
        }

        .name-label {
            font-size: 5pt;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.3pt;
        }

        .name-value {
            font-size: 9pt;
            font-weight: bold;
            color: #1a3a6e;
            line-height: 1.1;
            text-transform: uppercase;
        }

        .field-row {
            display: flex;
            gap: 6pt;
        }

        .field {
            flex: 1;
        }

        .field-label {
            font-size: 4.5pt;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.2pt;
        }

        .field-value {
            font-size: 6.5pt;
            color: #1a1a1a;
            font-weight: 600;
            border-bottom: 0.5pt solid #ddd;
            padding-bottom: 1pt;
            min-height: 8pt;
        }

        .address-block .field-value {
            font-size: 5.5pt;
            font-weight: 500;
        }

        /* ── Bottom footer band ── */
        .footer-band {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 24pt;
            background: #f8fafc;
            border-top: 0.75pt solid #e2e8f0;
            display: flex;
            align-items: center;
            padding: 3pt 5pt;
            gap: 4pt;
        }

        .validity-block {
            flex: 1;
            line-height: 1.2;
        }

        .validity-label {
            font-size: 4.5pt;
            color: #888;
            text-transform: uppercase;
        }

        .validity-dates {
            font-size: 5.5pt;
            font-weight: 600;
            color: #1a1a1a;
        }

        .doc-number {
            font-size: 4.5pt;
            color: #aaa;
            text-align: center;
        }

        .qr-block {
            width: 22pt;
            height: 22pt;
            flex-shrink: 0;
        }

        .qr-img {
            width: 22pt;
            height: 22pt;
        }

        .sig-block {
            flex: 1;
            text-align: center;
            line-height: 1.2;
        }

        .sig-line {
            border-top: 0.75pt solid #1a3a6e;
            margin-bottom: 1.5pt;
            margin-top: 8pt;
        }

        .sig-label {
            font-size: 4.5pt;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 0.2pt;
        }
    </style>
</head>
<body>
<div class="card">

    {{-- ── Header band ── --}}
    <div class="header-band">
        <div class="seal-wrap">
            @if($sealDataUri)
                <img src="{{ $sealDataUri }}" class="seal-img" alt="Seal">
            @else
                <div class="seal-img"></div>
            @endif
        </div>
        <div class="header-text">
            <div class="republic-label">Republic of the Philippines</div>
            <div class="barangay-name">Barangay {{ $barangay->name }}</div>
            <div class="location-text">{{ $barangay->city_municipality }}{{ $barangay->province ? ', '.$barangay->province : '' }}</div>
        </div>
        <div class="seal-wrap">
            {{-- Mirror seal for balance --}}
            @if($sealDataUri)
                <img src="{{ $sealDataUri }}" class="seal-img" alt="Seal">
            @else
                <div class="seal-img"></div>
            @endif
        </div>
    </div>

    {{-- ── ID type label ── --}}
    <div class="id-type-label">{{ $template->title ?? 'Barangay Identification Card' }}</div>

    {{-- ── Body ── --}}
    <div class="body">

        {{-- Photo column --}}
        <div class="photo-col">
            <div class="photo-frame">
                @if($photoDataUri && ($settings['show_photo'] ?? false))
                    <img src="{{ $photoDataUri }}" class="photo-img" alt="Photo">
                @else
                    <div class="photo-placeholder">2x2<br>PHOTO</div>
                @endif
            </div>
            @if($settings['show_thumbmark'] ?? false)
                <div class="thumb-label">Thumbmark</div>
                <div class="thumb-box"></div>
            @endif
        </div>

        {{-- Details column --}}
        <div class="details-col">
            <div class="name-row">
                <div class="name-label">Name</div>
                <div class="name-value">{{ $document->constituent_name }}</div>
            </div>

            <div class="field-row">
                <div class="field">
                    <div class="field-label">Date of Birth</div>
                    <div class="field-value">{{ $mergeValues['date_of_birth'] ?? '—' }}</div>
                </div>
                <div class="field">
                    <div class="field-label">Sex</div>
                    <div class="field-value">{{ $mergeValues['sex'] ?? '—' }}</div>
                </div>
                <div class="field">
                    <div class="field-label">Blood Type</div>
                    <div class="field-value">{{ $mergeValues['blood_type'] ?? '—' }}</div>
                </div>
            </div>

            <div class="field address-block">
                <div class="field-label">Address</div>
                <div class="field-value">{{ $mergeValues['address'] ?? '—' }}</div>
            </div>

            <div class="field-row">
                <div class="field">
                    <div class="field-label">Emergency Contact</div>
                    <div class="field-value">{{ $mergeValues['emergency_contact'] ?? '—' }}</div>
                </div>
                <div class="field">
                    <div class="field-label">Contact No.</div>
                    <div class="field-value">{{ $mergeValues['emergency_number'] ?? $mergeValues['contact_number'] ?? '—' }}</div>
                </div>
            </div>
        </div>

    </div>

    {{-- ── Footer band ── --}}
    <div class="footer-band">
        <div class="validity-block">
            <div class="validity-label">Valid From / Until</div>
            <div class="validity-dates">
                {{ \Carbon\Carbon::parse($document->issued_date)->format('M d, Y') }}
                &nbsp;–&nbsp;
                {{ $document->valid_until ? \Carbon\Carbon::parse($document->valid_until)->format('M d, Y') : 'N/A' }}
            </div>
            <div class="doc-number">No. {{ $document->document_number }}</div>
        </div>

        <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-label">{{ $approvalConfig['right']['label'] ?? 'Punong Barangay' }}</div>
        </div>

        @if(($settings['show_qr'] ?? false) && $qrDataUri)
            <div class="qr-block">
                <img src="{{ $qrDataUri }}" class="qr-img" alt="QR">
            </div>
        @endif
    </div>

</div>
</body>
</html>
