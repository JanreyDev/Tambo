<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\PublicPortal\BarangayPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BarangayPostController extends Controller
{
    /**
     * List barangay posts with filters.
     *
     * GET /api/v1/posts
     */
    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = BarangayPost::where('barangay_id', $barangayId);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                    ->orWhere('content', 'ilike', "%{$search}%");
            });
        }

        if ($category = $request->get('category')) {
            $query->where('category', $category);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($request->has('is_pinned')) {
            $query->where('is_pinned', $request->boolean('is_pinned'));
        }

        $sortBy = $request->get('sort_by', 'published_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['title', 'category', 'published_at', 'is_pinned', 'status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get a single post.
     *
     * GET /api/v1/posts/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $post = BarangayPost::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        return response()->json(['post' => $post]);
    }

    /**
     * Create a new barangay post.
     *
     * POST /api/v1/posts
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'cover_image_file_id' => ['nullable', 'uuid'],
            'is_pinned' => ['boolean'],
            'status' => ['nullable', 'in:draft,published,archived'],
            'published_at' => ['nullable', 'date'],
        ]);

        $post = BarangayPost::create([
            ...$validated,
            'barangay_id' => $request->user()->barangay_id,
            'author_id' => $request->user()->id,
            'status' => $validated['status'] ?? 'draft',
            'published_at' => ($validated['status'] ?? 'draft') === 'published'
                ? ($validated['published_at'] ?? now())
                : ($validated['published_at'] ?? null),
        ]);

        return response()->json([
            'message' => 'Post created.',
            'post' => $post,
        ], 201);
    }

    /**
     * Update a post.
     *
     * PUT /api/v1/posts/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $post = BarangayPost::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'content' => ['sometimes', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'cover_image_file_id' => ['nullable', 'uuid'],
            'is_pinned' => ['boolean'],
            'status' => ['sometimes', 'in:draft,published,archived'],
            'published_at' => ['nullable', 'date'],
        ]);

        // Auto-set published_at when status changes to published
        if (isset($validated['status']) && $validated['status'] === 'published' && ! $post->published_at) {
            $validated['published_at'] = $validated['published_at'] ?? now();
        }

        $post->update($validated);

        return response()->json([
            'message' => 'Post updated.',
            'post' => $post->fresh(),
        ]);
    }

    /**
     * Delete a post.
     *
     * DELETE /api/v1/posts/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $post = BarangayPost::where('barangay_id', $request->user()->barangay_id)
            ->findOrFail($id);

        $post->delete();

        return response()->json(['message' => 'Post deleted.']);
    }
}
