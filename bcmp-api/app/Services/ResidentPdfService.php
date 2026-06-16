<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Admin\Barangay;
use App\Models\Tenant\Resident;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class ResidentPdfService
{
    /**
     * Generate a PDF record card for a resident.
     * Returns the raw PDF binary string.
     *
     * @param  Resident  $resident  The resident whose record is being printed.
     * @param  Barangay  $barangay  The issuing barangay.
     * @param  User|null  $printingUser  The staff member who triggered the print.
     */
    public function generate(Resident $resident, Barangay $barangay, ?User $printingUser = null): string
    {
        $data = $this->buildViewData($resident, $barangay, $printingUser);

        $pdf = Pdf::loadView('pdf.resident-record', $data)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'defaultFont' => 'sans-serif',
                'dpi' => 150,
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => false, // all images embedded as base64
            ]);

        return $pdf->output();
    }

    /**
     * Assemble all view data for the Blade template.
     */
    private function buildViewData(Resident $resident, Barangay $barangay, ?User $printingUser = null): array
    {
        // ── Decrypt government IDs ──
        $govIds = $this->decryptGovIds($resident);

        // ── Photo as base64 data URI ──
        $photoDataUri = $this->getPhotoDataUri($resident);

        // ── Printed by ──
        $printedBy = $printingUser
            ? trim(($printingUser->first_name ?? '').' '.($printingUser->last_name ?? ''))
                ?: $printingUser->username
            : 'System';

        // ── Barangay seal/logo as base64 ──
        $barangaySeal = null;

        // ── Sectoral tags ──
        $sectoralTags = $resident->sectoralTags->pluck('sector')->toArray();

        // ── Age calculation ──
        $age = $resident->date_of_birth ? $resident->date_of_birth->age : null;

        // ── Name ──
        $fullName = implode(' ', array_filter([
            $resident->last_name.($resident->extension_name ? ' '.$resident->extension_name : '').',',
            $resident->first_name,
            $resident->middle_name ? strtoupper(substr($resident->middle_name, 0, 1)).'.' : null,
        ]));

        return [
            'resident' => $resident,
            'barangay' => $barangay,
            'fullName' => $fullName,
            'age' => $age,
            'govIds' => $govIds,
            'photoDataUri' => $photoDataUri,
            'barangaySeal' => $barangaySeal,
            'sectoralTags' => $sectoralTags,
            'printedBy' => $printedBy,
            'printedAt' => now()->setTimezone('Asia/Manila')->format('F d, Y h:i A'),
        ];
    }

    /**
     * Decrypt all encrypted government ID fields.
     */
    private function decryptGovIds(Resident $resident): array
    {
        $map = [
            'philhealth_number' => 'philhealth_number_encrypted',
            'sss_gsis_number' => 'sss_gsis_number_encrypted',
            'pagibig_number' => 'pagibig_number_encrypted',
            'tin_number' => 'tin_number_encrypted',
            'pwd_id' => 'pwd_id_encrypted',
            'senior_citizen_id' => 'senior_citizen_id_encrypted',
        ];

        $result = [];
        foreach ($map as $plainKey => $encryptedKey) {
            $encrypted = $resident->getRawOriginal($encryptedKey);
            if (empty($encrypted)) {
                $result[$plainKey] = null;

                continue;
            }
            try {
                $result[$plainKey] = decrypt($encrypted);
            } catch (\Throwable) {
                // Stored unencrypted (legacy) — use as-is
                $result[$plainKey] = $encrypted;
            }
        }

        return $result;
    }

    /**
     * Load the resident photo from storage and return it as a base64 data URI.
     * DOMPDF cannot make authenticated HTTP requests, so we embed the image directly.
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
}
