<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Founder;

use App\Http\Controllers\Controller;
use App\Models\Founder\MabiniConversation;
use App\Models\Founder\SystemAlert;
use App\Services\MabiniFounderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MabiniController extends Controller
{
    public function __construct(
        private readonly MabiniFounderService $mabini,
    ) {}

    /**
     * Chat with Mabini AI.
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:4000'],
            'conversation_id' => ['sometimes', 'nullable', 'string', 'uuid'],
        ]);

        $result = $this->mabini->chat(
            message: $validated['message'],
            conversationId: $validated['conversation_id'] ?? null,
        );

        return response()->json([
            'data' => $result,
        ]);
    }

    /**
     * Get the latest AI-generated insights from system alerts.
     */
    public function insights(): JsonResponse
    {
        $insights = SystemAlert::fromSource('mabini')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn (SystemAlert $alert) => [
                'id' => $alert->id,
                'severity' => $alert->severity,
                'title' => $alert->title,
                'description' => $alert->description,
                'recommendation' => $alert->metadata['recommendation'] ?? null,
                'resolved' => $alert->resolved_at !== null,
                'created_at' => $alert->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'data' => $insights->all(),
        ]);
    }

    /**
     * List recent Mabini conversations.
     */
    public function conversations(): JsonResponse
    {
        $conversations = MabiniConversation::recent(10)
            ->map(fn (MabiniConversation $conv) => [
                'id' => $conv->id,
                'message_count' => count($conv->messages ?? []),
                'first_message' => collect($conv->messages ?? [])
                    ->where('role', 'user')
                    ->first()['content'] ?? null,
                'created_at' => $conv->created_at?->toIso8601String(),
                'updated_at' => $conv->updated_at?->toIso8601String(),
            ]);

        return response()->json([
            'data' => $conversations->all(),
        ]);
    }
}
