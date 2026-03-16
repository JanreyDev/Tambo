<?php

declare(strict_types=1);

namespace App\Services;

use Smalot\PdfParser\Parser;

class ComelecPdfParser
{
    /**
     * Parse a COMELEC PDF (any format) and return an array of voter rows.
     * Each row: ['last_name', 'first_name', 'middle_name', 'full_name', 'precinct_number', 'address', 'application_number']
     */
    public function parse(string $filePath): array
    {
        $parser = new Parser();
        $pdf = $parser->parseFile($filePath);

        $allText = $pdf->getText();
        $lines = preg_split('/\r?\n/', $allText);
        $lines = array_map('trim', $lines);
        $lines = array_filter($lines, fn($l) => $l !== '');
        $lines = array_values($lines);

        return $this->extractVoters($lines);
    }

    private function extractVoters(array $lines): array
    {
        $voters = [];
        $count = count($lines);

        for ($i = 0; $i < $count; $i++) {
            $line = $lines[$i];

            // A voter name line: ALL CAPS, contains a comma, at least 3 chars each side
            // Format: "LASTNAME, FIRSTNAME [MIDDLENAME]"
            // May be preceded by a row number (e.g. "1 AGTARAP, RICA ELLA SANGALANG" or standalone)
            $nameLine = $this->extractNameLine($line);
            if ($nameLine === null) {
                continue;
            }

            // Parse name parts
            $nameParts = $this->parseName($nameLine);
            if ($nameParts === null) {
                continue;
            }

            // Look ahead in next ~6 lines for application number, address, precinct
            $applicationNumber = null;
            $address = null;
            $precinct = null;

            $windowEnd = min($i + 7, $count - 1);
            $addressCandidates = [];

            for ($j = $i + 1; $j <= $windowEnd; $j++) {
                $next = $lines[$j];

                // Application number: "1420-0019C-F1606RSA20000"
                // The 2nd segment IS the precinct (e.g. 0019C, 0026B, 0026P1)
                if ($applicationNumber === null && preg_match('/^(\d{4})-([A-Z0-9]+)-([A-Z0-9]+)$/', $next, $m)) {
                    $applicationNumber = $next;
                    // Extract precinct from 2nd segment — must start with digits and contain a letter
                    // e.g. "0019C", "0026P1" — exclude pure numeric codes
                    if ($precinct === null && preg_match('/^0\d{3}[A-Z][A-Z0-9]*$/', $m[2])) {
                        $precinct = $m[2];
                    }
                    continue;
                }

                // Skip COMELEC header/footer lines
                if ($this->isSkipLine($next)) {
                    continue;
                }

                // Stop at the next voter name
                if ($this->extractNameLine($next) !== null) {
                    break;
                }

                // Collect address candidates (lines with address-like content)
                // Explicitly skip application number patterns so they don't end up as addresses
                if ($this->looksLikeAddress($next)) {
                    $addressCandidates[] = $next;
                }
            }

            // If precinct still null (app number format didn't match), try standalone precinct line
            // Must have at least one letter to exclude pure years like 2024
            if ($precinct === null) {
                for ($j = $i + 1; $j <= $windowEnd; $j++) {
                    $candidate = trim($lines[$j]);
                    if (preg_match('/^(0\d{3}[A-Z][A-Z0-9]*)$/', $candidate, $m)) {
                        $precinct = $m[1];
                        break;
                    }
                }
            }

            $address = implode(' ', $addressCandidates);
            if (empty($address)) {
                // Fallback: first non-special, non-app-number line after name
                for ($j = $i + 1; $j <= min($i + 5, $count - 1); $j++) {
                    $next = $lines[$j];
                    if (!$this->isSkipLine($next)
                        && $this->extractNameLine($next) === null
                        && !preg_match('/^\d{4}-[A-Z0-9]+-[A-Z0-9]+$/', $next)
                        && strlen($next) > 5) {
                        $address = $next;
                        break;
                    }
                }
            }

            // Only add if we have at least a name and precinct
            if ($precinct !== null) {
                $voters[] = array_merge($nameParts, [
                    'precinct_number' => strtoupper(trim($precinct)),
                    'address' => $this->normalizeAddress($address ?? ''),
                    'application_number' => $applicationNumber,
                ]);
            }
        }

        return $voters;
    }

    /**
     * Extract the name portion from a line.
     * Lines may be "1 AGTARAP, RICA ELLA SANGALANG" or just "AGTARAP, RICA ELLA SANGALANG".
     * Returns null if no name found.
     */
    private function extractNameLine(string $line): ?string
    {
        // Strip leading row number if present (e.g. "1 " or "16 ")
        $stripped = preg_replace('/^\d{1,4}\s+/', '', $line);

        // Must contain a comma, both sides uppercase
        if (!str_contains($stripped, ',')) {
            return null;
        }

        [$beforeComma, $afterComma] = explode(',', $stripped, 2);
        $beforeComma = trim($beforeComma);
        $afterComma = trim($afterComma);

        // Both parts must be non-empty
        if (empty($beforeComma) || empty($afterComma)) {
            return null;
        }

        // Before comma: uppercase letters, spaces, periods, hyphens, Ñ (lastname)
        // After comma: uppercase letters, spaces, periods, hyphens, Ñ (firstname middlename)
        if (!preg_match('/^[A-ZÁÉÍÓÚÑ\s\-\.]+$/u', $beforeComma)) {
            return null;
        }
        if (!preg_match('/^[A-ZÁÉÍÓÚÑ\s\-\.]+$/u', $afterComma)) {
            return null;
        }

        // Minimum length checks
        if (strlen($beforeComma) < 2 || strlen($afterComma) < 2) {
            return null;
        }

        // Reject known non-name headers
        $skipWords = ['APPLICATION NO', 'TYPE OF APPLICATION', 'VOTER', 'NAME OF APPLICANT', 'PROVINCE', 'CITY', 'MUNICIPALITY', 'BARANGAY'];
        foreach ($skipWords as $skip) {
            if (str_contains(strtoupper($stripped), $skip)) {
                return null;
            }
        }

        return $stripped;
    }

    /**
     * Parse "LASTNAME, FIRSTNAME MIDDLENAME" into parts.
     */
    private function parseName(string $nameLine): ?array
    {
        // Strip leading row number
        $nameLine = preg_replace('/^\d{1,4}\s+/', '', $nameLine);
        $nameLine = trim($nameLine);

        if (!str_contains($nameLine, ',')) {
            return null;
        }

        [$lastRaw, $restRaw] = explode(',', $nameLine, 2);
        $lastName = $this->toTitleCase(trim($lastRaw));
        $rest = trim($restRaw);

        // Split rest into first name (first word) and middle name (remaining)
        $parts = preg_split('/\s+/', $rest, 2);
        $firstName = $this->toTitleCase($parts[0] ?? '');
        $middleName = isset($parts[1]) && $parts[1] !== '' ? $this->toTitleCase($parts[1]) : null;

        if (empty($firstName) || empty($lastName)) {
            return null;
        }

        $fullName = strtoupper($lastRaw) . ', ' . strtoupper($rest);

        return [
            'last_name' => $lastName,
            'first_name' => $firstName,
            'middle_name' => $middleName,
            'full_name' => $fullName,
        ];
    }

    private function isSkipLine(string $line): bool
    {
        $skipPatterns = [
            '/^NEW REGISTRATION/i',
            '/^TRANSFER FROM/i',
            '/^TRANSFER WITHIN/i',
            '/^CHANGE OF NAME/i',
            '/^CORRECTION OF/i',
            '/^REACTIVATION/i',
            '/^TRANSFER WITH/i',
            '/^NOTICE:/i',
            '/^HASH:/i',
            '/^Date:/i',
            '/^Page \d+/i',
            '/^Republic of the Philippines/i',
            '/^COMMISSION ON ELECTIONS/i',
            '/^Office of the/i',
            '/^PROVINCE/i',
            '/^CITY \/ MUNICIPALITY/i',
            '/^BARANGAY/i',
            '/^NOTICE OF HEARING/i',
            '/^Period Covered/i',
            '/^Pursuant to/i',
            '/^following application/i',
            '/^No\.\s+Application/i',
            '/^Type of Application/i',
        ];

        foreach ($skipPatterns as $pattern) {
            if (preg_match($pattern, $line)) {
                return true;
            }
        }

        return false;
    }

    private function looksLikeAddress(string $line): bool
    {
        // Address lines typically contain BLK, LOT, ST, AVE, DR, AREA, PHASE, PUROK, etc.
        return (bool) preg_match('/\b(BLK|BLOCK|LOT|ST\.|STREET|AVE|AVENUE|DR\.|DRIVE|ROAD|RD\.|AREA|PHASE|PUROK|SITIO|BRGY|BARANGAY|KATAHIMIKAN|MAAGAP|MATATAG|RANCHO|LIBIS|EXCESS)\b/i', $line);
    }

    private function normalizeAddress(string $address): string
    {
        $address = preg_replace('/\s+/', ' ', $address);
        return trim($address);
    }

    /**
     * Convert ALL CAPS to Title Case, handling Filipino names (Sta., de los, etc.)
     */
    private function toTitleCase(string $str): string
    {
        $str = mb_strtolower($str);
        // Capitalize after spaces and hyphens
        $str = preg_replace_callback('/(?:^|[\s\-])([a-záéíóúñ])/u', function ($m) {
            return str_replace($m[1], mb_strtoupper($m[1]), $m[0]);
        }, $str);
        return $str;
    }
}
