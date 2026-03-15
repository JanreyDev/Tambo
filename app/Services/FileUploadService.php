<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Admin\Barangay;
use App\Models\Admin\File;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Handles all file uploads across PrimeX BCMP.
 *
 * Image compression is applied server-side for photo/avatar/logo/seal categories
 * before storage — regardless of what the client sends. This keeps DO Spaces lean.
 *
 * Compression targets:
 *   photo / avatar  → JPEG 82%, max 800×1000 px, always .jpg
 *   logo / seal     → PNG, max 512×512 px, always .png (preserves transparency)
 *   all others      → stored as-is (documents, signatures, thumbmarks, attachments)
 */
class FileUploadService
{
    private string $disk;

    /** Max dimensions per category [width, height] */
    private const IMAGE_MAX = [
        'photo' => [800, 1000],
        'avatar' => [400, 400],
        'logo' => [512, 512],
        'seal' => [512, 512],
        'signature' => [600, 300],
        'thumbmark' => [400, 400],
    ];

    /** JPEG quality (1–100) for categories stored as JPEG */
    private const JPEG_QUALITY = 82;

    /** PNG compression level (0–9) for categories stored as PNG */
    private const PNG_COMPRESSION = 7;

    public function __construct()
    {
        $default = config('filesystems.default', 'do_spaces');

        // Local dev: use 'public' disk so files are URL-accessible via /storage
        // Production: use 'do_spaces' for DigitalOcean Spaces
        $this->disk = $default === 'local' ? 'public' : $default;
    }

    /**
     * Upload a file to storage and create a File record.
     * Image categories are automatically compressed before storage.
     */
    public function upload(
        UploadedFile $file,
        string $category,
        string $path,
        ?string $uploadedBy = null,
        ?string $barangayId = null,
        bool $isPublic = false,
    ): File {
        // Compress image if applicable — returns compressed binary + metadata
        $compressed = $this->maybeCompress($file, $category);

        $content = $compressed['content'];
        $mimeType = $compressed['mime_type'];
        $extension = $compressed['extension'];
        $sizeBytes = strlen($content);
        $originalSize = $file->getSize();

        // Check storage capacity BEFORE uploading (use compressed size)
        $barangay = null;
        if ($barangayId) {
            $barangay = Barangay::find($barangayId);
            if ($barangay && ! $barangay->hasStorageCapacity($sizeBytes)) {
                throw new \RuntimeException('Storage limit exceeded for this barangay.');
            }
        }

        $uuid = (string) Str::uuid();
        $storedName = "{$uuid}.{$extension}";
        $fullPath = rtrim($path, '/')."/{$storedName}";

        // Store compressed content
        $visibility = $isPublic ? 'public' : 'private';
        Storage::disk($this->disk)->put($fullPath, $content, $visibility);

        // Build metadata — include compression info for observability
        $meta = [
            'original_extension' => $file->getClientOriginalExtension() ?: 'bin',
            'original_mime' => $file->getMimeType() ?? 'application/octet-stream',
            'disk' => $this->disk,
        ];

        if ($compressed['was_compressed']) {
            $meta['original_size_bytes'] = $originalSize;
            $meta['compressed_size_bytes'] = $sizeBytes;
            $meta['original_dimensions'] = $compressed['original_dimensions'];
            $meta['stored_dimensions'] = $compressed['stored_dimensions'];
            $meta['savings_pct'] = $originalSize > 0
                ? round((1 - $sizeBytes / $originalSize) * 100, 1)
                : 0;
        }

        $fileRecord = File::create([
            'barangay_id' => $barangayId,
            'original_name' => $file->getClientOriginalName(),
            'stored_name' => $storedName,
            'mime_type' => $mimeType,
            'size_bytes' => $sizeBytes,
            'storage_path' => $fullPath,
            'storage_bucket' => config("filesystems.disks.{$this->disk}.bucket", 'local'),
            'uploaded_by' => $uploadedBy,
            'category' => $category,
            'is_public' => $isPublic,
            'metadata' => $meta,
        ]);

        // Track actual (compressed) storage usage on the barangay
        if ($barangayId) {
            $barangay = $barangay ?? Barangay::find($barangayId);
            $barangay?->incrementStorage($sizeBytes);
        }

        return $fileRecord;
    }

    /**
     * Get a temporary signed URL for a private file.
     */
    public function getTemporaryUrl(File $file, int $minutes = 30): string
    {
        return Storage::disk($this->disk)->temporaryUrl(
            $file->storage_path,
            now()->addMinutes($minutes)
        );
    }

    /**
     * Get the public CDN URL for a file.
     */
    public function getPublicUrl(File $file): string
    {
        $cdnBase = config("filesystems.disks.{$this->disk}.url");

        if ($cdnBase) {
            return rtrim($cdnBase, '/').'/'.ltrim($file->storage_path, '/');
        }

        return Storage::disk($this->disk)->url($file->storage_path);
    }

    /**
     * Delete a file from storage and its DB record.
     */
    public function delete(File $file): bool
    {
        $sizeBytes = $file->size_bytes;
        $barangayId = $file->barangay_id;

        Storage::disk($this->disk)->delete($file->storage_path);
        $file->forceDelete();

        if ($barangayId && $sizeBytes > 0) {
            Barangay::find($barangayId)?->decrementStorage($sizeBytes);
        }

        return true;
    }

    /**
     * Upload a user avatar with specific constraints.
     */
    public function uploadAvatar(
        UploadedFile $file,
        string $userId,
        ?string $barangayId = null,
    ): File {
        return $this->upload(
            file: $file,
            category: 'avatar',
            path: 'bcmp/system/avatars',
            uploadedBy: $userId,
            barangayId: $barangayId,
            isPublic: true,
        );
    }

    // ──────────────────────────────────────────────────────────────
    // Image compression
    // ──────────────────────────────────────────────────────────────

    /**
     * Compress and resize an image file if the category requires it.
     *
     * Returns an array with:
     *   content            - binary string to store
     *   mime_type          - final MIME type
     *   extension          - final file extension
     *   was_compressed     - bool
     *   original_dimensions - [w, h] | null
     *   stored_dimensions   - [w, h] | null
     *
     * Falls back to raw file content on any GD failure — never throws.
     */
    private function maybeCompress(UploadedFile $file, string $category): array
    {
        $passthrough = [
            'content' => $file->getContent(),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'extension' => $file->getClientOriginalExtension() ?: 'bin',
            'was_compressed' => false,
            'original_dimensions' => null,
            'stored_dimensions' => null,
        ];

        // Only compress image categories that have max dimensions defined
        if (! isset(self::IMAGE_MAX[$category])) {
            return $passthrough;
        }

        // GD must be available
        if (! extension_loaded('gd')) {
            return $passthrough;
        }

        try {
            $rawContent = $file->getContent();
            $src = @imagecreatefromstring($rawContent);

            if ($src === false) {
                return $passthrough; // unsupported format — store as-is
            }

            $origW = imagesx($src);
            $origH = imagesy($src);

            [$maxW, $maxH] = self::IMAGE_MAX[$category];

            // Calculate target dimensions maintaining aspect ratio
            [$destW, $destH] = $this->fitDimensions($origW, $origH, $maxW, $maxH);

            // Determine output format:
            // logo/seal → PNG (preserve transparency); everything else → JPEG
            $outputAsPng = in_array($category, ['logo', 'seal'], true);

            // Create destination canvas
            $dst = imagecreatetruecolor($destW, $destH);

            if ($outputAsPng) {
                // Preserve alpha channel for logos/seals
                imagealphablending($dst, false);
                imagesavealpha($dst, true);
                $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
                imagefilledrectangle($dst, 0, 0, $destW, $destH, $transparent);
            } else {
                // White background for JPEG (removes any alpha/transparency)
                $white = imagecolorallocate($dst, 255, 255, 255);
                imagefilledrectangle($dst, 0, 0, $destW, $destH, $white);
            }

            imagecopyresampled($dst, $src, 0, 0, 0, 0, $destW, $destH, $origW, $origH);
            imagedestroy($src);

            // Capture output
            ob_start();
            if ($outputAsPng) {
                imagepng($dst, null, self::PNG_COMPRESSION);
            } else {
                imagejpeg($dst, null, self::JPEG_QUALITY);
            }
            $compressed = ob_get_clean();
            imagedestroy($dst);

            if ($compressed === false || $compressed === '') {
                return $passthrough;
            }

            return [
                'content' => $compressed,
                'mime_type' => $outputAsPng ? 'image/png' : 'image/jpeg',
                'extension' => $outputAsPng ? 'png' : 'jpg',
                'was_compressed' => true,
                'original_dimensions' => [$origW, $origH],
                'stored_dimensions' => [$destW, $destH],
            ];

        } catch (\Throwable) {
            // Any GD failure → store original, never break the upload
            return $passthrough;
        }
    }

    /**
     * Calculate target dimensions that fit within maxW × maxH
     * while maintaining the original aspect ratio.
     * Never upscales.
     */
    private function fitDimensions(int $origW, int $origH, int $maxW, int $maxH): array
    {
        if ($origW <= $maxW && $origH <= $maxH) {
            return [$origW, $origH]; // already within limits — no resize
        }

        $scale = min($maxW / $origW, $maxH / $origH);

        return [
            (int) round($origW * $scale),
            (int) round($origH * $scale),
        ];
    }
}
