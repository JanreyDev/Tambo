<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Admin\File;
use App\Models\Drive\DriveFolder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DriveController extends Controller
{
    // ── Folders ────────────────────────────────────────────────────────

    /**
     * GET /api/v1/drive/folders
     */
    public function folders(Request $request): JsonResponse
    {
        $user = $request->user();

        $folders = DriveFolder::where('barangay_id', $user->barangay_id)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhere('is_shared_with_barangay', true);
            })
            ->whereNull('parent_id')
            ->withCount(['children as folder_count'])
            ->orderBy('name')
            ->get();

        return response()->json(['folders' => $folders]);
    }

    /**
     * GET /api/v1/drive/folders/{id}
     */
    public function folder(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $folder = DriveFolder::where('barangay_id', $user->barangay_id)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhere('is_shared_with_barangay', true);
            })
            ->with(['children' => fn ($q) => $q->withCount('children')])
            ->findOrFail($id);

        $files = File::where('barangay_id', $user->barangay_id)
            ->where('drive_folder_id', $id)
            ->where(function ($q) use ($user) {
                $q->where('drive_owner_id', $user->id)
                    ->orWhere('drive_shared_with_barangay', true);
            })
            ->orderBy('original_name')
            ->get();

        return response()->json([
            'folder' => $folder,
            'files' => $files,
        ]);
    }

    /**
     * POST /api/v1/drive/folders
     */
    public function createFolder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'uuid'],
            'color' => ['nullable', 'string', 'max:20'],
            'is_shared_with_barangay' => ['boolean'],
        ]);

        $user = $request->user();

        $folder = DriveFolder::create([
            ...$validated,
            'barangay_id' => $user->barangay_id,
            'user_id' => $user->id,
        ]);

        return response()->json(['folder' => $folder], 201);
    }

    /**
     * PATCH /api/v1/drive/folders/{id}
     */
    public function updateFolder(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $folder = DriveFolder::where('barangay_id', $user->barangay_id)
            ->where('user_id', $user->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:20'],
            'is_shared_with_barangay' => ['boolean'],
        ]);

        $folder->update($validated);

        return response()->json(['folder' => $folder->fresh()]);
    }

    /**
     * DELETE /api/v1/drive/folders/{id}
     */
    public function deleteFolder(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        DriveFolder::where('barangay_id', $user->barangay_id)
            ->where('user_id', $user->id)
            ->findOrFail($id)
            ->delete();

        return response()->json(['message' => 'Folder deleted.']);
    }

    // ── Files ──────────────────────────────────────────────────────────

    /**
     * GET /api/v1/drive/files
     */
    public function files(Request $request): JsonResponse
    {
        $user = $request->user();
        $search = $request->get('search');

        $query = File::where('barangay_id', $user->barangay_id)
            ->whereNull('drive_folder_id')
            ->where(function ($q) use ($user) {
                $q->where('drive_owner_id', $user->id)
                    ->orWhere('drive_shared_with_barangay', true);
            });

        if ($search) {
            $query->where('original_name', 'ilike', "%{$search}%");
        }

        $files = $query->orderBy('created_at', 'desc')->get();

        return response()->json(['files' => $files]);
    }

    /**
     * POST /api/v1/drive/files
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:102400'],
            'folder_id' => ['nullable', 'uuid'],
            'is_shared_with_barangay' => ['boolean'],
        ]);

        $user = $request->user();
        $uploadedFile = $request->file('file');
        $originalName = $uploadedFile->getClientOriginalName();
        $storedName = Str::uuid().'.'.$uploadedFile->getClientOriginalExtension();
        $storagePath = "bcmp/{$user->barangay_id}/drive/{$user->id}/{$storedName}";

        Storage::disk('spaces')->put($storagePath, file_get_contents($uploadedFile), 'private');

        $file = File::create([
            'barangay_id' => $user->barangay_id,
            'original_name' => $originalName,
            'stored_name' => $storedName,
            'mime_type' => $uploadedFile->getMimeType(),
            'size_bytes' => $uploadedFile->getSize(),
            'storage_path' => $storagePath,
            'storage_bucket' => 'primex',
            'uploaded_by' => $user->id,
            'category' => 'attachment',
            'is_public' => false,
            'drive_folder_id' => $request->input('folder_id'),
            'drive_owner_id' => $user->id,
            'drive_shared_with_barangay' => $request->boolean('is_shared_with_barangay', false),
        ]);

        return response()->json(['file' => $file], 201);
    }

    /**
     * GET /api/v1/drive/files/{id}/download
     */
    public function download(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $file = File::where('barangay_id', $user->barangay_id)
            ->where(function ($q) use ($user) {
                $q->where('drive_owner_id', $user->id)
                    ->orWhere('drive_shared_with_barangay', true);
            })
            ->findOrFail($id);

        $url = Storage::disk('spaces')->temporaryUrl($file->storage_path, now()->addMinutes(10));

        return response()->json(['url' => $url]);
    }

    /**
     * DELETE /api/v1/drive/files/{id}
     */
    public function deleteFile(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $file = File::where('barangay_id', $user->barangay_id)
            ->where('drive_owner_id', $user->id)
            ->findOrFail($id);

        Storage::disk('spaces')->delete($file->storage_path);
        $file->delete();

        return response()->json(['message' => 'File deleted.']);
    }

    /**
     * PATCH /api/v1/drive/files/{id}
     */
    public function updateFile(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $file = File::where('barangay_id', $user->barangay_id)
            ->where('drive_owner_id', $user->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'original_name' => ['sometimes', 'string', 'max:255'],
            'drive_folder_id' => ['nullable', 'uuid'],
            'drive_shared_with_barangay' => ['boolean'],
        ]);

        $file->update($validated);

        return response()->json(['file' => $file->fresh()]);
    }

    // ── Stats ──────────────────────────────────────────────────────────

    /**
     * GET /api/v1/drive/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $myFiles = File::where('barangay_id', $user->barangay_id)
            ->where('drive_owner_id', $user->id);

        $totalSize = $myFiles->clone()->sum('size_bytes');
        $fileCount = $myFiles->clone()->count();
        $folderCount = DriveFolder::where('barangay_id', $user->barangay_id)
            ->where('user_id', $user->id)
            ->count();
        $sharedCount = File::where('barangay_id', $user->barangay_id)
            ->where('drive_shared_with_barangay', true)
            ->where('drive_owner_id', '!=', $user->id)
            ->count();

        return response()->json([
            'total_size' => $totalSize,
            'file_count' => $fileCount,
            'folder_count' => $folderCount,
            'shared_with_me' => $sharedCount,
        ]);
    }
}
