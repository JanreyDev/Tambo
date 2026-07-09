<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    @php
        // Reference width = the modal preview card width (max-w-lg 512px - p-5 40px = 472px).
        // We render the card at this exact px width so proportions are pixel-identical to the
        // on-screen preview, then scale the whole card down to the physical CR80 size (85.6×54mm).
        $cardW   = 472.0;
        $cardH   = $cardW * 54.0 / 85.6;      // keep CR80 aspect ratio
        $pxPerMm = 96.0 / 25.4;               // CSS px per mm at 96dpi
        $scale   = (85.6 * $pxPerMm) / $cardW; // shrink 472px card -> 85.6mm

        $isTambo = strtolower($barangay->name ?? '') === 'tambo';

        // ---- Shared field values (mirrors GenerateIdModal.tsx) ----
        $docNumber = $document->document_number ?? '';

        if ($resident) {
            $mi = $resident->middle_name ? ' '.strtoupper(substr($resident->middle_name, 0, 1)).'.' : '';
            $ext = $resident->extension_name ? ' '.$resident->extension_name : '';
            $tamboName = trim(($resident->first_name ?? '').$mi.' '.($resident->last_name ?? '').$ext);

            $genericName = implode(', ', array_filter([
                $resident->last_name ?? null,
                $resident->first_name ?? null,
                $resident->middle_name ? substr($resident->middle_name, 0, 1).'.' : null,
            ]));

            $streetAddress = implode(' ', array_filter([
                $resident->house_block_lot ?? null,
                $resident->purok ?? null,
                $resident->street ?? null,
            ])) ?: '—';

            $placeOfBirth = $resident->place_of_birth ?: '—';

            $dobLong = $resident->date_of_birth
                ? strtoupper($resident->date_of_birth->format('F j, Y'))
                : '—';
            $dobShort = $resident->date_of_birth
                ? $resident->date_of_birth->format('M d, Y')
                : '—';
            $sexVal = $resident->sex ? ucfirst($resident->sex) : '—';
            $bloodVal = $resident->blood_type ?: '—';
            $emergencyName = $resident->emergency_contact_name ?: '—';
            $emergencyNo = $resident->emergency_contact_phone ?: ($resident->mobile_number ?: '—');
        } else {
            $tamboName = $document->constituent_name ?? '—';
            $genericName = $document->constituent_name ?? '—';
            $streetAddress = $mergeValues['address'] ?? '—';
            $placeOfBirth = $mergeValues['place_of_birth'] ?? '—';
            $dobLong = strtoupper($mergeValues['date_of_birth'] ?? '—');
            $dobShort = $mergeValues['date_of_birth'] ?? '—';
            $sexVal = $mergeValues['sex'] ?? '—';
            $bloodVal = $mergeValues['blood_type'] ?? '—';
            $emergencyName = $mergeValues['emergency_contact'] ?? '—';
            $emergencyNo = $mergeValues['emergency_number'] ?? ($mergeValues['contact_number'] ?? '—');
        }

        $fullAddress = $mergeValues['address'] ?? $streetAddress;

        $issuedFmt = $document->issued_date
            ? \Carbon\Carbon::parse($document->issued_date)->format('M d, Y')
            : '—';
        $validFmt = $document->valid_until
            ? \Carbon\Carbon::parse($document->valid_until)->format('M d, Y')
            : '—';

        $signatoryLabel = $approvalConfig['right']['label'] ?? 'Punong Barangay';
        $captainName = $barangay->captain_name ?: '—';
        $genericCityProvince = implode(', ', array_filter([
            $barangay->city_municipality ?? null,
            $barangay->province ?? null,
        ]));
        $showPhoto = (bool) ($settings['show_photo'] ?? false);
        $shieldSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>';
    @endphp
    <style>
        @page { size: 85.6mm 54mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 85.6mm; height: 54mm; overflow: hidden; background: #fff; }
        .frame { position: relative; width: 85.6mm; height: 54mm; overflow: hidden; }
        .scaler {
            position: absolute; top: 0; left: 0;
            width: {{ $cardW }}px; height: {{ $cardH }}px;
            transform: scale({{ $scale }});
            transform-origin: top left;
        }
        img { display: block; }
        .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    </style>
</head>
<body>
<div class="frame">
  <div class="scaler">

@if($isTambo)
    {{-- ══════════════════ TAMBO CARD (mirrors IdCardPreview isTambo branch) ══════════════════ --}}
    <div style="width:100%;height:100%;border-radius:4px;overflow:hidden;border:2px solid #1a3a8c;box-shadow:0 4px 6px rgba(0,0,0,0.1);position:relative;display:flex;flex-direction:column;font-family:'Arial',sans-serif;background:#fff;">

      {{-- HEADER CONTAINER --}}
      <div style="position:relative;z-index:20;display:flex;flex-direction:column;justify-content:space-between;flex-shrink:0;height:33%;padding-top:1.5%;">

        {{-- Wave ribbons --}}
        <svg style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;" preserveAspectRatio="none" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M-10,45 C60,25 130,65 200,40 C270,15 340,55 410,35" stroke="#5ba3d9" stroke-width="20" fill="none" opacity="0.4" stroke-linecap="round"/>
          <path d="M-10,60 C70,40 140,75 210,52 C280,30 350,65 410,48" stroke="#3b8fd0" stroke-width="14" fill="none" opacity="0.5" stroke-linecap="round"/>
          <path d="M-10,72 C80,55 150,85 220,65 C290,45 360,75 410,60" stroke="#2b7cc4" stroke-width="10" fill="none" opacity="0.6" stroke-linecap="round"/>
        </svg>

        {{-- Upper: seals + text --}}
        <div style="display:flex;align-items:center;justify-content:space-between;padding-left:4%;padding-right:4%;height:65%;">
          {{-- Left seal --}}
          <div style="position:relative;z-index:10;flex-shrink:0;width:13%;aspect-ratio:1/1;border-radius:9999px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.95);">
            @if($sealDataUri)
              <img src="{{ $sealDataUri }}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:9999px;">
            @else
              {!! $shieldSvg !!}
            @endif
          </div>

          {{-- Header text --}}
          <div style="position:relative;z-index:10;flex:1;text-align:center;min-width:0;padding-left:4px;padding-right:4px;line-height:1.15;">
            <p style="font-size:5.5px;font-weight:600;color:#1a3a6e;text-transform:uppercase;letter-spacing:0.1px;margin:0;font-style:italic;">Republic of the Philippines</p>
            <p style="font-size:6px;font-weight:900;color:#0a1e5e;text-transform:uppercase;letter-spacing:0.2px;margin:0.5px 0 0;">NATIONAL CAPITAL REGION</p>
            <p style="font-size:5.5px;font-weight:500;color:#1a3a6e;text-transform:uppercase;letter-spacing:0.1px;margin:0.5px 0 0;">City/Municipality of PARAÑAQUE</p>
            <p style="font-size:9.5px;font-weight:900;color:#0a1050;letter-spacing:0.3px;margin:1px 0 0;">BARANGAY TAMBO</p>
          </div>

          {{-- Right seal --}}
          <div style="position:relative;z-index:10;flex-shrink:0;width:13%;aspect-ratio:1/1;border-radius:9999px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.95);">
            @if($municipalityLogoUrl)
              <img src="{{ $municipalityLogoUrl }}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:9999px;">
            @elseif($sealDataUri)
              <img src="{{ $sealDataUri }}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:9999px;">
            @else
              {!! $shieldSvg !!}
            @endif
          </div>
        </div>

        {{-- Lower: pill --}}
        <div style="position:relative;z-index:10;width:100%;display:flex;align-items:center;justify-content:center;padding-left:4%;padding-right:4%;padding-bottom:1.5%;height:28%;">
          <div style="width:100%;text-align:center;font-weight:900;text-transform:uppercase;color:#fff;display:flex;align-items:center;justify-content:center;border-radius:9999px;padding-top:4px;padding-bottom:4px;margin-top:20px;background:#0a1d56;font-size:9.5px;letter-spacing:2.5px;box-shadow:0 1.5px 3px rgba(0,0,0,0.25);">
            BARANGAY I.D.
          </div>
        </div>
      </div>

      {{-- BODY CONTAINER --}}
      <div style="display:flex;flex-direction:column;background:#fff;padding-left:4%;padding-right:4%;height:67%;padding-top:20px;padding-bottom:4px;">

        {{-- TOP ROW: photo + details --}}
        <div style="display:flex;width:100%;gap:8px;">
          {{-- Photo --}}
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-start;flex-shrink:0;padding:2px;background:#fff;width:32%;">
            <div style="width:100%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;border:2px solid #1a3a8c;border-radius:4px;">
              @if($photoDataUri && $showPhoto)
                <img src="{{ $photoDataUri }}" alt="" style="width:100%;height:100%;object-fit:cover;">
              @else
                <div style="color:#cbd5e1;text-align:center;font-weight:700;font-size:8px;line-height:1.2;">2x2<br>PHOTO</div>
              @endif
            </div>
          </div>

          {{-- Right column --}}
          <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-start;gap:4px;">
            {{-- ID NO row --}}
            <div style="display:flex;align-items:flex-start;gap:4px;padding-left:2px;flex-shrink:0;padding-top:2px;">
              <div style="background:#1a3a8c;color:#fff;font-weight:900;padding-left:4px;padding-right:4px;padding-top:1px;padding-bottom:1px;letter-spacing:0.1em;line-height:1;font-size:8.5px;">I.D. NO.</div>
              <span style="font-weight:900;color:#000;letter-spacing:0.1em;line-height:1;font-size:10.5px;">{{ $docNumber }}</span>
            </div>

            {{-- Details box --}}
            <div style="border:2px solid #1a3a8c;border-radius:8px;overflow:hidden;background:#fff;display:flex;flex-direction:column;justify-content:flex-start;gap:6px;padding:15px;flex:1;">
              {{-- NAME --}}
              <div style="display:flex;align-items:flex-end;width:100%;">
                <span style="font-weight:700;color:#000;flex-shrink:0;margin-right:4px;font-size:9px;">NAME:</span>
                <div class="truncate" style="flex:1;border-bottom:1px solid #000;color:#000;font-weight:700;font-style:italic;padding-left:2px;padding-bottom:0.5px;font-size:10.5px;line-height:1;">{{ $tamboName }}</div>
              </div>

              {{-- ADDRESS --}}
              <div style="display:flex;flex-direction:column;gap:3px;">
                <div style="display:flex;align-items:flex-end;width:100%;">
                  <span style="font-weight:700;color:#000;flex-shrink:0;margin-right:4px;font-size:9px;">ADDRESS:</span>
                  <div class="truncate" style="flex:1;border-bottom:1px solid #000;color:#000;font-weight:700;font-style:italic;padding-left:2px;padding-bottom:0.5px;font-size:9.5px;line-height:1;">{{ $streetAddress }}</div>
                </div>
                <div style="display:flex;align-items:flex-end;width:100%;padding-left:48px;">
                  <div class="truncate" style="flex:1;border-bottom:1px solid #000;color:#000;font-weight:700;font-style:italic;text-align:center;padding-bottom:0.5px;font-size:9.5px;line-height:1;">TAMBO, PARAÑAQUE CITY</div>
                </div>
              </div>

              {{-- PLACE OF BIRTH --}}
              <div style="display:flex;align-items:flex-end;width:100%;">
                <span style="font-weight:700;color:#000;flex-shrink:0;margin-right:4px;font-size:9px;">PLACE OF BIRTH:</span>
                <div class="truncate" style="flex:1;border-bottom:1px solid #000;color:#000;font-weight:700;font-style:italic;padding-left:2px;padding-bottom:0.5px;font-size:9.5px;line-height:1;">{{ $placeOfBirth }}</div>
              </div>

              {{-- DATE OF BIRTH --}}
              <div style="display:flex;align-items:flex-end;width:100%;">
                <span style="font-weight:700;color:#000;flex-shrink:0;margin-right:4px;font-size:9px;">DATE OF BIRTH:</span>
                <div class="truncate" style="flex:1;border-bottom:1px solid #000;color:#000;font-weight:700;font-style:italic;padding-left:2px;padding-bottom:0.5px;font-size:9.5px;line-height:1;">{{ $dobLong }}</div>
              </div>
            </div>
          </div>
        </div>

        {{-- BOTTOM ROW: signature --}}
        <div style="display:flex;width:100%;gap:8px;">
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-start;flex-shrink:0;padding-left:2px;padding-right:2px;width:32%;">
            <div style="width:100%;display:flex;flex-direction:column;align-items:center;margin-top:12px;padding-bottom:2px;">
              <div style="width:85%;border-bottom:1px solid #000;height:1px;"></div>
              <div style="color:#000;font-weight:500;font-size:6px;margin-top:2px;letter-spacing:0.2px;text-align:center;">Bearers Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>

@else
    {{-- ══════════════════ GENERIC CARD (mirrors IdCardPreview default branch) ══════════════════ --}}
    <div style="width:100%;height:100%;border-radius:8px;overflow:hidden;border:2px solid #1a3a6e;box-shadow:0 4px 6px rgba(0,0,0,0.1);font-family:sans-serif;display:flex;flex-direction:column;background:#fff;">

      {{-- Header band --}}
      <div style="display:flex;align-items:center;gap:8px;padding-left:12px;padding-right:12px;background:#1a3a6e;height:28%;">
        <div style="width:36px;height:36px;border-radius:9999px;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">
          @if($sealDataUri)
            <img src="{{ $sealDataUri }}" alt="" style="width:32px;height:32px;object-fit:contain;border-radius:9999px;">
          @endif
        </div>
        <div style="flex:1;text-align:center;min-width:0;">
          <p style="color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.1em;line-height:1;font-size:5px;">Republic of the Philippines</p>
          <p style="color:#fff;font-weight:700;text-transform:uppercase;letter-spacing:0.03em;line-height:1.1;font-size:11px;">Barangay {{ $barangay->name ?? '—' }}</p>
          <p style="color:rgba(255,255,255,0.7);line-height:1;font-size:5.5px;">{{ $genericCityProvince }}</p>
        </div>
        <div style="width:36px;height:36px;border-radius:9999px;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">
          @if($municipalityLogoUrl)
            <img src="{{ $municipalityLogoUrl }}" alt="" style="width:32px;height:32px;object-fit:contain;border-radius:9999px;">
          @elseif($sealDataUri)
            <img src="{{ $sealDataUri }}" alt="" style="width:32px;height:32px;object-fit:contain;border-radius:9999px;">
          @endif
        </div>
      </div>

      {{-- ID type label --}}
      <div style="text-align:center;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;line-height:1;padding-top:2px;padding-bottom:2px;background:#f59e0b;font-size:6px;color:#1a1a1a;">{{ $template->title ?? 'BARANGAY IDENTIFICATION CARD' }}</div>

      {{-- Body --}}
      <div style="display:flex;background:#fff;height:48%;color:#1e293b;">
        {{-- Photo column --}}
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:6px;gap:4px;flex-shrink:0;width:22%;border-right:0.5px solid #e5e7eb;">
          <div style="width:80%;aspect-ratio:40/44;border:1px solid #1a3a6e;background:#f8fafc;display:flex;align-items:center;justify-content:center;overflow:hidden;">
            @if($photoDataUri && $showPhoto)
              <img src="{{ $photoDataUri }}" alt="" style="width:100%;height:100%;object-fit:cover;">
            @else
              <p style="color:#cbd5e1;text-align:center;line-height:1.1;font-size:5px;">2×2<br>PHOTO</p>
            @endif
          </div>
        </div>

        {{-- Details column --}}
        <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-start;padding-left:8px;padding-right:8px;padding-top:6px;gap:2px;min-width:0;">
          <div style="border-bottom:0.75px solid #1a3a6e;padding-bottom:2px;margin-bottom:2px;">
            <p style="font-size:4.5px;color:#888;text-transform:uppercase;letter-spacing:0.2px;">Name</p>
            <p style="font-size:9.5px;font-weight:700;color:#1a3a6e;text-transform:uppercase;line-height:1.1;">{{ $genericName }}</p>
          </div>

          <div style="display:flex;gap:8px;">
            <div style="flex:1;">
              <p style="font-size:4.5px;color:#888;text-transform:uppercase;">Date of Birth</p>
              <p style="font-size:6px;font-weight:600;border-bottom:0.5px solid #e5e7eb;padding-bottom:1px;">{{ $dobShort }}</p>
            </div>
            <div style="width:22%;">
              <p style="font-size:4.5px;color:#888;text-transform:uppercase;">Sex</p>
              <p style="font-size:6px;font-weight:600;border-bottom:0.5px solid #e5e7eb;padding-bottom:1px;">{{ $sexVal }}</p>
            </div>
            <div style="width:22%;">
              <p style="font-size:4.5px;color:#888;text-transform:uppercase;">Blood Type</p>
              <p style="font-size:6px;font-weight:600;border-bottom:0.5px solid #e5e7eb;padding-bottom:1px;">{{ $bloodVal }}</p>
            </div>
          </div>

          <div>
            <p style="font-size:4.5px;color:#888;text-transform:uppercase;">Address</p>
            <p style="font-size:5.5px;font-weight:500;border-bottom:0.5px solid #e5e7eb;padding-bottom:1px;line-height:1.2;">{{ $fullAddress }}</p>
          </div>

          <div style="display:flex;gap:8px;">
            <div style="flex:1;">
              <p style="font-size:4.5px;color:#888;text-transform:uppercase;">Emergency Contact</p>
              <p style="font-size:5.5px;font-weight:500;border-bottom:0.5px solid #e5e7eb;padding-bottom:1px;">{{ $emergencyName }}</p>
            </div>
            <div style="width:38%;">
              <p style="font-size:4.5px;color:#888;text-transform:uppercase;">Contact No.</p>
              <p style="font-size:5.5px;font-weight:500;border-bottom:0.5px solid #e5e7eb;padding-bottom:1px;">{{ $emergencyNo }}</p>
            </div>
          </div>
        </div>
      </div>

      {{-- Footer band --}}
      <div style="display:flex;align-items:center;padding-left:12px;padding-right:12px;gap:12px;height:24%;background:#f8fafc;border-top:0.75px solid #e2e8f0;color:#1e293b;">
        <div style="flex:1;min-width:0;">
          <p style="font-size:4px;color:#888;text-transform:uppercase;">Valid From / Until</p>
          <p style="font-size:6px;font-weight:600;">{{ $issuedFmt }} &nbsp;–&nbsp; {{ $validFmt }}</p>
          <p style="font-size:4px;color:#aaa;">No. {{ $docNumber }}</p>
        </div>
        <div style="text-align:center;width:30%;flex-shrink:0;">
          <div style="border-top:0.75px solid #1a3a6e;margin-bottom:2px;margin-top:4px;"></div>
          <p style="font-size:5px;font-weight:700;color:#1a3a6e;text-transform:uppercase;line-height:1.1;">{{ $captainName }}</p>
          <p style="font-size:4.5px;color:#555;text-transform:uppercase;letter-spacing:0.2px;">{{ $signatoryLabel }}</p>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;border:1px solid #e2e8f0;background:#fff;border-radius:4px;width:24px;height:24px;flex-shrink:0;overflow:hidden;">
          @if(($settings['show_qr'] ?? false) && $qrDataUri)
            <img src="{{ $qrDataUri }}" alt="" style="width:22px;height:22px;">
          @else
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;opacity:0.2;">
              @for($i = 0; $i < 9; $i++)
                <div style="width:5px;height:5px;background:#0f172a;{{ $i % 3 === 1 ? 'opacity:0.3;' : '' }}"></div>
              @endfor
            </div>
          @endif
        </div>
      </div>
    </div>
@endif

  </div>
</div>
</body>
</html>
