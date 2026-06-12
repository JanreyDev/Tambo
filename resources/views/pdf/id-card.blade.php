<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $template->title ?? 'Barangay ID' }}</title>
    <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; }
        body {
            font-family: sans-serif;
            font-size: 6pt;
            color: #1e293b;
            width: 242.64pt;
            height: 153.07pt;
            background: #fff;
        }

        .card {
            width: 242.64pt;
            height: 153.07pt;
            border-collapse: collapse;
            table-layout: fixed;
            background: #fff;
        }
        .card td { padding: 0; border: none; }

        .hdr td { background: #1a3a6e; color: #fff; vertical-align: middle; }
        .hdr img { width: 22pt; height: 22pt; }

        .band td {
            background: #f59e0b;
            text-align: center;
            font-size: 5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.8pt;
            color: #1a1a1a;
            line-height: 1;
        }

        .body-row > td { vertical-align: top; background: #fff; }

        .ftr td { background: #f8fafc; border-top: 0.5pt solid #e2e8f0; vertical-align: middle; }

        .fl { font-size: 4pt; color: #888; text-transform: uppercase; letter-spacing: 0.2pt; line-height: 1; }
        .fv { font-size: 5.5pt; font-weight: 600; border-bottom: 0.5pt solid #e5e7eb; padding-bottom: 1pt; line-height: 1.2; }
    </style>
</head>
<body>
<table class="card" cellpadding="0" cellspacing="0">

    {{-- ROW 1: HEADER (28pt) --}}
    <tr class="hdr" style="height: 28pt;">
        <td style="width: 30pt; text-align: center;">
            @if($sealDataUri)<img src="{{ $sealDataUri }}" alt="">@endif
        </td>
        <td style="text-align: center; line-height: 1.2;" colspan="2">
            <div style="font-size: 4.5pt; text-transform: uppercase; letter-spacing: 0.5pt; opacity: 0.85;">Republic of the Philippines</div>
            <div style="font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3pt;">Barangay {{ $barangay->name }}</div>
            <div style="font-size: 4.5pt; opacity: 0.85;">{{ $barangay->city_municipality }}{{ $barangay->province ? ', '.$barangay->province : '' }}</div>
        </td>
        <td style="width: 30pt; text-align: center;">
            @if($municipalityLogoUrl)<img src="{{ $municipalityLogoUrl }}" alt="">@elseif($sealDataUri)<img src="{{ $sealDataUri }}" alt="">@endif
        </td>
    </tr>

    {{-- ROW 2: BAND (7pt) --}}
    <tr class="band" style="height: 7pt;">
        <td colspan="4">{{ $template->title ?? 'BARANGAY IDENTIFICATION CARD' }}</td>
    </tr>

    {{-- ROW 3: BODY (94pt) --}}
    <tr class="body-row" style="height: 94pt;">
        {{-- Photo column --}}
        <td style="width: 56pt; vertical-align: top; text-align: center; padding: 4pt 2pt 3pt 4pt; border-right: 0.5pt solid #e2e8f0;">
            @if($photoDataUri && ($settings['show_photo'] ?? false))
                <img src="{{ $photoDataUri }}" alt="" style="width: 46pt; height: 52pt; border: 0.75pt solid #1a3a6e;">
            @else
                <div style="width: 46pt; height: 52pt; border: 0.75pt solid #1a3a6e; background: #f0f4ff; margin: 0 auto;">
                    <div style="font-size: 5pt; color: #aaa; padding-top: 18pt; text-align: center; line-height: 1.2;">2x2<br>PHOTO</div>
                </div>
            @endif
            @if($settings['show_thumbmark'] ?? false)
                <div style="font-size: 4pt; color: #888; text-transform: uppercase; margin-top: 2pt;">Thumbmark</div>
                <div style="width: 26pt; height: 14pt; border: 0.5pt solid #bbb; margin: 1pt auto 0;"></div>
            @endif
        </td>

        {{-- Details column --}}
        <td style="vertical-align: top; padding: 4pt 4pt 30pt 5pt;" colspan="3">
            {{-- Name --}}
            <div style="border-bottom: 0.75pt solid #1a3a6e; padding-bottom: 2pt; margin-bottom: 3pt;">
                <div class="fl">Name</div>
                <div style="font-size: 9pt; font-weight: bold; color: #1a3a6e; text-transform: uppercase; line-height: 1.1;">{{ $document->constituent_name }}</div>
            </div>

            {{-- DOB / Sex / Blood --}}
            <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="width: 45%; padding-right: 3pt; vertical-align: top;">
                        <div class="fl">Date of Birth</div>
                        <div class="fv">{{ $mergeValues['date_of_birth'] ?? '—' }}</div>
                    </td>
                    <td style="width: 25%; padding-right: 3pt; vertical-align: top;">
                        <div class="fl">Sex</div>
                        <div class="fv">{{ $mergeValues['sex'] ?? '—' }}</div>
                    </td>
                    <td style="width: 30%; vertical-align: top;">
                        <div class="fl">Blood Type</div>
                        <div class="fv">{{ $mergeValues['blood_type'] ?? '—' }}</div>
                    </td>
                </tr>
            </table>

            {{-- Address --}}
            <div style="margin-top: 3pt;">
                <div class="fl">Address</div>
                <div class="fv" style="font-size: 4.5pt; font-weight: 500; line-height: 1.15;">{{ $mergeValues['address'] ?? '—' }}</div>
            </div>

            {{-- Emergency --}}
            <table style="width: 100%; border-collapse: collapse; margin-top: 3pt;" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="width: 55%; padding-right: 3pt; vertical-align: top;">
                        <div class="fl">Emergency Contact</div>
                        <div class="fv">{{ $mergeValues['emergency_contact'] ?? '—' }}</div>
                    </td>
                    <td style="width: 45%; vertical-align: top;">
                        <div class="fl">Contact No.</div>
                        <div class="fv">{{ $mergeValues['emergency_number'] ?? $mergeValues['contact_number'] ?? '—' }}</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    {{-- ROW 4: FOOTER (24pt) --}}
    <tr class="ftr" style="height: 24pt;">
        <td colspan="2" style="padding-left: 5pt;">
            <div style="font-size: 4pt; color: #888; text-transform: uppercase;">Valid From / Until</div>
            <div style="font-size: 5pt; font-weight: 600; color: #0f172a;">
                {{ \Carbon\Carbon::parse($document->issued_date)->format('M d, Y') }}
                &nbsp;–&nbsp;
                {{ $document->valid_until ? \Carbon\Carbon::parse($document->valid_until)->format('M d, Y') : 'N/A' }}
            </div>
            <div style="font-size: 3.5pt; color: #aaa;">No. {{ $document->document_number }}</div>
        </td>
        <td style="text-align: center; vertical-align: bottom; padding-bottom: 3pt;">
            <div style="width: 70pt; border-top: 0.75pt solid #1a3a6e; margin: 0 auto 1pt;"></div>
            <div style="font-size: 4.5pt; font-weight: bold; color: #1a3a6e; text-transform: uppercase;">{{ $barangay->captain_name ?: '—' }}</div>
            <div style="font-size: 3.5pt; color: #555; text-transform: uppercase; letter-spacing: 0.2pt;">{{ $approvalConfig['right']['label'] ?? 'Punong Barangay' }}</div>
        </td>
        <td style="width: 26pt; text-align: center; vertical-align: middle;">
            @if(($settings['show_qr'] ?? false) && $qrDataUri)
                <img src="{{ $qrDataUri }}" style="width: 18pt; height: 18pt;">
            @endif
        </td>
    </tr>

</table>
</body>
</html>
