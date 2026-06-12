<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Admin\Barangay;
use App\Models\Admin\File;
use App\Models\Tenant\Documents\DocumentTemplate;
use App\Models\Tenant\Documents\IssuedDocument;
use App\Models\Tenant\Records\Establishment;
use App\Models\Tenant\Records\LotBuilding;
use App\Models\Tenant\Resident;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentPdfService
{
    /**
     * Generate a case document PDF (KP, VAWC, Blotter), store it, and update the IssuedDocument.
     * Unlike generateAndStore(), this does NOT require a DocumentTemplate — it uses custom_field_values.
     */
    public function generateCaseDocumentAndStore(
        IssuedDocument $document,
        Barangay $barangay,
        ?User $issuedBy = null,
    ): void {
        $fields = $document->custom_field_values ?? [];

        // Phase 1: generate without hash
        $pdfBinary = $this->buildCasePdfBinary($document, $barangay, $fields, $issuedBy);

        // Compute hash + QR
        $hash = $this->computeHash($document, $pdfBinary);
        $qrUrl = $this->buildQrUrl($hash);
        $document->update(['blockchain_hash' => $hash, 'qr_code_url' => $qrUrl]);

        // Phase 2: re-generate with hash in footer, store
        $finalBinary = $this->buildCasePdfBinary($document->fresh(), $barangay, $fields, $issuedBy);
        $file = $this->storePdf($finalBinary, $document, $barangay);
        $document->update(['pdf_file_id' => $file->id]);
    }

    /**
     * Internal: render the pdf.case-document Blade view to PDF binary.
     */
    private function buildCasePdfBinary(
        IssuedDocument $document,
        Barangay $barangay,
        array $fields,
        ?User $issuedBy,
    ): string {
        $sealDataUri = $this->getSealDataUri($barangay);
        $qrDataUri = $document->qr_code_url
            ? $this->generateQrSvgDataUri($document->qr_code_url)
            : null;

        $issuedByName = $issuedBy
            ? trim(($issuedBy->first_name ?? '').' '.($issuedBy->last_name ?? '')) ?: $issuedBy->username
            : 'System';

        $data = [
            'document' => $document,
            'barangay' => $barangay,
            'fields' => $fields,
            'sealDataUri' => $sealDataUri,
            'qrDataUri' => $qrDataUri,
            'issuedByName' => $issuedByName,
            'issuedAt' => now()->setTimezone('Asia/Manila')->format('F d, Y h:i A'),
            'caseType' => $document->constituent_type,  // 'kp_case' | 'vawc_case' | 'blotter'
            'documentTitle' => $document->template_name,
            'isConfidential' => (bool) ($fields['is_confidential'] ?? false),
        ];

        return Pdf::loadView('pdf.case-document', $data)
            ->setPaper('letter', 'portrait')
            ->setOptions([
                'defaultFont' => 'sans-serif',
                'dpi' => 150,
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => false,
            ])
            ->output();
    }

    /**
     * Generate a certificate PDF, store it, and return the File model.
     */
    public function generateAndStore(
        IssuedDocument $document,
        DocumentTemplate $template,
        Barangay $barangay,
        ?Resident $resident = null,
        ?Establishment $establishment = null,
        ?LotBuilding $lotBuilding = null,
        ?User $issuedBy = null,
    ): File {
        $pdfBinary = $this->generate($document, $template, $barangay, $resident, $establishment, $lotBuilding, $issuedBy);

        return $this->storePdf($pdfBinary, $document, $barangay);
    }

    /**
     * Generate the raw PDF binary for a certificate.
     */
    public function generate(
        IssuedDocument $document,
        DocumentTemplate $template,
        Barangay $barangay,
        ?Resident $resident = null,
        ?Establishment $establishment = null,
        ?LotBuilding $lotBuilding = null,
        ?User $issuedBy = null,
    ): string {
        $data = $this->buildViewData($document, $template, $barangay, $resident, $establishment, $lotBuilding, $issuedBy);

        // ID card categories use a compact horizontal card layout (CR80 dimensions)
        $idCardCategories = ['barangay_id', 'family_id', 'staff_id'];

        if (in_array($template->category, $idCardCategories)) {
            // CR80 card: 85.6mm × 54mm → 242.64pt × 153.07pt (1mm = 2.8346pt)
            $pdf = Pdf::loadView('pdf.id-card', $data)
                ->setPaper([0, 0, 242.64, 153.07])
                ->setOptions([
                    'defaultFont' => 'sans-serif',
                    'dpi' => 200,
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled' => false,
                ]);
        } else {
            $customConfigKey = match ($template->constituent_type) {
                'establishment' => 'customized_establishment_certificates',
                'lot_building' => 'customized_lot_building_certificates',
                default => 'customized_resident_certificates',
            };
            $customConfigs = $barangay->settings[$customConfigKey] ?? [];
            $customConfig = collect($customConfigs)->firstWhere('id', $template->id);
            $customSettings = $customConfig['design_settings'] ?? null;
            $useGlobalDesign = $customConfig
                ? ($customConfig['isGlobal'] ?? $customSettings['use_global_design'] ?? true)
                : true;

            $layout = $useGlobalDesign
                ? ($barangay->settings['document_layout'] ?? 'klasiko')
                : ($customSettings['document_layout'] ?? 'klasiko');

            $view = "pdf.certificate-{$layout}";
            if (! view()->exists($view)) {
                $view = 'pdf.certificate-klasiko';
            }

            // Resolve paper size from template settings
            // short_bond = Letter (8.5×11"), long_bond = Legal (8.5×13"), a4 = ISO A4
            $paperSizeMap = [
                'short_bond' => 'letter',
                'long_bond' => 'legal',
                'a4' => 'a4',
                'letter' => 'letter',
                'legal' => 'legal',
            ];
            $paperSetting = $useGlobalDesign
                ? ($barangay->settings['document_paper_size'] ?? $template->settings['paper_size'] ?? 'short_bond')
                : ($customSettings['document_paper_size'] ?? $template->settings['paper_size'] ?? 'short_bond');
            $domPdfPaper = $paperSizeMap[$paperSetting] ?? 'letter';

            $pdf = Pdf::loadView($view, $data)
                ->setPaper($domPdfPaper, 'portrait')
                ->setOptions([
                    'defaultFont' => 'sans-serif',
                    'dpi' => 150,
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled' => false,
                ]);
        }

        return $pdf->output();
    }

    /**
     * Compute the SHA-256 blockchain hash for a document.
     */
    public function computeHash(IssuedDocument $document, string $pdfBinary): string
    {
        $payload = json_encode([
            'document_id' => $document->id,
            'document_number' => $document->document_number,
            'template_id' => $document->template_id,
            'constituent_id' => $document->constituent_id,
            'constituent_name' => $document->constituent_name,
            'issued_date' => $document->issued_date?->toDateString(),
            'barangay_id' => $document->barangay_id,
            'pdf_sha256' => hash('sha256', $pdfBinary),
        ], JSON_THROW_ON_ERROR);

        return hash('sha256', $payload);
    }

    /**
     * Build the verification QR code URL.
     */
    public function buildQrUrl(string $hash): string
    {
        return 'https://verify.barangay.org.ph/'.substr($hash, 0, 16);
    }

    /**
     * Assemble all view data for the certificate Blade template.
     */
    private function buildViewData(
        IssuedDocument $document,
        DocumentTemplate $template,
        Barangay $barangay,
        ?Resident $resident,
        ?Establishment $establishment,
        ?LotBuilding $lotBuilding,
        ?User $issuedBy,
    ): array {
        // Merge field values from resident + custom inputs
        $mergeValues = $this->resolveMergeFields($template, $resident, $establishment, $lotBuilding, $document);

        // Replace merge fields in content
        $renderedContent = $this->renderContent($template->content ?? '', $mergeValues);
        $renderedSalutation = $this->renderContent($template->salutation ?? '', $mergeValues);

        // Photo as base64 data URI
        $photoDataUri = null;
        if ($resident && ($template->settings['show_photo'] ?? false)) {
            $photoDataUri = $this->getPhotoDataUri($resident);
        }

        // Barangay seal as base64
        $sealDataUri = $this->getSealDataUri($barangay);

        // Issued by name
        $issuedByName = $issuedBy
            ? trim(($issuedBy->first_name ?? '').' '.($issuedBy->last_name ?? ''))
                ?: $issuedBy->username
            : 'System';

        // QR code as base64 SVG data URI
        $qrDataUri = null;
        if (($template->settings['show_qr'] ?? false) && $document->qr_code_url) {
            $qrDataUri = $this->generateQrSvgDataUri($document->qr_code_url);
        }

        // Color mapping from frontend themes
        $themeMap = [
            'plain' =>            ['primary' => '#1f2937', 'accent' => '#6b7280', 'tint' => '#f3f4f6'],
            'blue' =>             ['primary' => '#1e40af', 'accent' => '#3b82f6', 'tint' => '#dbeafe'],
            'red' =>              ['primary' => '#991b1b', 'accent' => '#ef4444', 'tint' => '#fee2e2'],
            'green' =>            ['primary' => '#15803d', 'accent' => '#22c55e', 'tint' => '#dcfce7'],
            'yellow' =>           ['primary' => '#a16207', 'accent' => '#eab308', 'tint' => '#fef3c7'],
            'combo-flag' =>       ['primary' => '#1e40af', 'accent' => '#991b1b', 'tint' => '#fef3c7'],
            'combo-festive' =>    ['primary' => '#991b1b', 'accent' => '#eab308', 'tint' => '#fef3c7'],
            'combo-earth' =>      ['primary' => '#15803d', 'accent' => '#1e40af', 'tint' => '#dcfce7'],
            'combo-gov' =>        ['primary' => '#1e3a8a', 'accent' => '#92400e', 'tint' => '#fef3c7'],
            'combo-bayanihan' =>  ['primary' => '#991b1b', 'accent' => '#1e40af', 'tint' => '#fee2e2'],
            'combo-sunrise' =>    ['primary' => '#a16207', 'accent' => '#991b1b', 'tint' => '#fef3c7'],
            'combo-coastal' =>    ['primary' => '#1e40af', 'accent' => '#15803d', 'tint' => '#dbeafe'],
            'combo-heritage' =>   ['primary' => '#991b1b', 'accent' => '#15803d', 'tint' => '#fee2e2'],
        ];

        $customConfigKey = match ($template->constituent_type) {
            'establishment' => 'customized_establishment_certificates',
            'lot_building' => 'customized_lot_building_certificates',
            default => 'customized_resident_certificates',
        };
        $customConfigs = $barangay->settings[$customConfigKey] ?? [];
        $customConfig = collect($customConfigs)->firstWhere('id', $template->id);
        $customSettings = $customConfig['design_settings'] ?? null;

        $useGlobalDesign = $customConfig
            ? ($customConfig['isGlobal'] ?? $customSettings['use_global_design'] ?? true)
            : true;

        $colorThemeStr = $useGlobalDesign
            ? ($barangay->settings['document_color_theme'] ?? 'plain')
            : ($customSettings['document_color_theme'] ?? 'plain');

        $themeColors = $themeMap[$colorThemeStr] ?? $themeMap['plain'];

        // Font mapping from frontend themes
        $fontMap = [
            'times' => '"Times New Roman", Times, serif',
            'arial' => 'Arial, Helvetica, sans-serif',
            'inter' => 'system-ui, sans-serif',
            'poppins' => 'system-ui, sans-serif',
            'merriweather' => 'Georgia, serif',
            'playfair' => 'Georgia, serif',
        ];

        $fontStr = $useGlobalDesign
            ? ($barangay->settings['document_font'] ?? 'times')
            : ($customSettings['document_font'] ?? 'times');

        $fontFamily = $fontMap[$fontStr] ?? $fontMap['times'];

        $designPattern = $useGlobalDesign
            ? ($barangay->settings['document_design_pattern'] ?? 'wave')
            : ($customSettings['document_design_pattern'] ?? 'wave');

        // Position label map (matches frontend POSITION_OPTIONS)
        $positionLabels = [
            'kapitan' => 'Punong Barangay',
            'kagawad' => 'Kagawad',
            'sk_chairperson' => 'SK Chairperson',
            'secretary' => 'Barangay Secretary',
            'treasurer' => 'Barangay Treasurer',
        ];

        // Fetch officials
        $officials = \App\Models\Tenant\Officials\BarangayOfficial::with('resident')
            ->where('barangay_id', $barangay->id)
            ->where('status', 'active')
            ->orderBy('sort_order')
            ->get()
            ->filter(function ($official) {
                // Filter out officials without a linked resident to avoid printing "HON. ____"
                return !empty($official->resident);
            })
            ->map(function ($official) use ($positionLabels) {
                $parts = array_filter([
                    $official->resident->first_name ?? '',
                    $official->resident->middle_name ?? '',
                    $official->resident->last_name ?? '',
                    $official->resident->extension_name ?? '',
                ]);
                $residentName = implode(' ', $parts);
                
                return (object) [
                    'name' => $residentName,
                    'position' => $positionLabels[$official->position] ?? ucwords(str_replace('_', ' ', $official->position)),
                ];
            })->values();

        return [
            'document' => $document,
            'template' => $template,
            'barangay' => $barangay,
            'resident' => $resident,
            'renderedContent' => $renderedContent,
            'renderedSalutation' => $renderedSalutation,
            'mergeValues' => $mergeValues,   // exposed for id-card.blade.php direct access
            'photoDataUri' => $photoDataUri,
            'sealDataUri' => $sealDataUri,
            'municipalityLogoUrl' => $this->getImageDataUri($barangay->municipality_logo_url),
            'qrDataUri' => $qrDataUri,
            'issuedByName' => $issuedByName,
            'issuedAt' => now()->setTimezone('Asia/Manila')->format('F d, Y'),
            'settings' => $template->settings ?? [],
            'approvalConfig' => $template->approval_config ?? [],
            // Design injection
            'themePrimary' => $themeColors['primary'],
            'themeAccent' => $themeColors['accent'],
            'themeTint' => $themeColors['tint'],
            'fontFamily' => $fontFamily,
            'designPattern' => $designPattern,
            'officials' => $officials,
        ];
    }

    /**
     * Resolve all merge field values from resident data + custom input values.
     */
    private function resolveMergeFields(
        DocumentTemplate $template,
        ?Resident $resident,
        ?Establishment $establishment,
        ?LotBuilding $lotBuilding,
        IssuedDocument $document,
    ): array
    {
        $values = [];

        if ($resident) {
            $values['full_name'] = $resident->full_name;
            $values['first_name'] = $resident->first_name ?? '';
            $values['middle_name'] = $resident->middle_name ?? '';
            $values['last_name'] = $resident->last_name ?? '';
            $values['extension_name'] = $resident->extension_name ?? '';
            $values['age'] = $resident->date_of_birth ? (string) $resident->date_of_birth->age : '';
            $values['sex'] = ucfirst($resident->sex ?? '');
            $values['civil_status'] = ucfirst(str_replace('_', '-', $resident->civil_status?->value ?? ''));
            $values['date_of_birth'] = $resident->date_of_birth?->format('F d, Y') ?? '';
            $values['place_of_birth'] = $resident->place_of_birth ?? '';
            $values['citizenship'] = $resident->citizenship ?? 'Filipino';
            $values['religion'] = $resident->religion ?? '';
            $values['occupation'] = $resident->occupation ?? '';
            $values['monthly_income'] = $resident->monthly_income ?? '';
            $values['blood_type'] = $resident->blood_type ?? '';
            $values['emergency_contact'] = $resident->emergency_contact_name ?? '';
            $values['emergency_number'] = $resident->emergency_contact_phone ?? '';
            $values['contact_number'] = $resident->mobile_number ?? '';

            // Address — build with full barangay context
            $brgy = Barangay::find($resident->barangay_id);
            $addrParts = array_filter([
                $resident->house_block_lot,
                $resident->purok_sitio ? 'Purok/Sitio '.$resident->purok_sitio : null,
                $resident->street,
                $brgy ? 'Barangay '.$brgy->name : null,
                $brgy?->city_municipality,
                $brgy?->province,
            ]);
            $values['address'] = implode(', ', $addrParts);
        }

        if ($establishment) {
            $addressParts = array_filter([
                $establishment->purok,
                $establishment->street,
                $establishment->exact_address,
            ]);

            $values['business_name'] = $establishment->business_name ?? '';
            $values['business_type'] = $establishment->business_type ?? '';
            $values['nature_of_business'] = $establishment->business_type ?? '';
            $values['owner_name'] = $establishment->owner_name ?? '';
            $values['owner_contact'] = $establishment->owner_contact ?? '';
            $values['owner_address'] = $establishment->owner_address ?? '';
            $values['business_address'] = implode(', ', array_unique($addressParts));
            $values['establishment_number'] = $establishment->establishment_number ?? '';
            $values['permit_number'] = $establishment->permit_number ?? '';
            $values['prev_permit_no'] = $establishment->permit_number ?? '';
            $values['registration_number'] = $establishment->registration_number ?? '';
            $values['closure_date'] = $document->issued_date?->format('F d, Y') ?? '';
        }

        if ($lotBuilding) {
            $address = implode(', ', array_filter([$lotBuilding->purok, $lotBuilding->street, $lotBuilding->exact_address]));
            $values += [
                'owner_name' => $lotBuilding->owner_name ?? '',
                'owner_address' => $lotBuilding->owner_address ?? '',
                'lot_address' => $address,
                'property_address' => $address,
                'construction_address' => $address,
                'site_address' => $address,
                'lot_area' => $lotBuilding->size ?? '',
                'floor_area' => $lotBuilding->size ?? '',
                'tax_dec_no' => $lotBuilding->tax_declaration_number ?? '',
                'structure_type' => $lotBuilding->classification ?? '',
                'applicant_name' => $lotBuilding->owner_name ?? '',
                'lot_building_number' => $lotBuilding->lot_building_number ?? '',
            ];
        }

        // Merge custom field values from the issued document
        $customValues = $document->custom_field_values ?? [];
        foreach ($customValues as $key => $val) {
            $values[$key] = (string) $val;
        }

        // Purpose from the document itself
        $values['purpose'] = $document->purpose ?? '';

        return $values;
    }

    /**
     * Replace {{field_name}} placeholders with actual values.
     */
    private function renderContent(string $content, array $mergeValues): string
    {
        return preg_replace_callback('/\{\{(\w+)\}\}/', function ($matches) use ($mergeValues) {
            $key = $matches[1];

            return $mergeValues[$key] ?? $matches[0]; // Keep placeholder if no value
        }, $content);
    }

    /**
     * Store the generated PDF to disk and return the File model.
     */
    private function storePdf(string $pdfBinary, IssuedDocument $document, Barangay $barangay): File
    {
        $disk = config('app.env') === 'production' ? 'do_spaces' : 'public';
        $fileName = Str::slug($document->document_number).'-'.Str::slug($document->template_name ?? 'document').'.pdf';
        $storagePath = 'bcmp/'.$barangay->id.'/documents/'.$fileName;

        Storage::disk($disk)->put($storagePath, $pdfBinary);

        return File::create([
            'barangay_id' => $barangay->id,
            'original_name' => $fileName,
            'stored_name' => $fileName,
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen($pdfBinary),
            'storage_path' => $storagePath,
            'storage_bucket' => config("filesystems.disks.{$disk}.bucket", 'local'),
            'uploaded_by' => $document->created_by,
            'category' => 'document',
            'is_public' => false,
            'metadata' => [
                'disk' => $disk,
                'document_id' => $document->id,
                'document_number' => $document->document_number,
                'template_name' => $document->template_name,
            ],
        ]);
    }

    /**
     * Load resident photo as base64 data URI.
     */
    private function getPhotoDataUri(Resident $resident): ?string
    {
        if (! $resident->photoFile) {
            return null;
        }

        $file = $resident->photoFile;
        $disk = $file->metadata['disk'] ?? config('filesystems.default', 'public');

        try {
            $content = Storage::disk($disk)->get($file->storage_path);
            $mimeType = $file->mime_type ?? 'image/jpeg';

            return 'data:'.$mimeType.';base64,'.base64_encode($content);
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Load barangay seal/logo as base64 data URI.
     */
    private function getSealDataUri(Barangay $barangay): ?string
    {
        $sealUrl = $barangay->seal_url ?? $barangay->logo_url;
        return $this->getImageDataUri($sealUrl);
    }

    /**
     * Convert any image URL to a base64 data URI for DomPDF.
     */
    private function getImageDataUri(?string $imageUrl): ?string
    {
        // DomPDF requires the GD extension to process PNG images.
        // If it's not installed, we must return null to prevent a 500 crash.
        if (!extension_loaded('gd')) {
            return null;
        }

        if (! $imageUrl) {
            return null;
        }

        // Extract storage path from various URL formats:
        // "http://localhost:3001/storage/logos/abc.png" → "logos/abc.png"
        // "/storage/logos/abc.png" → "logos/abc.png"
        // "logos/abc.png" → "logos/abc.png"
        $storagePath = $imageUrl;
        if (preg_match('#/storage/(.+)$#', $imageUrl, $m)) {
            $storagePath = $m[1];
        }

        // Try 1: Load from Storage disk (public)
        try {
            $disk = config('app.env') === 'production' ? 'do_spaces' : 'public';
            if (Storage::disk($disk)->exists($storagePath)) {
                $content = Storage::disk($disk)->get($storagePath);
                $mime = $this->guessMimeType($storagePath);
                return "data:{$mime};base64," . base64_encode($content);
            }
        } catch (\Throwable) {
            // Fall through
        }

        // Try 2: Load directly from public_path/storage (symlinked)
        try {
            $localPath = public_path('storage/' . $storagePath);
            if (file_exists($localPath)) {
                $content = file_get_contents($localPath);
                $mime = $this->guessMimeType($storagePath);
                return "data:{$mime};base64," . base64_encode($content);
            }
        } catch (\Throwable) {
            // Fall through
        }

        // Try 3: Load from the full URL path on public_path
        try {
            $localPath = public_path(ltrim(parse_url($imageUrl, PHP_URL_PATH) ?: '', '/'));
            if (file_exists($localPath)) {
                $content = file_get_contents($localPath);
                $mime = $this->guessMimeType($imageUrl);
                return "data:{$mime};base64," . base64_encode($content);
            }
        } catch (\Throwable) {
            // Fall through
        }

        return null;
    }

    private function guessMimeType(string $path): string
    {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        return match ($ext) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'webp' => 'image/webp',
            default => 'image/png',
        };
    }

    /**
     * Generate a real scannable QR code as an SVG base64 data URI.
     * Uses chillerlan/php-qrcode (already required in composer.json).
     * ECC level M — 15% error correction, good balance for printed certificates.
     */
    private function generateQrSvgDataUri(string $url): string
    {
        try {
            $options = new QROptions([
                'outputType' => QRCode::OUTPUT_MARKUP_SVG,
                'eccLevel' => QRCode::ECC_M,
                'addQuietzone' => true,
                'quietzoneSize' => 4,
                'imageBase64' => true,
            ]);

            return (new QRCode($options))->render($url);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('QR code generation failed, using placeholder', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);

            // Fallback: visually indicate failure — won't block PDF generation
            $svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="80" height="80">'
                .'<rect width="100" height="100" fill="white" stroke="#ccc" stroke-width="1"/>'
                .'<text x="50" y="48" text-anchor="middle" font-size="7" fill="#999">QR UNAVAILABLE</text>'
                .'</svg>';

            return 'data:image/svg+xml;base64,'.base64_encode($svg);
        }
    }
}
