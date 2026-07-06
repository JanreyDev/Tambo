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
     * Get the latest AI-generated insight summary.
     * Returns MabiniInsight format: summary, analyzed_at, highlights[].
     */
    public function insights(): JsonResponse
    {
        $insights = SystemAlert::fromSource('mabini')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        if ($insights->isEmpty()) {
            return response()->json([
                'data' => [
                    'summary' => 'No automated insights generated yet. Mabini AI will analyze your infrastructure periodically and provide actionable recommendations.',
                    'analyzed_at' => now()->toIso8601String(),
                    'highlights' => [
                        'Mabini AI is active and monitoring your infrastructure',
                        'Use the chat panel to ask questions about your systems',
                    ],
                ],
            ]);
        }

        $latest = $insights->first();
        $highlights = $insights->map(fn (SystemAlert $alert) => $alert->title)->all();

        return response()->json([
            'data' => [
                'summary' => $latest->description ?? 'System analysis complete.',
                'analyzed_at' => $latest->created_at?->toIso8601String() ?? now()->toIso8601String(),
                'highlights' => $highlights,
            ],
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
