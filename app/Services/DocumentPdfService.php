<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Admin\Barangay;
use App\Models\Admin\File;
use App\Models\Tenant\Documents\DocumentTemplate;
use App\Models\Tenant\Documents\IssuedDocument;
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
     * Generate a certificate PDF, store it, and return the File model.
     */
    public function generateAndStore(
        IssuedDocument $document,
        DocumentTemplate $template,
        Barangay $barangay,
        ?Resident $resident = null,
        ?User $issuedBy = null,
    ): File {
        $pdfBinary = $this->generate($document, $template, $barangay, $resident, $issuedBy);

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
        ?User $issuedBy = null,
    ): string {
        $data = $this->buildViewData($document, $template, $barangay, $resident, $issuedBy);

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
            $layout = $barangay->settings['document_layout'] ?? 'klasiko';
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
            ];
            $paperSetting = $template->settings['paper_size'] ?? 'short_bond';
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
        ?User $issuedBy,
    ): array {
        // Merge field values from resident + custom inputs
        $mergeValues = $this->resolveMergeFields($template, $resident, $document);

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
            'qrDataUri' => $qrDataUri,
            'issuedByName' => $issuedByName,
            'issuedAt' => now()->setTimezone('Asia/Manila')->format('F d, Y'),
            'settings' => $template->settings ?? [],
            'approvalConfig' => $template->approval_config ?? [],
        ];
    }

    /**
     * Resolve all merge field values from resident data + custom input values.
     */
    private function resolveMergeFields(DocumentTemplate $template, ?Resident $resident, IssuedDocument $document): array
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
            'storage_bucket' => $disk === 'do_spaces' ? 'primex' : null,
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
        if (! $sealUrl) {
            return null;
        }

        // If it's a storage path, try to load it
        try {
            $disk = config('app.env') === 'production' ? 'do_spaces' : 'public';
            if (Storage::disk($disk)->exists($sealUrl)) {
                $content = Storage::disk($disk)->get($sealUrl);

                return 'data:image/png;base64,'.base64_encode($content);
            }
        } catch (\Throwable) {
            // Fall through
        }

        return null;
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
