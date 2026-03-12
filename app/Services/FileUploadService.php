<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Admin\Barangay;
use App\Models\Admin\File;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadService
{
    private string $disk;

    public function __construct()
    {
        $default = config('filesystems.default', 'do_spaces');

        // Local dev: use 'public' disk so files are URL-accessible via /storage
        // Production: use 'do_spaces' for DigitalOcean Spaces
        $this->disk = $default === 'local' ? 'public' : $default;
    }

    /**
     * Upload a file to storage and create a File record.
     *
     * @param  UploadedFile  $file  The uploaded file
     * @param  string  $category  File category (photo, signature, thumbmark, document, seal, logo, avatar)
     * @param  string  $path  Storage path prefix (e.g., "bcmp/{barangay_id}/residents/photos")
     * @param  string|null  $uploadedBy  User UUID who uploaded
     * @param  string|null  $barangayId  Barangay UUID for tenant scoping
     * @param  bool  $isPublic  Whether file is publicly accessible
     */
    public function upload(
        UploadedFile $file,
        string $category,
        string $path,
        ?string $uploadedBy = null,
        ?string $barangayId = null,
        bool $isPublic = false,
    ): File {
        $sizeBytes = $file->getSize();

        // Check storage capacity BEFORE uploading
        $barangay = null;
        if ($barangayId) {
            $barangay = Barangay::find($barangayId);
            if ($barangay && ! $barangay->hasStorageCapacity($sizeBytes)) {
                throw new \RuntimeException('Storage limit exceeded for this barangay.');
            }
        }

        $uuid = (string) Str::uuid();
        $extension = $file->getClientOriginalExtension() ?: 'bin';
        $storedName = "{$uuid}.{$extension}";
        $fullPath = rtrim($path, '/')."/{$storedName}";

        // Upload to storage
        $visibility = $isPublic ? 'public' : 'private';
        Storage::disk($this->disk)->put($fullPath, $file->getContent(), $visibility);

        // Create file record
        $fileRecord = File::create([
            'barangay_id' => $barangayId,
            'original_name' => $file->getClientOriginalName(),
            'stored_name' => $storedName,
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size_bytes' => $sizeBytes,
            'storage_path' => $fullPath,
            'storage_bucket' => config("filesystems.disks.{$this->disk}.bucket", 'local'),
            'uploaded_by' => $uploadedBy,
            'category' => $category,
            'is_public' => $isPublic,
            'metadata' => [
                'original_extension' => $extension,
                'disk' => $this->disk,
            ],
        ]);

        // Track storage usage on the barangay
        if ($barangayId) {
            $barangay = $barangay ?? Barangay::find($barangayId);
            $barangay?->incrementStorage($sizeBytes);
        }

        return $fileRecord;
    }

    /**
     * Get a temporary signed URL for a file (private files).
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

        // Decrement storage usage on the barangay
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
}
