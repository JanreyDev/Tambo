<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Platform\AiConversation;
use App\Services\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AiController extends Controller
{
    public function __construct(
        private readonly AiService $aiService,
    ) {}

    /**
     * GET /ai/credits
     * Get AI credit balance and usage stats for the current user/barangay.
     */
    public function credits(Request $request): JsonResponse
    {
        $user = $request->user();
        $barangay = $user->barangay;

        $totalUsed = AiConversation::where('barangay_id', $barangay->id)
            ->sum('credit_cost');

        $userUsed = AiConversation::where('barangay_id', $barangay->id)
            ->forUser($user->id)
            ->sum('credit_cost');

        $conversationCount = AiConversation::where('barangay_id', $barangay->id)
            ->forUser($user->id)
            ->active()
            ->count();

        $estimatedCost = AiService::estimateMessageCost($barangay);

        return response()->json([
            'balance' => (float) $barangay->ai_credit_balance,
            'estimated_cost_per_message' => $estimatedCost,
            'estimated_messages_remaining' => $estimatedCost > 0
                ? (int) floor($barangay->ai_credit_balance / $estimatedCost)
                : 0,
            'total_used_by_barangay' => (float) $totalUsed,
            'total_used_by_user' => (float) $userUsed,
            'conversation_count' => $conversationCount,
        ]);
    }

    /**
     * GET /ai/conversations
     * List the current user's conversations (paginated, newest first).
     */
    public function index(Request $request): JsonResponse
    {
        $conversations = AiConversation::where('barangay_id', $request->user()->barangay_id)
            ->forUser($request->user()->id)
            ->active()
            ->orderByDesc('updated_at')
            ->select(['id', 'title', 'module_context', 'tokens_used', 'credit_cost', 'created_at', 'updated_at'])
            ->paginate(20);

        return response()->json($conversations);
    }

    /**
     * POST /ai/conversations
     * Create a new conversation and stream the first AI response.
     */
    public function store(Request $request): StreamedResponse|JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:'.(int) config('services.anthropic.max_input_length', 2000)],
            'module_context' => ['nullable', 'string', 'max:50'],
        ]);

        $user = $request->user();
        $barangay = $user->barangay;

        if (! AiService::hasMinimumCredits($barangay)) {
            return response()->json([
                'message' => 'Insufficient AI credits.',
                'balance' => (float) $barangay->ai_credit_balance,
                'estimated_cost' => AiService::estimateMessageCost($barangay),
            ], 402);
        }

        $conversation = AiConversation::create([
            'barangay_id' => $barangay->id,
            'user_id' => $user->id,
            'title' => Str::limit($validated['message'], 100),
            'module_context' => $validated['module_context'] ?? null,
            'messages' => [],
            'status' => 'active',
        ]);

        return $this->aiService->streamMessage(
            $conversation,
            $validated['message'],
            $barangay,
            $user,
        );
    }

    /**
     * GET /ai/conversations/{conversation}
     * Get a conversation with full message history.
     */
    public function show(Request $request, AiConversation $conversation): JsonResponse
    {
        if ($conversation->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized.');
        }

        return response()->json([
            'conversation' => $conversation,
        ]);
    }

    /**
     * POST /ai/conversations/{conversation}/messages
     * Send a message in an existing conversation (streams response).
     */
    public function sendMessage(Request $request, AiConversation $conversation): StreamedResponse|JsonResponse
    {
        if ($conversation->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized.');
        }

        if ($conversation->status !== 'active') {
            return response()->json([
                'message' => 'This conversation has been archived.',
            ], 422);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:'.(int) config('services.anthropic.max_input_length', 2000)],
        ]);

        $barangay = $request->user()->barangay;

        if (! AiService::hasMinimumCredits($barangay)) {
            return response()->json([
                'message' => 'Insufficient AI credits.',
                'balance' => (float) $barangay->ai_credit_balance,
                'estimated_cost' => AiService::estimateMessageCost($barangay),
            ], 402);
        }

        $maxMessages = (int) config('services.anthropic.max_conversation_messages', 50);
        if ($conversation->getMessageCount() >= $maxMessages) {
            return response()->json([
                'message' => 'Conversation has reached the maximum message limit. Please start a new conversation.',
                'max_messages' => $maxMessages,
            ], 422);
        }

        return $this->aiService->streamMessage(
            $conversation,
            $validated['message'],
            $barangay,
            $request->user(),
        );
    }

    /**
     * DELETE /ai/conversations/{conversation}
     * Archive a conversation (soft delete).
     */
    public function destroy(Request $request, AiConversation $conversation): JsonResponse
    {
        if ($conversation->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized.');
        }

        $conversation->update(['status' => 'archived']);

        return response()->json([
            'message' => 'Conversation archived.',
        ]);
    }
}
