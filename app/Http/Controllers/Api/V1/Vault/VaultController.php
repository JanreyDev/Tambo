<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Vault;

use App\Http\Controllers\Controller;
use App\Models\Vault\VaultAccessLog;
use App\Models\Vault\VaultEntry;
use App\Models\Vault\VaultSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VaultController extends Controller
{
    /**
     * Get all vault categories with entry counts.
     */
    public function categories(Request $request): JsonResponse
    {
        /** @var VaultSession $session */
        $session = $request->attributes->get('vault_session');

        $categories = VaultEntry::active()
            ->selectRaw('category, COUNT(*) as entry_count')
            ->groupBy('category')
            ->pluck('entry_count', 'category');

        VaultAccessLog::log(
            vaultSessionId: $session->id,
            action: 'view_categories',
            resourceType: 'vault_category',
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'data' => $categories,
        ]);
    }

    /**
     * Get all entries for a specific category.
     */
    public function entriesByCategory(Request $request, string $category): JsonResponse
    {
        /** @var VaultSession $session */
        $session = $request->attributes->get('vault_session');

        if (! in_array($category, VaultEntry::CATEGORIES, true)) {
            return response()->json([
                'message' => 'Invalid category.',
            ], 404);
        }

        $entries = VaultEntry::active()
            ->inCategory($category)
            ->get()
            ->map(fn (VaultEntry $entry) => [
                'id' => $entry->id,
                'title' => $entry->title,
                'content' => $entry->getContent(),
                'sort_order' => $entry->sort_order,
                'metadata' => $entry->metadata,
                'updated_at' => $entry->updated_at?->toIso8601String(),
            ]);

        VaultAccessLog::log(
            vaultSessionId: $session->id,
            action: 'view_category',
            resourceType: 'vault_category',
            resourceId: $category,
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
            metadata: ['entry_count' => $entries->count()],
        );

        return response()->json([
            'data' => $entries->all(),
        ]);
    }

    /**
     * Get the step-by-step guide (guide category, ordered).
     */
    public function guide(Request $request): JsonResponse
    {
        /** @var VaultSession $session */
        $session = $request->attributes->get('vault_session');

        $steps = VaultEntry::active()
            ->inCategory('guide')
            ->get()
            ->map(fn (VaultEntry $entry) => [
                'id' => $entry->id,
                'step_number' => $entry->sort_order,
                'title' => $entry->title,
                'content' => $entry->getContent(),
                'metadata' => $entry->metadata,
            ]);

        VaultAccessLog::log(
            vaultSessionId: $session->id,
            action: 'view_guide',
            resourceType: 'vault_guide',
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'data' => $steps->all(),
        ]);
    }

    /**
     * Get a single entry by ID.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        /** @var VaultSession $session */
        $session = $request->attributes->get('vault_session');

        $entry = VaultEntry::active()->find($id);

        if ($entry === null) {
            return response()->json([
                'message' => 'Entry not found.',
            ], 404);
        }

        VaultAccessLog::log(
            vaultSessionId: $session->id,
            action: 'view_entry',
            resourceType: 'vault_entry',
            resourceId: $entry->id,
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
            metadata: ['category' => $entry->category],
        );

        return response()->json([
            'data' => [
                'id' => $entry->id,
                'category' => $entry->category,
                'title' => $entry->title,
                'content' => $entry->getContent(),
                'sort_order' => $entry->sort_order,
                'metadata' => $entry->metadata,
                'updated_at' => $entry->updated_at?->toIso8601String(),
            ],
        ]);
    }
}
