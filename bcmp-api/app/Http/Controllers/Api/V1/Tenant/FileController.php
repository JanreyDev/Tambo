<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Admin\File;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * Tenant-scoped file upload and management.
 *
 * Handles uploads for resident biometrics (photos, signatures, thumbmarks),
 * documents, seals, logos, and other file categories. All uploads are tracked
 * in the files table and count toward barangay storage limits.
 */
class FileController extends Controller
{
    /** Allowed upload categories and their max file sizes (in KB). */
    private const CATEGORY_LIMITS = [
        'photo' => 5120,          // 5 MB
        'signature' => 2048,      // 2 MB
        'thumbmark' => 2048,      // 2 MB
        'document' => 10240,      // 10 MB
        'seal' => 5120,           // 5 MB
        'logo' => 5120,           // 5 MB
        'attachment' => 10240,    // 10 MB
    ];

    /** Allowed MIME types per category. */
    private const CATEGORY_MIMES = [
        'photo' => ['image/jpeg', 'image/png', 'image/webp'],
        'signature' => ['image/jpeg', 'image/png', 'image/webp'],
        'thumbmark' => ['image/jpeg', 'image/png', 'image/webp'],
        'document' => ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'seal' => ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        'logo' => ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        'attachment' => ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ];

    public function __construct(
        private readonly FileUploadService $uploadService,
    ) {}

    /**
     * Upload a file.
     *
     * POST /api/v1/files
     *
     * Accepts multipart form data with:
     * - file: the uploaded file
     * - category: photo|signature|thumbmark|document|seal|logo|attachment
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'category' => ['required', 'string', Rule::in(array_keys(self::CATEGORY_LIMITS))],
            'file' => ['required', 'file'],
        ]);

        $category = $request->input('category');
        $uploadedFile = $request->file('file');

        // Validate file size per category
        $maxKb = self::CATEGORY_LIMITS[$category];
        if ($uploadedFile->getSize() > $maxKb * 1024) {
            return response()->json([
                'message' => "File too large. Maximum size for {$category} is ".($maxKb >= 1024 ? ($maxKb / 1024).' MB' : $maxKb.' KB').'.',
            ], 422);
        }

        // Validate MIME type per category
        $allowedMimes = self::CATEGORY_MIMES[$category] ?? [];
        if (! empty($allowedMimes) && ! in_array($uploadedFile->getMimeType(), $allowedMimes, true)) {
            return response()->json([
                'message' => 'File type not allowed for this category.',
                'allowed_types' => $allowedMimes,
            ], 422);
        }

        $barangayId = $request->user()->barangay_id;
        $userId = $request->user()->id;

        // Build storage path: bcmp/{barangay_id}/{category}
        $path = "bcmp/{$barangayId}/{$category}s";

        // Determine if file should be public (photos for display, seals/logos)
        $isPublic = in_array($category, ['photo', 'seal', 'logo'], true);

        try {
            $file = $this->uploadService->upload(
                file: $uploadedFile,
                category: $category,
                path: $path,
                uploadedBy: $userId,
                barangayId: $barangayId,
                isPublic: $isPublic,
            );

            Log::info('File uploaded', [
                'file_id' => $file->id,
                'category' => $category,
                'size_bytes' => $file->size_bytes,
                'barangay_id' => $barangayId,
                'uploaded_by' => $userId,
            ]);

            return response()->json([
                'message' => 'File uploaded successfully.',
                'file' => [
                    'id' => $file->id,
                    'original_name' => $file->original_name,
                    'mime_type' => $file->mime_type,
                    'size_bytes' => $file->size_bytes,
                    'category' => $file->category,
                    'is_public' => $file->is_public,
                    'url' => $file->is_public
                        ? $this->uploadService->getPublicUrl($file)
                        : null,
                ],
            ], 201);

        } catch (\RuntimeException $e) {
            if (str_contains($e->getMessage(), 'Storage limit exceeded')) {
                return response()->json([
                    'message' => 'Storage limit exceeded. Contact your administrator to upgrade your plan.',
                ], 422);
            }

            throw $e;
        }
    }

    /**
     * Get a temporary URL for a private file.
     *
     * GET /api/v1/files/{id}/url
     */
    public function url(Request $request, string $id): JsonResponse
    {
        $file = File::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        if ($file->is_public) {
            return response()->json([
                'url' => $this->uploadService->getPublicUrl($file),
                'expires_in' => null,
            ]);
        }

        return response()->json([
            'url' => $this->uploadService->getTemporaryUrl($file, 30),
            'expires_in' => 30, // minutes
        ]);
    }

    /**
     * Delete a file.
     *
     * DELETE /api/v1/files/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $file = File::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        Log::info('File deleted', [
            'file_id' => $file->id,
            'category' => $file->category,
            'size_bytes' => $file->size_bytes,
            'barangay_id' => $file->barangay_id,
            'deleted_by' => $request->user()->id,
        ]);

        $this->uploadService->delete($file);

        return response()->json(['message' => 'File deleted.']);
    }
}
